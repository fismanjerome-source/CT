import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { verifierJetonPreloginPro, setSessionCookie } from '@/lib/auth';
import { verifierTOTP } from '@/lib/totp';
import { jsonError } from '@/lib/utils';
import { verifierLimite, enregistrerEchec, obtenirIp } from '@/lib/rateLimit';

export async function POST(request) {
  const ip = obtenirIp(request);
  const cle = `pro-code:${ip}`;

  const limite = verifierLimite(cle);
  if (!limite.autorise) {
    return jsonError(429, `Trop de tentatives. Réessayez dans ${limite.minutesRestantes} minute(s).`);
  }

  const body = await request.json().catch(() => ({}));
  const { jeton, code } = body;

  const prelogin = verifierJetonPreloginPro(jeton);
  if (!prelogin) {
    return jsonError(401, 'Session de connexion expirée, veuillez recommencer.');
  }

  const controleur = await get('SELECT * FROM controleurs WHERE id = ?', [prelogin.controleurId]);
  if (!controleur || !controleur.totp_actif) {
    return jsonError(401, 'Compte introuvable.');
  }

  if (!verifierTOTP(controleur.totp_secret, code)) {
    enregistrerEchec(cle);
    return jsonError(401, 'Code incorrect. Vérifiez votre application et réessayez.');
  }

  await setSessionCookie(controleur.id);
  return NextResponse.json({
    message: 'Connecté.',
    controleur: { id: controleur.id, nom: controleur.nom, email: controleur.email },
  });
}
