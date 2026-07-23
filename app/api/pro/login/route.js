import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { verifyPassword, setSessionCookie } from '@/lib/auth';
import { jsonError } from '@/lib/utils';
import { verifierLimite, enregistrerEchec, reinitialiser, obtenirIp } from '@/lib/rateLimit';

export async function POST(request) {
  const ip = obtenirIp(request);
  const cle = `pro:${ip}`;

  const limite = verifierLimite(cle);
  if (!limite.autorise) {
    return jsonError(429, `Trop de tentatives. Réessayez dans ${limite.minutesRestantes} minute(s).`);
  }

  const body = await request.json().catch(() => ({}));
  const { email, password } = body;
  if (!email || !password) return jsonError(400, 'Email et mot de passe requis.');

  const controleur = await get('SELECT * FROM controleurs WHERE email = ?', [email.toLowerCase()]);
  if (!controleur || !verifyPassword(password, controleur.password_hash)) {
    enregistrerEchec(cle);
    return jsonError(401, 'Identifiants incorrects.');
  }

  reinitialiser(cle);
  await setSessionCookie(controleur.id);

  return NextResponse.json({
    message: 'Connecté.',
    controleur: { id: controleur.id, nom: controleur.nom, email: controleur.email },
  });
}
