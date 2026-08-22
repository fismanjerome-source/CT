import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getAdminSession, hashPassword, verifyPassword } from '@/lib/auth';
import { jsonError } from '@/lib/utils';
import { envoyerEmail } from '@/lib/email';
import { emailMotDePasseModifie } from '@/lib/emails/templates';

export async function PATCH(request) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const body = await request.json().catch(() => ({}));
  const { mot_de_passe_actuel, nouveau_mot_de_passe } = body;

  if (!mot_de_passe_actuel || !nouveau_mot_de_passe) {
    return jsonError(400, 'Mot de passe actuel et nouveau mot de passe requis.');
  }
  if (nouveau_mot_de_passe.length < 8) {
    return jsonError(400, 'Le nouveau mot de passe doit contenir au moins 8 caractères.');
  }

  const admin = await get('SELECT nom, email, password_hash FROM admins WHERE id = ?', [session.adminId]);
  if (!admin || !verifyPassword(mot_de_passe_actuel, admin.password_hash)) {
    return jsonError(401, 'Mot de passe actuel incorrect.');
  }

  await run('UPDATE admins SET password_hash = ? WHERE id = ?', [hashPassword(nouveau_mot_de_passe), session.adminId]);

  const { subject, html } = emailMotDePasseModifie({ nom: admin.nom });
  envoyerEmail({ to: admin.email, subject, html }).catch(() => {});

  return NextResponse.json({ message: 'Mot de passe mis à jour.' });
}
