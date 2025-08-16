<?php
// buscar.php

// Ativa CORS e JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Caminho do .env (ajuste se necessário)
$envPath = __DIR__ . '/.env';

if (!file_exists($envPath)) {
    echo json_encode([
        'error' => 'Env file not found',
    ]);
    exit;
}

// Lê credenciais
$env = parse_ini_file($envPath);
$APP_ID = $env['ASTRONOMY_API_APP_ID'] ?? '';
$APP_SECRET = $env['ASTRONOMY_API_APP_SECRET'] ?? '';

if (!$APP_ID || !$APP_SECRET) {
    echo json_encode([
        'error' => 'API credentials missing',
    ]);
    exit;
}

// Pega parâmetros da requisição
$constellation = $_GET['constellation'] ?? 'and';
$style = $_GET['style'] ?? 'default';

// Dados do observador (pode ajustar para pegar de input ou fixo)
$observer = [
    'latitude' => 33.775867,
    'longitude' => -84.39733,
    'date' => date('Y-m-d')
];

// Monta payload
$data = [
    "style" => $style,
    "observer" => $observer,
    "view" => [
        "type" => "constellation",
        "parameters" => [
            "constellation" => $constellation
        ]
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://api.astronomyapi.com/api/v2/studio/star-chart");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Basic ' . base64_encode("$APP_ID:$APP_SECRET"),
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if(curl_errno($ch)) {
    echo json_encode([
        'error' => 'Curl error: ' . curl_error($ch)
    ]);
    exit;
}

curl_close($ch);

// Salva log para debug
file_put_contents(__DIR__ . '/astro_log.txt', $response);

// Decodifica e retorna JSON
$json = json_decode($response, true);

// Se a imagem estiver disponível
$imageUrl = $json['data']['imageUrl'] ?? null;

if (!$imageUrl) {
    echo json_encode([
        'error' => 'No image found',
        'raw_response' => $json
    ]);
    exit;
}

echo json_encode([
    'constellation' => $constellation,
    'style' => $style,
    'image' => $imageUrl
]);
