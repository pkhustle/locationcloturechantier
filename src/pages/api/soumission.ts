import type { APIRoute } from 'astro';
import { crmConfig, postToSheet } from '../../lib/crm';
import { insertLead } from '../../lib/db';

export const prerender = false;

/**
 * Handles the "Demander une soumission" form posts (hero, homepage, /soumission).
 * Writes the lead to the SQLite database — the source of truth behind /admin —
 * then mirrors it to the Google Sheet (only if APPS_SCRIPT_URL is configured,
 * which is what triggers the email alert), and redirects the visitor to /merci.
 */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const form = await request.formData();
  const field = (k: string) => String(form.get(k) ?? '').trim();

  // Honeypot: real users never fill a hidden field. Bots do — drop silently.
  if (field('_gotcha')) return redirect('/merci');

  const email = field('email');
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) return new Response('Courriel invalide.', { status: 422 });

  const row = {
    created_at: new Date().toISOString(),
    source: field('source') || 'form',
    ville: field('ville'),
    type_cloture: field('type'),
    longueur: field('longueur'),
    duree: field('duree'),
    email,
    telephone: field('telephone'),
    details: field('details'),
    ip: clientAddress ?? '',
    user_agent: request.headers.get('user-agent') ?? '',
  };

  try {
    insertLead(row);
  } catch (err) {
    // Never lose a lead to a storage failure: log it and still try the mirror.
    console.error('[soumission] insert failed', err);
  }

  const cfg = crmConfig();
  if (cfg.APPS_SCRIPT_URL) {
    await postToSheet(cfg, {
      action: 'append_form',
      row: { ...row, timestamp: row.created_at },
    });
  }

  return redirect('/merci');
};

// Reject non-POST (e.g. someone hitting the URL directly).
export const GET: APIRoute = () => new Response('Method Not Allowed', { status: 405 });

function redirect(location: string) {
  return new Response(null, { status: 303, headers: { Location: location } });
}
