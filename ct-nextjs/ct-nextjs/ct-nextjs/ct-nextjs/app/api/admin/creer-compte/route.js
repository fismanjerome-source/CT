import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getAdminSession, hashPassword } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const body = await request.json().catch(() => ({}));
  const { nom, email, password } = body;

  if (!nom || !email || !password) {
    return jsonError(400, 'Nom, email et mot de passe sont requis.');
  }
  if (password.length < 8) {
    return jsonError(400, 'Le mot de passe doit contenir au moins 8 caractères.');
  }

  const existant = await get('SELECT id FROM admins WHERE email = ?', [email.toLowerCase()]);
  if (existant) return jsonError(409, 'Un compte existe déjà avec cet email.');

  await run(
    'INSERT INTO admins (nom, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
    [nom, email.toLowerCase(), hashPassword(password), new Date().toISOString()]
  );

  return NextResponse.json({ message: 'Compte créé.' }, { status: 201 });
}
