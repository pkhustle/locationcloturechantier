import type { APIRoute } from 'astro';
import { isLoggedIn } from '../../../lib/auth';
import { updateLead, deleteLead, STATUTS } from '../../../lib/db';

export const prerender = false;

/** Row actions from the admin table: update statut/notes, or delete a lead. */
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isLoggedIn(cookies)) return redirect('/admin/login?err=session');

  const form = await request.formData();
  const id = Number(form.get('id'));
  const action = String(form.get('action') ?? 'update');
  // Where to send the user back to, so filters and page number survive the post.
  const back = String(form.get('back') ?? '/admin');
  const safeBack = back.startsWith('/admin') ? back : '/admin';

  if (!Number.isInteger(id) || id <= 0) return redirect(safeBack);

  if (action === 'delete') {
    deleteLead(id);
    return redirect(safeBack);
  }

  const statut = String(form.get('statut') ?? '');
  const notes = String(form.get('notes') ?? '');
  updateLead(id, {
    statut: (STATUTS as readonly string[]).includes(statut) ? statut : undefined,
    notes,
  });

  return redirect(safeBack);
};

function redirect(location: string) {
  return new Response(null, { status: 303, headers: { Location: location } });
}
