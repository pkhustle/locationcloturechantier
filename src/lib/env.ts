/**
 * Charge le fichier `.env` dans process.env au démarrage.
 *
 * Le serveur Node autonome ne lit pas `.env` tout seul : Vite n'expose ce
 * fichier qu'au build (import.meta.env), jamais à l'exécution. Tout module qui
 * lit `process.env` importe donc celui-ci en premier.
 *
 * Les vraies variables d'environnement (Hostinger hPanel, `VAR=x npm start`)
 * ont priorité : le fichier ne remplit que ce qui est absent.
 */
import fs from 'node:fs';
import path from 'node:path';

const flag = globalThis as { __lccEnvLoaded?: boolean };

if (!flag.__lccEnvLoaded) {
  flag.__lccEnvLoaded = true;
  const file = process.env.ENV_FILE || path.join(process.cwd(), '.env');
  try {
    if (fs.existsSync(file)) {
      for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq < 1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        const quoted = (q: string) => value.length > 1 && value.startsWith(q) && value.endsWith(q);
        if (quoted('"') || quoted("'")) value = value.slice(1, -1);
        if (process.env[key] === undefined) process.env[key] = value;
      }
    }
  } catch (err) {
    console.warn('[env] lecture de .env impossible :', err);
  }
}

export {};
