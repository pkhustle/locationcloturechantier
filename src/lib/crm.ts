/**
 * Optional Google Sheet mirror.
 *
 * The SQLite database (src/lib/db.ts) is the source of truth for leads; this
 * only copies each submission to the Apps Script Web App so the Sheet keeps
 * sending its email alert. Unset APPS_SCRIPT_URL and the mirror is skipped.
 * Secrets come from runtime env vars (Hostinger hPanel), never from the build.
 */

import './env';

export interface CrmConfig {
  APPS_SCRIPT_URL: string;
  APPS_SCRIPT_TOKEN: string;
}

export function crmConfig(): CrmConfig {
  const env = process.env;
  return {
    APPS_SCRIPT_URL: env.APPS_SCRIPT_URL ?? '',
    APPS_SCRIPT_TOKEN: env.APPS_SCRIPT_TOKEN ?? '',
  };
}

/** POST a JSON payload to the Google Apps Script Web App (the Sheet). */
export async function postToSheet(cfg: CrmConfig, payload: Record<string, unknown>): Promise<boolean> {
  if (!cfg.APPS_SCRIPT_URL) return false;
  try {
    const res = await fetch(cfg.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, token: cfg.APPS_SCRIPT_TOKEN }),
      redirect: 'follow', // Apps Script /exec 302-redirects to a googleusercontent host
    });
    const text = await res.text();
    return res.ok && text.includes('"ok":true');
  } catch {
    return false;
  }
}
