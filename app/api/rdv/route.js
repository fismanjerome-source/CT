import { NextResponse } from 'next/server';
import { db, get, ensureSchema } from '@/lib/db';
import { generateReference, jsonError, calculerTauxCommission } from '@/lib/utils';

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

  // La commission est figée au moment de la réservation : elle reflète le
  // délai entre la prise de RDV et la date du contrôle, et ne doit pas
  // changer ensuite même si la date se rapproche.
  const prix = creneau.prix || null;
  const commissionPourcentage = calculerTauxCommission(creneau.date);
  const commissionMontant = prix != null ? Math.round(prix * commissionPourcentage) / 100 : null;

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
      sql: `INSERT INTO rdv (creneau_id, client_nom, client_email, client_telephone, immatriculation, type_vehicule, reference, statut, prix, commission_pourcentage, commission_montant, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'confirme', ?, ?, ?, ?)`,
      args: [creneau_id, client_nom, client_email, client_telephone, immatriculation.toUpperCase(), type_vehicule || null, reference, prix, commissionPourcentage, commissionMontant, now],
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
