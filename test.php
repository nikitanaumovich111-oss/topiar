<?php
header('Content-Type: text/plain; charset=utf-8');
echo "PHP: " . PHP_VERSION . "\ncurl: " . (function_exists('curl_init') ? 'yes' : 'NO') . "\n";
$c = require __DIR__ . '/config.php';
$t = $c['bot_token'];

foreach (['getMe' => '', 'sendMessage' => '&chat_id=' . $c['chat_id'] . '&text=test'] as $m => $q) {
    $ch = curl_init("https://api.telegram.org/bot$t/$m?x=1$q");
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
    $r = curl_exec($ch);
    echo "\n== $m ==\nHTTP " . curl_getinfo($ch, CURLINFO_HTTP_CODE) . "\n" . ($r ?: 'ERR: ' . curl_error($ch)) . "\n";
}