import { NextResponse } from 'next/server';
import { all, get, run } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { jsonError, todayISO } from '@/lib/utils';

export async function GET(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const { searchParams } = new URL(request.url);
  const debut = searchParams.get('debut') || todayISO();
  const jours = Number(searchParams.get('jours')) || 14;
  const finDate = new Date(debut + 'T00:00:00');
  finDate.setDate(finDate.getDate() + jours);
  const fin = finDate.toISOString().slice(0, 10);

  const creneaux = await all(
    `SELECT c.*, r.reference AS rdv_reference, r.client_nom, r.client_telephone, r.immatriculation
     FROM creneaux c LEFT JOIN rdv r ON r.creneau_id = c.id AND r.statut = 'confirme'
     WHERE c.controleur_id = ? AND c.date BETWEEN ? AND ?
     ORDER BY c.date, c.heure`,
    [session.controleurId, debut, fin]
  );

  return NextResponse.json({ creneaux });
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const { date, heure, duree_minutes, promo_pourcentage } = body;
  if (!date || !heure) return jsonError(400, 'Date et heure requises.');

  const controleur = await get('SELECT centre_id FROM controleurs WHERE id = ?', [session.controleurId]);

  try {
    const result = await run(
      `INSERT INTO creneaux (centre_id, controleur_id, date, heure, duree_minutes, statut, promo_pourcentage) VALUES (?, ?, ?, ?, ?, 'disponible', ?)`,
      [controleur.centre_id, session.controleurId, date, heure, duree_minutes || 30, promo_pourcentage || null]
    );
    return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch {
    return jsonError(409, 'Un créneau existe déjà à cette date et heure.');
  }
}
