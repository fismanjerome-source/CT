import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { verifyPassword, setAdminSessionCookie, creerJetonPrelogin } from '@/lib/auth';
import { jsonError } from '@/lib/utils';
import { verifierLimite, enregistrerEchec, obtenirIp } from '@/lib/rateLimit';

export async function POST(request) {
  const ip = obtenirIp(request);
  const cle = `admin:${ip}`;

  const limite = verifierLimite(cle);
  if (!limite.autorise) {
    return jsonError(429, `Trop de tentatives. Réessayez dans ${limite.minutesRestantes} minute(s).`);
  }

  const body = await request.json().catch(() => ({}));
  const { email, password } = body;

  if (!email || !password) {
    return jsonError(400, 'Email et mot de passe requis.');
  }

  const admin = await get('SELECT * FROM admins WHERE email = ?', [email.toLowerCase()]);
  if (!admin || !verifyPassword(password, admin.password_hash)) {
    enregistrerEchec(cle);
    return jsonError(401, 'Email ou mot de passe incorrect.');
  }

  if (admin.totp_actif) {
    return NextResponse.json({
      besoin_code: true,
      jeton: creerJetonPrelogin(admin.id),
    });
  }

  await setAdminSessionCookie(admin.id, admin.nom);
  return NextResponse.json({ message: 'Connecté.', nom: admin.nom });
}
