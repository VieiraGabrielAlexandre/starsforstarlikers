<?php
// Carregar CSV de estrelas
$estrelas = [];
if (($handle = fopen("estrelas.csv", "r")) !== FALSE) {
    $header = fgetcsv($handle, 1000, ",");
    while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
        $estrelas[] = $data[1];
    }
    fclose($handle);
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>🌌 Consulta de Estrelas</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="container">
    <h1>🔭 Consulta Estelar</h1>
    <form action="buscar.php" method="GET">
        <label for="estrela">Selecione uma estrela:</label>
        <select name="nome" id="estrela" required>
            <option value="">-- Escolha --</option>
            <?php foreach ($estrelas as $nome): ?>
                <option value="<?= htmlspecialchars($nome) ?>"><?= htmlspecialchars($nome) ?></option>
            <?php endforeach; ?>
        </select>
        <button type="submit">Buscar</button>
    </form>
</div>
</body>
</html>
