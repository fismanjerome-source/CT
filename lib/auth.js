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

// ---------------------------------------------------------------------
// Session "admin" — compte unique réservé au propriétaire de la
// plateforme (pas un compte par centre), pour consulter les commissions
// dues par l'ensemble des centres. Le mot de passe est défini via la
// variable d'environnement ADMIN_PASSWORD (à définir sur Render/Vercel).
// ---------------------------------------------------------------------
const ADMIN_COOKIE_NAME = 'admin_session_token';
const ADMIN_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export function createAdminSessionToken(adminId, nom) {
  const payload = JSON.stringify({ admin: true, adminId, nom, exp: Date.now() + ADMIN_SESSION_DURATION_MS });
  const payloadB64 = base64url(payload);
  const sig = crypto.createHmac('sha256', SECRET).update(`admin:${payloadB64}`).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyAdminSessionToken(token) {
  if (!token) return null;
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(`admin:${payloadB64}`).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (!payload.admin || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setAdminSessionCookie(adminId, nom) {
  const token = createAdminSessionToken(adminId, nom);
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_DURATION_MS / 1000,
  });
}

export async function clearAdminSessionCookie() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
}

export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

// ---------------------------------------------------------------------
// Jeton temporaire (5 min) utilisé entre l'étape "mot de passe correct"
// et l'étape "code à 6 chiffres" pour les comptes admin ayant activé la
// double authentification — évite de renvoyer le mot de passe une seconde
// fois, sans avoir besoin de stockage de session côté serveur.
// ---------------------------------------------------------------------
const PRELOGIN_DURATION_MS = 5 * 60 * 1000;

export function creerJetonPrelogin(adminId) {
  const payload = JSON.stringify({ adminId, exp: Date.now() + PRELOGIN_DURATION_MS });
  const payloadB64 = base64url(payload);
  const sig = crypto.createHmac('sha256', SECRET).update(`prelogin:${payloadB64}`).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifierJetonPrelogin(token) {
  if (!token) return null;
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(`prelogin:${payloadB64}`).digest('base64url');
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

// Même principe que ci-dessus, pour les comptes pro (centres) — un contexte
// de signature différent ("prelogin-pro") pour rester cryptographiquement
// distinct des jetons admin.
export function creerJetonPreloginPro(controleurId) {
  const payload = JSON.stringify({ controleurId, exp: Date.now() + PRELOGIN_DURATION_MS });
  const payloadB64 = base64url(payload);
  const sig = crypto.createHmac('sha256', SECRET).update(`prelogin-pro:${payloadB64}`).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifierJetonPreloginPro(token) {
  if (!token) return null;
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(`prelogin-pro:${payloadB64}`).digest('base64url');
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
