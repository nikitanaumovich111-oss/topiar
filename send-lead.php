<?php
// TOPIAR — приём заявок с сайта и отправка в Telegram.
// Токен бота НЕ хранится в браузерном коде: он лежит в config.php на сервере.

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function fail(int $code, string $msg): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'Method not allowed');

// --- конфиг: лучше положить ВЫШЕ папки сайта (public_html), иначе — рядом ---
$configPaths = [__DIR__ . '/../topiar-config.php', __DIR__ . '/config.php'];
$config = null;
foreach ($configPaths as $p) {
    if (is_file($p)) { $config = require $p; break; }
}
if (!is_array($config) || empty($config['bot_token']) || empty($config['chat_id'])) {
    fail(500, 'Server is not configured');
}

// --- простая защита: только с вашего домена ---
$allowed = $config['allowed_hosts'] ?? [];
$origin  = parse_url($_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '', PHP_URL_HOST);
if ($allowed && !in_array($origin, $allowed, true)) fail(403, 'Forbidden');

// --- лимит: не чаще 1 заявки в 20 секунд с одного IP ---
$ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$lock = sys_get_temp_dir() . '/topiar_lead_' . md5($ip);
if (is_file($lock) && (time() - filemtime($lock)) < 20) fail(429, 'Too many requests');

// --- данные ---
$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) fail(400, 'Bad request');

function clean($v, int $max): string {
    $v = trim((string)$v);
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $v);
    return mb_substr($v, 0, $max);
}

$name    = clean($data['name']    ?? '', 100);
$phone   = clean($data['phone']   ?? '', 30);
$service = clean($data['service'] ?? '', 100);
$message = clean($data['message'] ?? '', 1500);
$page    = clean($data['page']    ?? '', 200);
$utm     = clean($data['utm']     ?? '', 200);
$consent = ($data['consent'] ?? false) === true;

// --- ловушка для ботов: настоящие посетители это поле не видят ---
if (clean($data['website'] ?? '', 100) !== '') {
    echo json_encode(['ok' => true]);
    exit;
}

if (!$consent) fail(422, 'Consent required');
if ($name === '' || !preg_match('/^[0-9+()\-\s]{7,30}$/', $phone)) fail(422, 'Invalid data');

$labels = [
    'topiary'    => 'Топиарные конструкции',
    'light'      => 'Световые фигуры',
    'newyear'    => 'Новогоднее оформление',
    'individual' => 'Индивидуальный проект',
];

$lines = ['🔔 Новая заявка с сайта TOPIAR', '', "Имя: $name", "Телефон: $phone"];
if ($service !== '') $lines[] = 'Услуга: ' . ($labels[$service] ?? $service);
if ($message !== '') $lines[] = "Сообщение: $message";
if ($page !== '')    $lines[] = "Страница: $page";
if ($utm !== '')     $lines[] = "Источник: $utm";

$text = implode("\n", $lines);

// --- запасной канал: если Telegram не ответил, заявка не должна пропасть ---
function deliver_fallback(array $config, string $text): bool {
    $ok   = false;
    $to   = $config['fallback_email'] ?? 'info@topiar.by';
    $host = preg_replace('/^www\./', '', $_SERVER['HTTP_HOST'] ?? 'topiar.by');
    $subj = '=?UTF-8?B?' . base64_encode('Заявка с сайта TOPIAR') . '?=';
    $hdrs = "From: no-reply@$host\r\nContent-Type: text/plain; charset=UTF-8";
    if (@mail($to, $subj, $text, $hdrs)) $ok = true;

    $log = __DIR__ . '/../topiar-leads.log';
    if (@file_put_contents($log, date('c') . "\n" . $text . "\n\n", FILE_APPEND | LOCK_EX) !== false) $ok = true;

    return $ok;
}

// --- отправка в Telegram ---
$ch = curl_init('https://api.telegram.org/bot' . $config['bot_token'] . '/sendMessage');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     => json_encode([
        'chat_id' => $config['chat_id'],
        'text'    => $text,
    ], JSON_UNESCAPED_UNICODE),
]);
curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($status !== 200 && !deliver_fallback($config, $text)) fail(502, 'Delivery error');

@touch($lock);
echo json_encode(['ok' => true]);
