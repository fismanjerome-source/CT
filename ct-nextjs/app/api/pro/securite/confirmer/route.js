import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { verifierTOTP } from '@/lib/totp';
import { jsonError } from '@/lib/utils';

export async function POST(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const { code } = body;

  const controleur = await get('SELECT totp_secret FROM controleurs WHERE id = ?', [session.controleurId]);
  if (!controleur?.totp_secret) {
    return jsonError(400, "Aucune double authentification en attente de confirmation. Recommencez depuis le début.");
  }

  if (!verifierTOTP(controleur.totp_secret, code)) {
    return jsonError(401, 'Code incorrect. Vérifiez votre application et réessayez.');
  }

  await run('UPDATE controleurs SET totp_actif = 1 WHERE id = ?', [session.controleurId]);
  return NextResponse.json({ message: 'Double authentification activée avec succès.' });
}
