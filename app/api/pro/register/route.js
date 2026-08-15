import { NextResponse } from 'next/server';
import { db, get, ensureSchema } from '@/lib/db';
import { hashPassword, setSessionCookie } from '@/lib/auth';
import { jsonError } from '@/lib/utils';
import { envoyerEmail } from '@/lib/email';
import { emailBienvenuePro } from '@/lib/emails/templates';
import { envoyerNotificationTelegram } from '@/lib/telegram';
import { genererCodeParrainage } from '@/lib/parrainage';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { email, password, nom, nom_centre, adresse, code_postal, ville, telephone, cgu_acceptees, code_parrainage } = body;

  if (!email || !password || !nom || !nom_centre || !adresse || !code_postal || !ville) {
    return jsonError(400, 'Tous les champs marqués obligatoires doivent être renseignés.');
  }
  if (!cgu_acceptees) {
    return jsonError(400, "Vous devez accepter les Conditions Générales d'Utilisation (CGU) pour créer un compte.");
  }
  if (password.length < 8) {
    return jsonError(400, 'Le mot de passe doit contenir au moins 8 caractères.');
  }

  await ensureSchema();

  let codeParrainValide = null;
  if (code_parrainage && code_parrainage.trim()) {
    const parrain = await get('SELECT id FROM centres WHERE code_parrainage = ?', [code_parrainage.trim().toUpperCase()]);
    if (!parrain) return jsonError(400, "Ce code de parrainage n'existe pas. Vérifiez-le ou laissez le champ vide.");
    codeParrainValide = code_parrainage.trim().toUpperCase();
  }

  const existant = await get('SELECT id FROM controleurs WHERE email = ?', [email.toLowerCase()]);
  if (existant) {
    return jsonError(409, 'Un compte existe déjà avec cet email. Essayez de vous connecter.');
  }

  const tx = await db.transaction('write');
  let controleurId;
  const nouveauCode = await genererCodeParrainage();
  try {
    const centreResult = await tx.execute({
      sql: `INSERT INTO centres (nom, adresse, code_postal, ville, telephone, code_parrainage, parraine_par_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [nom_centre, adresse, code_postal, ville, telephone || null, nouveauCode, codeParrainValide, new Date().toISOString()],
    });
    const centreId = Number(centreResult.lastInsertRowid);

    const controleurResult = await tx.execute({
      sql: `INSERT INTO controleurs (centre_id, nom, email, telephone, password_hash, created_at, email_details_envoye) VALUES (?, ?, ?, ?, ?, ?, 0)`,
      args: [centreId, nom, email.toLowerCase(), telephone || null, hashPassword(password), new Date().toISOString()],
    });
    controleurId = Number(controleurResult.lastInsertRowid);

    await tx.execute({
      sql: `INSERT INTO controleur_centres (controleur_id, centre_id) VALUES (?, ?)`,
      args: [controleurId, centreId],
    });

    await tx.commit();
  } catch (e) {
    await tx.rollback();
    return jsonError(500, "Erreur lors de la création du compte. Réessayez.");
  }

  await setSessionCookie(controleurId);

  // Email et notification envoyés en tâche de fond, sans jamais bloquer ni
  // faire échouer la création de compte si l'un des deux service externe
  // n'est pas configuré ou indisponible.
  const { subject, html } = emailBienvenuePro({ nom, nomCentre: nom_centre });
  envoyerEmail({ to: email.toLowerCase(), subject, html }).catch(() => {});
  envoyerNotificationTelegram(
    `🏢 <b>Nouveau compte professionnel</b>\nCentre : ${nom_centre}\nGérant : ${nom}\nEmail : ${email.toLowerCase()}\nTéléphone : ${telephone || 'non renseigné'}\nVille : ${ville}${codeParrainValide ? `\n🎁 Parrainé via le code ${codeParrainValide}` : ''}`
  ).catch(() => {});

  return NextResponse.json({ message: 'Compte créé.' }, { status: 201 });
}
