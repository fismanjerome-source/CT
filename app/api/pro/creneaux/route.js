import { NextResponse } from 'next/server';
import { all, run } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resoudreCentreActif } from '@/lib/pro';
import { jsonError, todayISO, calculerTauxCommission } from '@/lib/utils';
import { serializeTypes } from '@/lib/vehicules';

export async function GET(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const { searchParams } = new URL(request.url);
  const centreId = await resoudreCentreActif(session.controleurId, searchParams.get('centre'));
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  const debut = searchParams.get('debut') || todayISO();
  const jours = Number(searchParams.get('jours')) || 14;
  const finDate = new Date(debut + 'T00:00:00');
  finDate.setDate(finDate.getDate() + jours);
  const fin = finDate.toISOString().slice(0, 10);

  const creneaux = await all(
    `SELECT c.*, r.reference AS rdv_reference, r.client_nom, r.client_telephone, r.immatriculation
     FROM creneaux c LEFT JOIN rdv r ON r.creneau_id = c.id AND r.statut = 'confirme'
     WHERE c.centre_id = ? AND c.date BETWEEN ? AND ?
     ORDER BY c.date, c.heure`,
    [centreId, debut, fin]
  );

  // Estimation de la commission à titre indicatif pour le centre, calculée
  // sur le prix APRÈS l'éventuelle promo qu'il a lui-même choisie.
  const creneauxAvecEstimation = creneaux.map((c) => {
    const tauxCommission = calculerTauxCommission(c.date);
    const prixApresPromo = c.prix != null && c.promo_pourcentage
      ? c.prix * (1 - c.promo_pourcentage / 100)
      : c.prix;
    const commissionEstimee = prixApresPromo != null ? Math.round(prixApresPromo * tauxCommission) / 100 : null;
    return { ...c, commission_taux_estime: tauxCommission, commission_montant_estime: commissionEstimee };
  });

  return NextResponse.json({ creneaux: creneauxAvecEstimation });
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const { date, heure, duree_minutes, prix, promo_pourcentage, types_vehicules, centre_id } = body;
  if (!date || !heure) return jsonError(400, 'Date et heure requises.');
  if (!prix || Number(prix) <= 0) return jsonError(400, 'Le prix du contrôle technique est requis.');

  const centreId = await resoudreCentreActif(session.controleurId, centre_id);
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  try {
    const result = await run(
      `INSERT INTO creneaux (centre_id, controleur_id, date, heure, duree_minutes, statut, prix, promo_pourcentage, types_vehicules) VALUES (?, ?, ?, ?, ?, 'disponible', ?, ?, ?)`,
      [centreId, session.controleurId, date, heure, duree_minutes || 30, Number(prix), promo_pourcentage ? Number(promo_pourcentage) : null, serializeTypes(types_vehicules)]
    );
    return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch {
    return jsonError(409, 'Un créneau existe déjà à cette date et heure.');
  }
}
