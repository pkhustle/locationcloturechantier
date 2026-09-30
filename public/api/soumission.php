<?php
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /soumission', true, 303);
    exit;
}

// Honeypot: real users never fill a hidden field. Bots do — drop silently.
if (!empty($_POST['_gotcha'])) {
    header('Location: /merci', true, 303);
    exit;
}

$ip = $_SERVER['HTTP_CF_CONNECTING_IP']
    ?? explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '')[0]
    ?? $_SERVER['REMOTE_ADDR']
    ?? 'unknown';
$ip = trim($ip);

$db = getDatabase();

// Rate limiting: max 6 submissions per 10 minutes per IP
$db->exec("CREATE TABLE IF NOT EXISTS rate_limits (ip TEXT PRIMARY KEY, count INTEGER, expires INTEGER);");
$now = time();
$rateStmt = $db->prepare("SELECT count, expires FROM rate_limits WHERE ip = :ip;");
$rateStmt->bindValue(':ip', $ip, SQLITE3_TEXT);
$rateRes = $rateStmt->execute();
$rateRow = $rateRes->fetchArray(SQLITE3_ASSOC);

if ($rateRow && $now < $rateRow['expires'] && $rateRow['count'] >= 6) {
    http_response_code(429);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Trop de demandes envoyées. Pour une assistance immédiate, contactez-nous directement par téléphone au 581-397-8975.';
    exit;
}

if (!$rateRow || $now >= $rateRow['expires']) {
    $insRate = $db->prepare("INSERT OR REPLACE INTO rate_limits (ip, count, expires) VALUES (:ip, 1, :exp);");
    $insRate->bindValue(':ip', $ip, SQLITE3_TEXT);
    $insRate->bindValue(':exp', $now + 600, SQLITE3_INTEGER);
    $insRate->execute();
} else {
    $updRate = $db->prepare("UPDATE rate_limits SET count = count + 1 WHERE ip = :ip;");
    $updRate->bindValue(':ip', $ip, SQLITE3_TEXT);
    $updRate->execute();
}

$email = trim($_POST['email'] ?? '');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Courriel invalide.';
    exit;
}

$ville        = trim($_POST['ville'] ?? '');
$type_cloture = trim($_POST['type'] ?? $_POST['type_cloture'] ?? '');
$longueur     = trim($_POST['longueur'] ?? '');
$duree        = trim($_POST['duree'] ?? '');
$telephone    = trim($_POST['telephone'] ?? '');
$details      = trim($_POST['details'] ?? '');
$source       = trim($_POST['source'] ?? 'form');
$userAgent    = $_SERVER['HTTP_USER_AGENT'] ?? '';
$createdAt    = date('c');

// 1. Insert into SQLite
$stmt = $db->prepare("
    INSERT INTO leads (created_at, source, ville, type_cloture, longueur, duree, email, telephone, details, ip, user_agent)
    VALUES (:created_at, :source, :ville, :type_cloture, :longueur, :duree, :email, :telephone, :details, :ip, :user_agent);
");
$stmt->bindValue(':created_at', $createdAt, SQLITE3_TEXT);
$stmt->bindValue(':source', $source, SQLITE3_TEXT);
$stmt->bindValue(':ville', $ville, SQLITE3_TEXT);
$stmt->bindValue(':type_cloture', $type_cloture, SQLITE3_TEXT);
$stmt->bindValue(':longueur', $longueur, SQLITE3_TEXT);
$stmt->bindValue(':duree', $duree, SQLITE3_TEXT);
$stmt->bindValue(':email', $email, SQLITE3_TEXT);
$stmt->bindValue(':telephone', $telephone, SQLITE3_TEXT);
$stmt->bindValue(':details', $details, SQLITE3_TEXT);
$stmt->bindValue(':ip', $ip, SQLITE3_TEXT);
$stmt->bindValue(':user_agent', $userAgent, SQLITE3_TEXT);
$stmt->execute();

// 2. Send email notification to komp76@gmail.com
$alertEmail = getEnvValue('ALERT_EMAIL', 'komp76@gmail.com');
$sujetVille = $ville ? ucfirst($ville) : 'Québec';
$sujetLongueur = $longueur ? " - $longueur" : '';
$subject = "=?UTF-8?B?" . base64_encode("Nouveau lead clôture : $sujetVille$sujetLongueur") . "?=";

$message = "Une nouvelle demande de soumission a été reçue sur locationcloturechantier.ca :\n\n"
    . "• Ville : " . ($ville ?: 'Non précisé') . "\n"
    . "• Type de clôture : " . ($type_cloture ?: 'Standard') . "\n"
    . "• Longueur : " . ($longueur ?: 'Non précisé') . "\n"
    . "• Durée : " . ($duree ?: 'Non précisé') . "\n"
    . "• Courriel : " . $email . "\n"
    . "• Téléphone : " . ($telephone ?: 'Non précisé') . "\n"
    . "• Détails : " . ($details ?: 'Aucun détail particulier') . "\n"
    . "• Source : " . ($source ?: 'Site web') . "\n"
    . "• Date : " . date('Y-m-d H:i:s') . "\n"
    . "• IP : " . $ip . "\n\n"
    . "Gérer cette soumission dans l'administration :\n"
    . "https://locationcloturechantier.ca/admin\n";

$headers = [
    'From: Location Clôture Chantier <noreply@locationcloturechantier.ca>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion()
];

@mail($alertEmail, $subject, $message, implode("\r\n", $headers));

// 3. Response
if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'redirect' => '/merci']);
    exit;
}

header('Location: /merci', true, 303);
exit;
