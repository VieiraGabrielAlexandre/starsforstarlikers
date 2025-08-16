<?php
$nome = $_GET['nome'] ?? '';

if (!$nome) {
    die("Nenhuma estrela selecionada.");
}

// --- Buscar localização no CDS Sesame ---
$url = "https://cds.u-strasbg.fr/cgi-bin/nph-sesame/-oxp/".urlencode($nome);
$response = @file_get_contents($url);

if (!$response) {
    die("Erro ao consultar a API do CDS.");
}

// Capturar RA e DEC usando regex
preg_match('/#RA:\s*([0-9\s.+-]+)/', $response, $raMatch);
preg_match('/#DEC:\s*([0-9\s.+-]+)/', $response, $decMatch);

$ra = $raMatch[1] ?? 'Desconhecido';
$dec = $decMatch[1] ?? 'Desconhecido';

// --- Gerar imagem via NASA SkyView ---
$imageUrl = "https://skyview.gsfc.nasa.gov/current/cgi/runquery.pl?Position=".urlencode($nome)."&Survey=DSS2%20Red&pixels=300&Return=JPEG";

?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>🌟 Resultado: <?= htmlspecialchars($nome) ?></title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="container">
    <h1>🌟 <?= htmlspecialchars($nome) ?></h1>
    <p><b>RA:</b> <?= $ra ?></p>
    <p><b>DEC:</b> <?= $dec ?></p>
    <h2>📷 Imagem (SkyView DSS2 Red)</h2>
    <img src="<?= $imageUrl ?>" alt="Imagem da estrela <?= htmlspecialchars($nome) ?>">
    <br><br>
    <a href="index.php">🔙 Voltar</a>
</div>
</body>
</html>
