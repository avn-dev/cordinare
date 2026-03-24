<?php

$ch = curl_init('http://localhost:8000/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
$response = curl_exec($ch);
if ($response === false) {
    echo "Curl error: ".curl_error($ch)."\n";
    exit(1);
}
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$headers = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

preg_match('/XSRF-TOKEN=([^;]+)/', $headers, $matches);
$xsrf = $matches[1] ?? null;

preg_match('/name="csrf-token" content="([^"]+)"/', $body, $metaMatches);
$meta = $metaMatches[1] ?? null;

echo "XSRF cookie: ".($xsrf ? urldecode($xsrf) : 'none')."\n";
echo "Meta token: ".($meta ?? 'none')."\n";
