import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getSession, verifyPassword } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function POST(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const { password } = body;

  const controleur = await get('SELECT password_hash FROM controleurs WHERE id = ?', [session.controleurId]);
  if (!controleur || !verifyPassword(password || '', controleur.password_hash)) {
    return jsonError(401, 'Mot de passe incorrect.');
  }

  await run('UPDATE controleurs SET totp_actif = 0, totp_secret = NULL WHERE id = ?', [session.controleurId]);
  return NextResponse.json({ message: 'Double authentification désactivée.' });
}
