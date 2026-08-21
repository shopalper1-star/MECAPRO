<?php
$token = "95|HoXmEihRUbhKBsXlLq5i6V0XVS2NL113TBv4uzcvr9f3d6abc";
$opts = [
    "http" => [
        "method" => "GET",
        "header" => "Authorization: Bearer $token\r\n" .
                    "Accept: application/json\r\n"
    ]
];
$context = stream_context_create($opts);
$result = file_get_contents("http://127.0.0.1:8000/api/receptionist/appointments", false, $context);
echo count(json_decode($result, true));
