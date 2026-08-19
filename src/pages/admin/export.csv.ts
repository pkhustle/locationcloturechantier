import type { APIRoute } from 'astro';
import { isLoggedIn } from '../../lib/auth';
import { listLeads } from '../../lib/db';

export const prerender = false;

const COLUMNS = [
  'id', 'created_at', 'source', 'ville', 'type_cloture', 'longueur', 'duree',
  'email', 'telephone', 'details', 'statut', 'notes', 'ip',
] as const;

const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/** Full export of the current filter, Excel-friendly (BOM + CRLF). */
export const GET: APIRoute = ({ cookies, url }) => {
  if (!isLoggedIn(cookies)) {
    return new Response(null, { status: 303, headers: { Location: '/admin/login?err=session' } });
  }

  const rows = listLeads({
    q: url.searchParams.get('q') ?? '',
    statut: url.searchParams.get('statut') ?? '',
    source: url.searchParams.get('source') ?? '',
    limit: 10000,
  });

  const csv = [
    COLUMNS.join(','),
    ...rows.map((r) => COLUMNS.map((c) => escape(r[c])).join(',')),
  ].join('\r\n');

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(`﻿${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="soumissions-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
};
