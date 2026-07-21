import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { verifierJetonPrelogin, setAdminSessionCookie } from '@/lib/auth';
import { verifierTOTP } from '@/lib/totp';
import { jsonError } from '@/lib/utils';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { jeton, code } = body;

  const prelogin = verifierJetonPrelogin(jeton);
  if (!prelogin) {
    return jsonError(401, 'Session de connexion expirée, veuillez recommencer.');
  }

  const admin = await get('SELECT * FROM admins WHERE id = ?', [prelogin.adminId]);
  if (!admin || !admin.totp_actif) {
    return jsonError(401, 'Compte introuvable.');
  }

  if (!verifierTOTP(admin.totp_secret, code)) {
    return jsonError(401, 'Code incorrect. Vérifiez votre application et réessayez.');
  }

  await setAdminSessionCookie(admin.id, admin.nom);
  return NextResponse.json({ message: 'Connecté.', nom: admin.nom });
}
