<?php
// Shared DB & Env loader for Location Clôture Chantier

function getEnvValue(string $key, string $default = ''): string {
    $val = getenv($key);
    if ($val !== false && $val !== '') {
        return $val;
    }
    if (!empty($_ENV[$key])) return (string)$_ENV[$key];
    if (!empty($_SERVER[$key])) return (string)$_SERVER[$key];

    static $envLoaded = false;
    static $envVars = [];
    if (!$envLoaded) {
        $envLoaded = true;
        $paths = [
            dirname(__DIR__, 2) . '/.env',
            dirname(__DIR__) . '/.env',
            __DIR__ . '/.env'
        ];
        foreach ($paths as $p) {
            if (file_exists($p) && is_readable($p)) {
                $lines = file($p, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    $line = trim($line);
                    if ($line === '' || str_starts_with($line, '#')) continue;
                    $parts = explode('=', $line, 2);
                    if (count($parts) === 2) {
                        $k = trim($parts[0]);
                        $v = trim($parts[1], " \t\n\r\0\x0B\"'");
                        $envVars[$k] = $v;
                    }
                }
                break;
            }
        }
    }
    return $envVars[$key] ?? $default;
}

function getDatabase(): SQLite3 {
    static $db = null;
    if ($db !== null) return $db;

    $path = getEnvValue('DATABASE_PATH');
    if (!$path) {
        $parent = dirname(__DIR__, 2);
        if (is_dir($parent) && is_writable($parent)) {
            $path = $parent . '/data/leads.db';
        } else {
            $path = dirname(__DIR__) . '/data/leads.db';
        }
    }

    $dir = dirname($path);
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }

    $db = new SQLite3($path, SQLITE3_OPEN_READWRITE | SQLITE3_OPEN_CREATE);
    $db->busyTimeout(5000);
    $db->exec('PRAGMA journal_mode = WAL;');
    $db->exec("
        CREATE TABLE IF NOT EXISTS leads (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at   TEXT NOT NULL,
            source       TEXT NOT NULL DEFAULT '',
            ville        TEXT NOT NULL DEFAULT '',
            type_cloture TEXT NOT NULL DEFAULT '',
            longueur     TEXT NOT NULL DEFAULT '',
            duree        TEXT NOT NULL DEFAULT '',
            email        TEXT NOT NULL DEFAULT '',
            telephone    TEXT NOT NULL DEFAULT '',
            details      TEXT NOT NULL DEFAULT '',
            ip           TEXT NOT NULL DEFAULT '',
            user_agent   TEXT NOT NULL DEFAULT '',
            statut       TEXT NOT NULL DEFAULT 'nouveau',
            notes        TEXT NOT NULL DEFAULT ''
        );
        CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_leads_statut  ON leads (statut);
    ");

    return $db;
}
