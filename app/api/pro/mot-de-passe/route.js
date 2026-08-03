import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getSession, hashPassword, verifyPassword } from '@/lib/auth';
import { jsonError } from '@/lib/utils';
import { envoyerEmail } from '@/lib/email';
import { emailMotDePasseModifie } from '@/lib/emails/templates';

export async function PATCH(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const { mot_de_passe_actuel, nouveau_mot_de_passe } = body;

  if (!mot_de_passe_actuel || !nouveau_mot_de_passe) {
    return jsonError(400, 'Mot de passe actuel et nouveau mot de passe requis.');
  }
  if (nouveau_mot_de_passe.length < 8) {
    return jsonError(400, 'Le nouveau mot de passe doit contenir au moins 8 caractères.');
  }

  const controleur = await get('SELECT * FROM controleurs WHERE id = ?', [session.controleurId]);
  if (!controleur || !verifyPassword(mot_de_passe_actuel, controleur.password_hash)) {
    return jsonError(401, 'Mot de passe actuel incorrect.');
  }

  await run('UPDATE controleurs SET password_hash = ? WHERE id = ?', [
    hashPassword(nouveau_mot_de_passe),
    session.controleurId,
  ]);

  const { subject, html } = emailMotDePasseModifie({ nom: controleur.nom });
  envoyerEmail({ to: controleur.email, subject, html }).catch(() => {});

  return NextResponse.json({ message: 'Mot de passe mis à jour.' });
}
