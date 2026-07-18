import { NextResponse } from 'next/server';
import { db, get, ensureSchema } from '@/lib/db';
import { hashPassword, setSessionCookie } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { email, password, nom, nom_centre, adresse, code_postal, ville, telephone } = body;

  if (!email || !password || !nom || !nom_centre || !adresse || !code_postal || !ville) {
    return jsonError(400, 'Tous les champs marqués obligatoires doivent être renseignés.');
  }
  if (password.length < 8) {
    return jsonError(400, 'Le mot de passe doit contenir au moins 8 caractères.');
  }

  await ensureSchema();

  const existant = await get('SELECT id FROM controleurs WHERE email = ?', [email.toLowerCase()]);
  if (existant) {
    return jsonError(409, 'Un compte existe déjà avec cet email. Essayez de vous connecter.');
  }

  const tx = await db.transaction('write');
  let controleurId;
  try {
    const centreResult = await tx.execute({
      sql: `INSERT INTO centres (nom, adresse, code_postal, ville, telephone) VALUES (?, ?, ?, ?, ?)`,
      args: [nom_centre, adresse, code_postal, ville, telephone || null],
    });
    const centreId = Number(centreResult.lastInsertRowid);

    const controleurResult = await tx.execute({
      sql: `INSERT INTO controleurs (centre_id, nom, email, telephone, password_hash) VALUES (?, ?, ?, ?, ?)`,
      args: [centreId, nom, email.toLowerCase(), telephone || null, hashPassword(password)],
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

  return NextResponse.json({ message: 'Compte créé.' }, { status: 201 });
}
