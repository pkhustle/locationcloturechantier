import type { APIRoute } from 'astro';
import { endSession } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = ({ cookies }) => {
  endSession(cookies);
  return new Response(null, { status: 303, headers: { Location: '/admin/login' } });
};
