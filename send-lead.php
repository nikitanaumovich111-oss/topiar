<?php
// GORODSVETA — приём заявок с сайта и отправка в Telegram.
// Секреты не хранятся в HTML/JS и не должны попадать в Git.

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function fail(int $code, string $msg): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'Method not allowed');
}

// Конфиг можно хранить:
// 1) на уровень выше публичной папки: ../topiar-config.php
// 2) рядом с этим файлом: config.php
// 3) в переменных окружения TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID
$config = null;
$configPaths = [__DIR__ . '/../topiar-config.php', __DIR__ . '/config.php'];

foreach ($configPaths as $path) {
    if (is_file($path)) {
        $loaded = require $path;
        if (is_array($loaded)) {
            $config = $loaded;
            break;
        }
    }
}

if (!is_array($config)) {
    $config = [];
}

$botToken = trim((string)($config['bot_token'] ?? getenv('TELEGRAM_BOT_TOKEN') ?: ''));
$chatId   = trim((string)($config['chat_id'] ?? getenv('TELEGRAM_CHAT_ID') ?: ''));

if ($botToken === '' || $chatId === '' ||
    $botToken === 'НОВЫЙ_ТОКЕН_ОТ_BOTFATHER' ||
    $chatId === 'ВАШ_CHAT_ID') {
    fail(500, 'Telegram is not configured on the server');
}

// Защита от запросов с чужих сайтов.
$allowed = $config['allowed_hosts'] ?? ['topiar.by', 'www.topiar.by'];
$originHeader = $_SERVER['HTTP_ORIGIN'] ?? '';
$refererHeader = $_SERVER['HTTP_REFERER'] ?? '';
$origin = parse_url($originHeader ?: $refererHeader, PHP_URL_HOST);

if ($allowed && $origin && !in_array(strtolower($origin), array_map('strtolower', $allowed), true)) {
    fail(403, 'Forbidden');
}

// Не блокируем легитимный запрос, если хостинг не передал Origin/Referer.

// Лимит: не чаще одной заявки в 20 секунд с одного IP.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$lock = sys_get_temp_dir() . '/topiar_lead_' . hash('sha256', $ip);
$lockHandle = @fopen($lock, 'c+');

if (!$lockHandle || !flock($lockHandle, LOCK_EX)) {
    if (is_resource($lockHandle)) fclose($lockHandle);
    fail(503, 'Please retry later');
}

if ((time() - (int)@filemtime($lock)) < 20) {
    flock($lockHandle, LOCK_UN);
    fclose($lockHandle);
    fail(429, 'Too many requests');
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    flock($lockHandle, LOCK_UN);
    fclose($lockHandle);
    fail(400, 'Bad request');
}

function clean($value, int $max): string {
    $value = trim((string)$value);
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $value);
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $max);
    }
    // Запасной вариант, если расширение mbstring не включено.
    return preg_match('/^.{0,' . $max . '}/us', $value, $m) ? $m[0] : '';
}

$name    = clean($data['name'] ?? '', 100);
$phone   = clean($data['phone'] ?? '', 30);
$service = clean($data['service'] ?? '', 100);
$message = clean($data['message'] ?? '', 1500);
$page    = clean($data['page'] ?? '', 200);
$utm     = clean($data['utm'] ?? '', 200);
$consent = ($data['consent'] ?? false) === true;
$website = clean($data['website'] ?? '', 100);

// Honeypot: молча принимаем автоматические запросы.
if ($website !== '') {
    @touch($lock);
    flock($lockHandle, LOCK_UN);
    fclose($lockHandle);
    if (!empty($config['debug'])) {
        echo json_encode(['ok' => true, 'debug' => 'HONEYPOT: поле website заполнено, сообщение НЕ отправлено'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!$consent) {
    flock($lockHandle, LOCK_UN);
    fclose($lockHandle);
    fail(422, 'Consent required');
}

if ($name === '' || !preg_match('/^[0-9+()\-\s]{7,30}$/', $phone)) {
    flock($lockHandle, LOCK_UN);
    fclose($lockHandle);
    fail(422, 'Invalid data');
}

$labels = [
    'topiary'    => 'Топиарные конструкции',
    'light'      => 'Световые фигуры',
    'newyear'    => 'Новогоднее оформление',
    'individual' => 'Индивидуальный проект',
];

$lines = [
    '🔔 Новая заявка с сайта GORODSVETA',
    '',
    "Имя: $name",
    "Телефон: $phone",
];

if ($service !== '') $lines[] = 'Услуга: ' . ($labels[$service] ?? $service);
if ($message !== '') $lines[] = "Сообщение: $message";
if ($page !== '')    $lines[] = "Страница: $page";
if ($utm !== '')     $lines[] = "Источник: $utm";

$text = implode("\n", $lines);

// Telegram Bot API.
$url = 'https://api.telegram.org/bot' . rawurlencode($botToken) . '/sendMessage';
$payload = json_encode([
    'chat_id' => $chatId,
    'text' => $text,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

$httpCode = 0;
$responseBody = false;
$transportError = '';

if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => $payload,
    ]);
    // Windows: брать сертификаты из системного хранилища (нужно, если антивирус/прокси
    // подменяет HTTPS-сертификаты). На Linux-хостинге это условие не выполняется.
    if (PHP_OS_FAMILY === 'Windows' && defined('CURLSSLOPT_NATIVE_CA')) {
        curl_setopt($ch, CURLOPT_SSL_OPTIONS, CURLSSLOPT_NATIVE_CA);
    }

    $responseBody = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $transportError = curl_error($ch);
    if (PHP_VERSION_ID < 80000) curl_close($ch); // в PHP 8.0+ не нужен, в 8.5 даёт Deprecated
} else {
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => $payload,
            'timeout' => 10,
            'ignore_errors' => true,
        ],
    ]);

    $responseBody = @file_get_contents($url, false, $context);
    $respHeaders = function_exists('http_get_last_response_headers')
        ? http_get_last_response_headers()
        : (get_defined_vars()['http_response_header'] ?? null);
    if (isset($respHeaders[0]) && preg_match('/\s(\d{3})\s/', $respHeaders[0], $m)) {
        $httpCode = (int)$m[1];
    }
}

$telegram = is_string($responseBody) ? json_decode($responseBody, true) : null;
$telegramOk = $httpCode === 200 && is_array($telegram) && ($telegram['ok'] ?? false) === true;

if ($telegramOk) {
    @touch($lock);
    flock($lockHandle, LOCK_UN);
    fclose($lockHandle);
    if (!empty($config['debug'])) {
        // Покажем, КОМУ Telegram доставил сообщение (имя чата и имя бота).
        echo json_encode(['ok' => true, 'debug' => 'Telegram принял сообщение', 'telegram' => $telegram['result'] ?? null], JSON_UNESCAPED_UNICODE);
        exit;
    }
    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

// Резервная запись заявки, чтобы она не потерялась даже при проблеме Telegram.
$fallbackPath = __DIR__ . '/../topiar-leads.log';
$logged = @file_put_contents(
    $fallbackPath,
    date('c') . "\n" . $text . "\nTelegram HTTP: $httpCode\n" .
    ($transportError !== '' ? "Transport: $transportError\n" : '') . "\n",
    FILE_APPEND | LOCK_EX
) !== false;

// Email — дополнительный резервный канал, если он настроен на хостинге.
$fallbackEmail = trim((string)($config['fallback_email'] ?? ''));
if ($fallbackEmail !== '' && filter_var($fallbackEmail, FILTER_VALIDATE_EMAIL)) {
    $host = preg_replace('/^www\./', '', $_SERVER['HTTP_HOST'] ?? 'topiar.by');
    $subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта GORODSVETA') . '?=';
    $headers = "From: no-reply@$host\r\nContent-Type: text/plain; charset=UTF-8";
    @mail($fallbackEmail, $subject, $text, $headers);
}

// Режим отладки ('debug' => true в config.php): показываем реальную ошибку Telegram.
// На боевом сайте debug нужно выключить или удалить.
if (!empty($config['debug'])) {
    @unlink($lock);
    flock($lockHandle, LOCK_UN);
    fclose($lockHandle);
    http_response_code(502);
    echo json_encode([
        'ok' => false,
        'error' => 'Telegram error',
        'telegram_http' => $httpCode,
        'transport' => $transportError,
        'telegram' => $telegram ?? $responseBody,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($logged) {
    // Заявка физически сохранена. Клиенту не показываем внутреннюю ошибку Telegram.
    @touch($lock);
    flock($lockHandle, LOCK_UN);
    fclose($lockHandle);
    echo json_encode(['ok' => true, 'fallback' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

@unlink($lock);
flock($lockHandle, LOCK_UN);
fclose($lockHandle);
fail(502, 'Delivery error');
