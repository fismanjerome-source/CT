import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getAdminSession, verifyPassword } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const body = await request.json().catch(() => ({}));
  const { password } = body;

  const admin = await get('SELECT password_hash FROM admins WHERE id = ?', [session.adminId]);
  if (!admin || !verifyPassword(password || '', admin.password_hash)) {
    return jsonError(401, 'Mot de passe incorrect.');
  }

  await run('UPDATE admins SET totp_actif = 0, totp_secret = NULL WHERE id = ?', [session.adminId]);
  return NextResponse.json({ message: 'Double authentification désactivée.' });
}
