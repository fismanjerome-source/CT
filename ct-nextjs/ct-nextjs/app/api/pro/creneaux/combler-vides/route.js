import { NextResponse } from 'next/server';
import { db, ensureSchema } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resoudreCentreActif } from '@/lib/pro';
import { jsonError } from '@/lib/utils';
import { serializeTypes } from '@/lib/vehicules';
import { centreEstBloque } from '@/lib/facturation';

export async function POST(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const { date_debut, date_fin, plages, intervalle_minutes, duree_minutes, type_visite, jours_semaine, prix, promo_pourcentage, types_vehicules, centre_id } = body;

  if (!date_debut || !date_fin) {
    return jsonError(400, 'date_debut et date_fin sont requis.');
  }
  if (!Array.isArray(plages) || plages.length === 0) {
    return jsonError(400, 'Au moins une plage horaire (heure de début / heure de fin) est requise.');
  }
  for (const p of plages) {
    if (!p.heure_debut || !p.heure_fin) {
      return jsonError(400, 'Chaque plage horaire doit avoir une heure de début et une heure de fin.');
    }
  }
  if (prix === '' || prix == null || Number(prix) < 0) {
    return jsonError(400, 'Le prix est requis (0 accepté pour une contre-visite gratuite).');
  }

  await ensureSchema();
  const centreId = await resoudreCentreActif(session.controleurId, centre_id);
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  if (await centreEstBloque(centreId)) {
    return jsonError(403, "Ouverture de créneaux bloquée : une commission Créneau CT est en retard de paiement pour ce centre. Régularisez la situation depuis l'onglet « Paiements » ou contactez-nous.");
  }

  const intervalle = Number(intervalle_minutes) || 30;
  const duree = Number(duree_minutes) || 30;
  const typeVisiteFinal = type_visite === 'contre_visite' ? 'contre_visite' : 'normale';
  const joursAutorises = Array.isArray(jours_semaine) && jours_semaine.length ? jours_semaine : [1, 2, 3, 4, 5, 6];

  const cursor = new Date(date_debut + 'T00:00:00');
  const finDate = new Date(date_fin + 'T00:00:00');

  const tx = await db.transaction('write');
  let created = 0;
  try {
    while (cursor <= finDate) {
      if (joursAutorises.includes(cursor.getDay())) {
        const dateStr = cursor.toISOString().slice(0, 10);

        for (const plage of plages) {
          const [hDebutH, hDebutM] = plage.heure_debut.split(':').map(Number);
          const [hFinH, hFinM] = plage.heure_fin.split(':').map(Number);
          let minutesCursor = hDebutH * 60 + hDebutM;
          const minutesFin = hFinH * 60 + hFinM;

          while (minutesCursor < minutesFin) {
            const h = String(Math.floor(minutesCursor / 60)).padStart(2, '0');
            const m = String(minutesCursor % 60).padStart(2, '0');
            const result = await tx.execute({
              sql: `INSERT OR IGNORE INTO creneaux (centre_id, controleur_id, date, heure, duree_minutes, type_visite, statut, prix, promo_pourcentage, types_vehicules) VALUES (?, ?, ?, ?, ?, ?, 'disponible', ?, ?, ?)`,
              args: [centreId, session.controleurId, dateStr, `${h}:${m}`, duree, typeVisiteFinal, Number(prix), promo_pourcentage ? Number(promo_pourcentage) : null, serializeTypes(types_vehicules)],
            });
            if (result.rowsAffected > 0) created += 1;
            minutesCursor += intervalle;
          }
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    return jsonError(500, "Erreur lors de l'ouverture des créneaux.");
  }

  return NextResponse.json({ message: `${created} créneau(x) ouvert(s).`, nombre_crees: created }, { status: 201 });
}
