// lib/auth.js — mots de passe hachés (scrypt) + sessions signées par cookie.
//
// Contrairement à une session en mémoire (qui ne fonctionnerait pas sur des
// fonctions serverless éphémères comme sur Vercel), le token contient
// lui-même les infos nécessaires, signées avec une clé secrète : pas besoin
// de stockage côté serveur.

import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8h
const COOKIE_NAME = 'session_token';

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(check);
  const b = Buffer.from(hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function base64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

export function createSessionToken(controleurId) {
  const payload = JSON.stringify({ controleurId, exp: Date.now() + SESSION_DURATION_MS });
  const payloadB64 = base64url(payload);
  const sig = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token) return null;
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// À appeler depuis un Route Handler (app/api/.../route.js) après connexion.
export async function setSessionCookie(controleurId) {
  const token = createSessionToken(controleurId);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

// À appeler depuis un Route Handler pour récupérer la session courante.
export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
