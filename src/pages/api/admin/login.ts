import type { APIRoute } from 'astro';
import {
  adminConfigured, passwordMatches, startSession,
  rateLimited, recordFailure, clearFailures,
} from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, clientAddress, url }) => {
  if (!adminConfigured()) {
    console.warn(
      '[admin] ADMIN_PASSWORD absent de process.env. Vérifiez les variables ' +
      `d'environnement de l'app, ou le fichier .env dans ${process.cwd()}, ` +
      "puis redémarrez l'application.",
    );
    return redirect('/admin/login?err=config');
  }

  const ip = clientAddress ?? 'unknown';
  if (rateLimited(ip)) return redirect('/admin/login?err=rate');

  const form = await request.formData();
  const password = String(form.get('password') ?? '');

  if (!passwordMatches(password)) {
    recordFailure(ip);
    return redirect('/admin/login?err=bad');
  }

  clearFailures(ip);
  startSession(cookies, url.protocol === 'https:');
  return redirect('/admin');
};

export const GET: APIRoute = () => redirect('/admin/login');

function redirect(location: string) {
  return new Response(null, { status: 303, headers: { Location: location } });
}
