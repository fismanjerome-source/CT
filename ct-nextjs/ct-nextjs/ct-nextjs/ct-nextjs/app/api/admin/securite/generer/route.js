import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { genererSecretBase32, construireUriOtpauth } from '@/lib/totp';
import { jsonError } from '@/lib/utils';

export async function POST() {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const admin = await get('SELECT email FROM admins WHERE id = ?', [session.adminId]);
  if (!admin) return jsonError(404, 'Compte introuvable.');

  // Le secret est enregistré tout de suite, mais totp_actif reste à 0 tant
  // que le code n'a pas été confirmé — un abandon en cours de route n'active
  // donc jamais la double authentification par erreur.
  const secret = genererSecretBase32();
  await run('UPDATE admins SET totp_secret = ?, totp_actif = 0 WHERE id = ?', [secret, session.adminId]);

  const otpauthUri = construireUriOtpauth(secret, admin.email);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpauthUri)}`;

  return NextResponse.json({ secret, otpauth_uri: otpauthUri, qr_url: qrUrl });
}
