/**
 * SQLite lead store — the source of truth for every soumission.
 *
 * One file on disk (DATABASE_PATH, default ./data/leads.db). No external
 * service, so a backup is `cp data/leads.db …`. Opened lazily and cached on
 * globalThis so the dev server's module reloads don't leak file handles.
 */
import './env';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export interface Lead {
  id: number;
  created_at: string;
  source: string;
  ville: string;
  type_cloture: string;
  longueur: string;
  duree: string;
  email: string;
  telephone: string;
  details: string;
  ip: string;
  user_agent: string;
  statut: string;
  notes: string;
}

export type NewLead = Omit<Lead, 'id' | 'statut' | 'notes'>;

/** Workflow states shown in the admin dropdown, in pipeline order. */
export const STATUTS = [
  'nouveau',
  'contacté',
  'qualifié',
  'envoyé au fournisseur',
  'gagné',
  'perdu',
  'spam',
] as const;

const SCHEMA = `
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
`;

type DB = InstanceType<typeof Database>;
const cache = globalThis as unknown as { __leadsDb?: DB };

export function db(): DB {
  if (cache.__leadsDb) return cache.__leadsDb;

  const file = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'leads.db');
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const conn = new Database(file);
  conn.pragma('journal_mode = WAL'); // survives concurrent reads while a write is in flight
  conn.pragma('busy_timeout = 5000');
  conn.exec(SCHEMA);

  cache.__leadsDb = conn;
  return conn;
}

export function insertLead(lead: NewLead): number {
  const stmt = db().prepare(`
    INSERT INTO leads (created_at, source, ville, type_cloture, longueur, duree,
                       email, telephone, details, ip, user_agent)
    VALUES (@created_at, @source, @ville, @type_cloture, @longueur, @duree,
            @email, @telephone, @details, @ip, @user_agent)
  `);
  return Number(stmt.run(lead).lastInsertRowid);
}

export interface LeadQuery {
  statut?: string;
  source?: string;
  /** Free-text match over ville, courriel, téléphone and détails. */
  q?: string;
  limit?: number;
  offset?: number;
}

function where(f: LeadQuery): { sql: string; params: Record<string, string> } {
  const clauses: string[] = [];
  const params: Record<string, string> = {};
  if (f.statut) { clauses.push('statut = @statut'); params.statut = f.statut; }
  if (f.source) { clauses.push('source = @source'); params.source = f.source; }
  if (f.q) {
    clauses.push('(ville LIKE @q OR email LIKE @q OR telephone LIKE @q OR details LIKE @q)');
    params.q = `%${f.q}%`;
  }
  return { sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

export function listLeads(f: LeadQuery = {}): Lead[] {
  const { sql, params } = where(f);
  return db()
    .prepare(`SELECT * FROM leads ${sql} ORDER BY id DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: f.limit ?? 50, offset: f.offset ?? 0 }) as Lead[];
}

export function countLeads(f: LeadQuery = {}): number {
  const { sql, params } = where(f);
  const row = db().prepare(`SELECT COUNT(*) AS n FROM leads ${sql}`).get(params) as { n: number };
  return row.n;
}

/** Lead totals per statut, for the admin summary tiles. */
export function statsByStatut(): Record<string, number> {
  const rows = db().prepare('SELECT statut, COUNT(*) AS n FROM leads GROUP BY statut').all() as
    { statut: string; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.statut, r.n]));
}

export function distinctSources(): string[] {
  const rows = db()
    .prepare("SELECT DISTINCT source FROM leads WHERE source <> '' ORDER BY source")
    .all() as { source: string }[];
  return rows.map((r) => r.source);
}

export function updateLead(id: number, fields: { statut?: string; notes?: string }): void {
  if (fields.statut !== undefined) {
    db().prepare('UPDATE leads SET statut = ? WHERE id = ?').run(fields.statut, id);
  }
  if (fields.notes !== undefined) {
    db().prepare('UPDATE leads SET notes = ? WHERE id = ?').run(fields.notes, id);
  }
}

export function deleteLead(id: number): void {
  db().prepare('DELETE FROM leads WHERE id = ?').run(id);
}
