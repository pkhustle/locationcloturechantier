/**
 * Admin-zone authentication: one shared password, one signed session cookie.
 *
 * The cookie holds no data beyond an expiry, signed with HMAC-SHA256 — nothing
 * to tamper with, and rotating ADMIN_PASSWORD invalidates every live session
 * (the fallback signing key is derived from the password).
 */
import './env';
import crypto from 'node:crypto';
import type { AstroCookies } from 'astro';

export const SESSION_COOKIE = 'lcc_admin';
const MAX_AGE = 60 * 60 * 12; // 12 h

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? '';
}

function signingKey(): string {
  return process.env.ADMIN_SESSION_SECRET || `derived:${adminPassword()}`;
}

/** False when ADMIN_PASSWORD is unset — the admin zone stays locked shut. */
export function adminConfigured(): boolean {
  return adminPassword().length > 0;
}

function timingSafeEquals(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function passwordMatches(candidate: string): boolean {
  const expected = adminPassword();
  if (!expected) return false;
  return timingSafeEquals(candidate, expected);
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', signingKey()).update(payload).digest('base64url');
}

function newToken(): string {
  const payload = String(Date.now() + MAX_AGE * 1000);
  return `${payload}.${sign(payload)}`;
}

function tokenValid(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  if (!timingSafeEquals(sig, sign(payload))) return false;
  const exp = Number(payload);
  return Number.isFinite(exp) && exp > Date.now();
}

export function startSession(cookies: AstroCookies, secure: boolean): void {
  cookies.set(SESSION_COOKIE, newToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function endSession(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function isLoggedIn(cookies: AstroCookies): boolean {
  return tokenValid(cookies.get(SESSION_COOKIE)?.value);
}

/**
 * Throttle password guessing: 8 attempts per IP per 15 min, in memory.
 * Good enough for a single-instance Node app; resets on restart.
 */
const attempts = new Map<string, { n: number; until: number }>();
const WINDOW = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function rateLimited(ip: string): boolean {
  const rec = attempts.get(ip);
  if (!rec) return false;
  if (Date.now() > rec.until) { attempts.delete(ip); return false; }
  return rec.n >= MAX_ATTEMPTS;
}

export function recordFailure(ip: string): void {
  const rec = attempts.get(ip);
  if (!rec || Date.now() > rec.until) {
    attempts.set(ip, { n: 1, until: Date.now() + WINDOW });
  } else {
    rec.n += 1;
  }
}

export function clearFailures(ip: string): void {
  attempts.delete(ip);
}
