import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { verifierTOTP } from '@/lib/totp';
import { jsonError } from '@/lib/utils';

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const body = await request.json().catch(() => ({}));
  const { code } = body;

  const admin = await get('SELECT totp_secret FROM admins WHERE id = ?', [session.adminId]);
  if (!admin?.totp_secret) {
    return jsonError(400, "Aucune double authentification en attente de confirmation. Recommencez depuis le début.");
  }

  if (!verifierTOTP(admin.totp_secret, code)) {
    return jsonError(401, 'Code incorrect. Vérifiez votre application et réessayez.');
  }

  await run('UPDATE admins SET totp_actif = 1 WHERE id = ?', [session.adminId]);
  return NextResponse.json({ message: 'Double authentification activée avec succès.' });
}
