<?php
// Скопируйте в topiar-config.php (ВЫШЕ папки сайта) или в config.php рядом с send-lead.php.
// Никогда не публикуйте этот файл в git.
return [
    'bot_token'     => '8757387500:AAG-XsWOtTvcBiEU5914Q5Q37QmQIpjO_q4',
    'chat_id'       => '931492862',
    'allowed_hosts' => ['topiar.by', 'www.topiar.by'],
    'fallback_email' => 'info@topiar.by', // сюда придёт заявка, если Telegram недоступен
];
