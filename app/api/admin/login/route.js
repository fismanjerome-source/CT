import { NextResponse } from 'next/server';
import { setAdminSessionCookie } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { password } = body;

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return jsonError(500, "Aucun mot de passe admin configuré côté serveur (variable ADMIN_PASSWORD manquante).");
  }
  if (!password || password !== adminPassword) {
    return jsonError(401, 'Mot de passe incorrect.');
  }

  await setAdminSessionCookie();
  return NextResponse.json({ message: 'Connecté.' });
}
