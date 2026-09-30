<?php
session_start([
    'cookie_httponly' => true,
    'cookie_secure' => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https'),
    'cookie_samesite' => 'Lax',
]);

require_once __DIR__ . '/../api/db.php';

$adminPassword = getEnvValue('ADMIN_PASSWORD');
$isConfigured = !empty($adminPassword);
$isLoggedIn = !empty($_SESSION['admin_logged_in']);

// 1. Handle Login POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    if (!$isConfigured) {
        header('Location: /admin?err=config', true, 303);
        exit;
    }
    $entered = (string)$_POST['password'];
    if (hash_equals($adminPassword, $entered)) {
        $_SESSION['admin_logged_in'] = true;
        header('Location: /admin', true, 303);
        exit;
    } else {
        header('Location: /admin?err=bad', true, 303);
        exit;
    }
}

// 2. Render Login if not authenticated
if (!$isLoggedIn) {
    $err = $_GET['err'] ?? '';
    $messages = [
        'bad' => 'Mot de passe incorrect.',
        'config' => "Aucun mot de passe administrateur n'est configuré sur le serveur (ADMIN_PASSWORD).",
        'session' => 'Session expirée. Reconnectez-vous.',
    ];
    $message = $messages[$err] ?? null;
    ?>
    <!doctype html>
    <html lang="fr-CA">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Connexion — Administration</title>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="theme-color" content="#16233f" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="stylesheet" href="/styles/global.css" />
      <link rel="stylesheet" href="/styles/admin.css" />
    </head>
    <body>
      <div class="login-wrap">
        <div class="login-card">
          <a class="brand" href="/"><span class="mark">▦</span> Clôture<span>Chantier</span></a>
          <h1>Zone administrateur</h1>

          <?php if ($message): ?>
            <p class="login-error"><?= htmlspecialchars($message) ?></p>
          <?php elseif (!$isConfigured): ?>
            <p class="login-error">
              Aucun mot de passe n'est configuré. Définissez <code>ADMIN_PASSWORD</code> dans les
              variables d'environnement du serveur, puis rechargez la page.
            </p>
          <?php endif; ?>

          <form method="post" action="/admin">
            <input
              type="password"
              name="password"
              placeholder="Mot de passe"
              autocomplete="current-password"
              required
              autofocus
            />
            <button class="btn" type="submit">Se connecter</button>
          </form>

          <p class="login-back"><a href="/">← Retour au site</a></p>
        </div>
      </div>
    </body>
    </html>
    <?php
    exit;
}

// Authenticated session:
$db = getDatabase();

// 3. Handle Logout
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    $_SESSION = [];
    session_destroy();
    header('Location: /admin', true, 303);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['logout'])) {
    $_SESSION = [];
    session_destroy();
    header('Location: /admin', true, 303);
    exit;
}

// 4. Handle Lead Actions (POST update / delete)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id'])) {
    $id = (int)$_POST['id'];
    $action = $_POST['action'] ?? 'update';
    $back = $_POST['back'] ?? '/admin';
    if (!str_starts_with($back, '/admin')) $back = '/admin';

    if ($id > 0) {
        if ($action === 'delete') {
            $del = $db->prepare("DELETE FROM leads WHERE id = :id;");
            $del->bindValue(':id', $id, SQLITE3_INTEGER);
            $del->execute();
        } else {
            $statut = trim($_POST['statut'] ?? '');
            $notes = trim($_POST['notes'] ?? '');
            $upd = $db->prepare("UPDATE leads SET statut = :statut, notes = :notes WHERE id = :id;");
            $upd->bindValue(':statut', $statut, SQLITE3_TEXT);
            $upd->bindValue(':notes', $notes, SQLITE3_TEXT);
            $upd->bindValue(':id', $id, SQLITE3_INTEGER);
            $upd->execute();
        }
    }
    header("Location: $back", true, 303);
    exit;
}

// 5. Handle CSV Export
if (isset($_GET['action']) && $_GET['action'] === 'export') {
    $q = trim($_GET['q'] ?? '');
    $statut = trim($_GET['statut'] ?? '');
    $source = trim($_GET['source'] ?? '');

    $whereClauses = [];
    if ($statut !== '') $whereClauses[] = "statut = '" . SQLite3::escapeString($statut) . "'";
    if ($source !== '') $whereClauses[] = "source = '" . SQLite3::escapeString($source) . "'";
    if ($q !== '') {
        $eq = SQLite3::escapeString($q);
        $whereClauses[] = "(ville LIKE '%$eq%' OR email LIKE '%$eq%' OR telephone LIKE '%$eq%' OR details LIKE '%$eq%')";
    }
    $whereSql = $whereClauses ? 'WHERE ' . implode(' AND ', $whereClauses) : '';

    $res = $db->query("SELECT id, created_at, source, ville, type_cloture, longueur, duree, email, telephone, details, statut, notes, ip FROM leads $whereSql ORDER BY id DESC LIMIT 10000;");

    $filename = "soumissions-" . date('Y-m-d') . ".csv";
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-store');

    echo "\xEF\xBB\xBF"; // UTF-8 BOM for Excel
    $out = fopen('php://output', 'w');
    fputcsv($out, ['id', 'created_at', 'source', 'ville', 'type_cloture', 'longueur', 'duree', 'email', 'telephone', 'details', 'statut', 'notes', 'ip']);
    while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
        fputcsv($out, $row);
    }
    fclose($out);
    exit;
}

// 6. View Data Preparation
$statuts = [
    'nouveau',
    'contacté',
    'qualifié',
    'envoyé au fournisseur',
    'gagné',
    'perdu',
    'spam',
];

$q = trim($_GET['q'] ?? '');
$statut = trim($_GET['statut'] ?? '');
$source = trim($_GET['source'] ?? '');
$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = 50;
$offset = ($page - 1) * $perPage;

$whereClauses = [];
if ($statut !== '') $whereClauses[] = "statut = '" . SQLite3::escapeString($statut) . "'";
if ($source !== '') $whereClauses[] = "source = '" . SQLite3::escapeString($source) . "'";
if ($q !== '') {
    $eq = SQLite3::escapeString($q);
    $whereClauses[] = "(ville LIKE '%$eq%' OR email LIKE '%$eq%' OR telephone LIKE '%$eq%' OR details LIKE '%$eq%')";
}
$whereSql = $whereClauses ? 'WHERE ' . implode(' AND ', $whereClauses) : '';

$totalCount = (int)$db->querySingle("SELECT COUNT(*) FROM leads $whereSql;");
$grandTotal = (int)$db->querySingle("SELECT COUNT(*) FROM leads;");
$totalPages = max(1, ceil($totalCount / $perPage));

$leadsRes = $db->query("SELECT * FROM leads $whereSql ORDER BY id DESC LIMIT $perPage OFFSET $offset;");
$leads = [];
while ($row = $leadsRes->fetchArray(SQLITE3_ASSOC)) {
    $leads[] = $row;
}

// Stats by status
$statsRes = $db->query("SELECT statut, COUNT(*) AS n FROM leads GROUP BY statut;");
$stats = [];
while ($sRow = $statsRes->fetchArray(SQLITE3_ASSOC)) {
    $stats[$sRow['statut']] = (int)$sRow['n'];
}

// Distinct sources
$sourcesRes = $db->query("SELECT DISTINCT source FROM leads WHERE source <> '' ORDER BY source;");
$sources = [];
while ($srcRow = $sourcesRes->fetchArray(SQLITE3_ASSOC)) {
    $sources[] = $srcRow['source'];
}

$backUrl = htmlspecialchars($_SERVER['REQUEST_URI'] ?? '/admin');

function buildQuery(array $over): string {
    $params = array_merge($_GET, $over);
    foreach ($params as $k => $v) {
        if ($v === '' || $v === null) unset($params[$k]);
    }
    return $params ? '/admin?' . http_build_query($params) : '/admin';
}

function pillClass(string $s): string {
    $ascii = iconv('UTF-8', 'ASCII//TRANSLIT', $s);
    $parts = explode(' ', strtolower(preg_replace('/[^a-zA-Z0-9 ]/', '', $ascii)));
    return $parts[0] ?: 'default';
}

function formatDate(string $iso): string {
    $t = strtotime($iso);
    return $t ? date('Y-m-d H:i', $t) : $iso;
}
?>
<!doctype html>
<html lang="fr-CA">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Soumissions — Administration</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="theme-color" content="#16233f" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="stylesheet" href="/styles/global.css" />
  <link rel="stylesheet" href="/styles/admin.css" />
</head>
<body class="admin-body">
  <div class="admin-bar">
    <div class="container">
      <a class="brand" href="/admin">
        <span class="mark">▦</span>
        Clôture<span>Chantier</span>
      </a>
      <span class="tag">Admin</span>
      <nav>
        <a href="/admin">Soumissions</a>
        <a href="<?= buildQuery(['action' => 'export']) ?>">Exporter CSV</a>
        <a href="/" target="_blank" rel="noopener">Voir le site ↗</a>
        <form method="post" action="/admin" style="display:inline;">
          <input type="hidden" name="logout" value="1" />
          <button type="submit">Déconnexion</button>
        </form>
      </nav>
    </div>
  </div>

  <main class="admin-main">
    <h1>Soumissions</h1>
    <p class="admin-sub">
      <?= $grandTotal ?> demande<?= $grandTotal > 1 ? 's' : '' ?> au total
      <?php if ($totalCount !== $grandTotal): ?>
        · <?= $totalCount ?> correspond<?= $totalCount > 1 ? 'ent' : '' ?> au filtre
      <?php endif; ?>
    </p>

    <div class="admin-stats">
      <a class="admin-stat<?= empty($statut) ? ' is-active' : '' ?>" href="<?= buildQuery(['statut' => '', 'page' => '']) ?>">
        <b><?= $grandTotal ?></b><span>Toutes</span>
      </a>
      <?php foreach ($statuts as $s): ?>
        <a class="admin-stat<?= $statut === $s ? ' is-active' : '' ?>" href="<?= buildQuery(['statut' => $s, 'page' => '']) ?>">
          <b><?= $stats[$s] ?? 0 ?></b><span><?= htmlspecialchars($s) ?></span>
        </a>
      <?php endforeach; ?>
    </div>

    <form class="admin-filters" method="get" action="/admin">
      <input type="search" name="q" value="<?= htmlspecialchars($q) ?>" placeholder="Rechercher (ville, courriel, téléphone, détails)" />
      <select name="statut">
        <option value="">Tous les statuts</option>
        <?php foreach ($statuts as $s): ?>
          <option value="<?= htmlspecialchars($s) ?>" <?= $statut === $s ? 'selected' : '' ?>><?= htmlspecialchars($s) ?></option>
        <?php endforeach; ?>
      </select>
      <select name="source">
        <option value="">Toutes les sources</option>
        <?php foreach ($sources as $src): ?>
          <option value="<?= htmlspecialchars($src) ?>" <?= $source === $src ? 'selected' : '' ?>><?= htmlspecialchars($src) ?></option>
        <?php endforeach; ?>
      </select>
      <button class="btn" type="submit">Filtrer</button>
      <?php if ($q !== '' || $statut !== '' || $source !== ''): ?>
        <a class="reset" href="/admin">Réinitialiser</a>
      <?php endif; ?>
    </form>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Contact</th>
            <th>Ville</th>
            <th>Type</th>
            <th>Longueur / durée</th>
            <th>Détails</th>
            <th>Source</th>
            <th>Statut</th>
            <th>Notes internes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($leads)): ?>
            <tr>
              <td class="empty" colspan="10">
                Aucune soumission <?= $totalCount !== $grandTotal ? 'pour ce filtre' : 'pour le moment' ?>.
              </td>
            </tr>
          <?php endif; ?>

          <?php foreach ($leads as $l): ?>
            <tr>
              <td class="date"><?= htmlspecialchars(formatDate($l['created_at'])) ?></td>
              <td class="lead-contact">
                <?php if (!empty($l['email'])): ?>
                  <a href="mailto:<?= htmlspecialchars($l['email']) ?>"><?= htmlspecialchars($l['email']) ?></a>
                <?php endif; ?>
                <?php if (!empty($l['telephone'])): ?>
                  <a href="tel:<?= htmlspecialchars(preg_replace('/[^0-9+]/', '', $l['telephone'])) ?>"><?= htmlspecialchars($l['telephone']) ?></a>
                <?php endif; ?>
                <?php if (empty($l['email']) && empty($l['telephone'])): ?>
                  <span>—</span>
                <?php endif; ?>
              </td>
              <td><?= htmlspecialchars($l['ville'] ?: '—') ?></td>
              <td><?= htmlspecialchars($l['type_cloture'] ?: '—') ?></td>
              <td>
                <?php
                  $meas = array_filter([$l['longueur'], $l['duree']]);
                  echo htmlspecialchars($meas ? implode(' · ', $meas) : '—');
                ?>
              </td>
              <td class="details"><?= htmlspecialchars($l['details'] ?: '—') ?></td>
              <td><span class="pill"><?= htmlspecialchars($l['source'] ?: '—') ?></span></td>
              <td>
                <form method="post" action="/admin">
                  <input type="hidden" name="id" value="<?= (int)$l['id'] ?>" />
                  <input type="hidden" name="back" value="<?= $backUrl ?>" />
                  <input type="hidden" name="notes" value="<?= htmlspecialchars($l['notes']) ?>" />
                  <span class="dot <?= pillClass($l['statut']) ?>" aria-hidden="true"></span>
                  <select name="statut" onchange="this.form.submit()">
                    <?php foreach ($statuts as $s): ?>
                      <option value="<?= htmlspecialchars($s) ?>" <?= $l['statut'] === $s ? 'selected' : '' ?>><?= htmlspecialchars($s) ?></option>
                    <?php endforeach; ?>
                  </select>
                </form>
              </td>
              <td>
                <form method="post" action="/admin">
                  <input type="hidden" name="id" value="<?= (int)$l['id'] ?>" />
                  <input type="hidden" name="back" value="<?= $backUrl ?>" />
                  <input type="hidden" name="statut" value="<?= htmlspecialchars($l['statut']) ?>" />
                  <input type="text" name="notes" value="<?= htmlspecialchars($l['notes']) ?>" placeholder="Note…" />
                  <button class="save" type="submit">OK</button>
                </form>
              </td>
              <td>
                <form method="post" action="/admin" onsubmit="return confirm('Supprimer définitivement cette soumission ?')">
                  <input type="hidden" name="id" value="<?= (int)$l['id'] ?>" />
                  <input type="hidden" name="back" value="<?= $backUrl ?>" />
                  <input type="hidden" name="action" value="delete" />
                  <button class="del" type="submit" title="Supprimer" aria-label="Supprimer">✕</button>
                </form>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>

    <?php if ($totalPages > 1): ?>
      <div class="admin-pager">
        <?php if ($page > 1): ?>
          <a href="<?= buildQuery(['page' => $page - 1]) ?>">← Précédent</a>
        <?php endif; ?>
        <span>Page <?= $page ?> sur <?= $totalPages ?></span>
        <?php if ($page < $totalPages): ?>
          <a href="<?= buildQuery(['page' => $page + 1]) ?>">Suivant →</a>
        <?php endif; ?>
      </div>
    <?php endif; ?>
  </main>
</body>
</html>
