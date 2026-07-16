import { NextResponse } from 'next/server';
import { db, get, ensureSchema } from '@/lib/db';
import { generateReference, jsonError } from '@/lib/utils';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { creneau_id, client_nom, client_email, client_telephone, immatriculation, type_vehicule } = body;

  if (!creneau_id || !client_nom || !client_email || !client_telephone || !immatriculation) {
    return jsonError(400, 'Champs requis manquants (nom, email, téléphone, immatriculation).');
  }

  await ensureSchema();

  const creneau = await get('SELECT * FROM creneaux WHERE id = ?', [creneau_id]);
  if (!creneau) return jsonError(404, 'Créneau introuvable.');

  const reference = generateReference();
  const now = new Date().toISOString();

  const tx = await db.transaction('write');
  try {
    const updateResult = await tx.execute({
      sql: `UPDATE creneaux SET statut = 'reserve' WHERE id = ? AND statut = 'disponible'`,
      args: [creneau_id],
    });
    if (updateResult.rowsAffected === 0) {
      await tx.rollback();
      return jsonError(409, "Ce créneau vient d'être réservé par quelqu'un d'autre. Merci d'en choisir un autre.");
    }
    await tx.execute({
      sql: `INSERT INTO rdv (creneau_id, client_nom, client_email, client_telephone, immatriculation, type_vehicule, reference, statut, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'confirme', ?)`,
      args: [creneau_id, client_nom, client_email, client_telephone, immatriculation.toUpperCase(), type_vehicule || null, reference, now],
    });
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    return jsonError(500, 'Erreur lors de la réservation.');
  }

  const centre = await get('SELECT nom, adresse, ville FROM centres WHERE id = ?', [creneau.centre_id]);

  return NextResponse.json(
    { rdv: { reference, date: creneau.date, heure: creneau.heure, centre } },
    { status: 201 }
  );
}
