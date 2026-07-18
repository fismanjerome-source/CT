import { NextResponse } from 'next/server';
import { db, ensureSchema } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resoudreCentreActif } from '@/lib/pro';
import { jsonError } from '@/lib/utils';
import { serializeTypes } from '@/lib/vehicules';

export async function POST(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const { date_debut, date_fin, heure_debut, heure_fin, intervalle_minutes, duree_minutes, jours_semaine, prix, promo_pourcentage, types_vehicules, centre_id } = body;

  if (!date_debut || !date_fin || !heure_debut || !heure_fin) {
    return jsonError(400, 'date_debut, date_fin, heure_debut et heure_fin sont requis.');
  }
  if (!prix || Number(prix) <= 0) {
    return jsonError(400, 'Le prix du contrôle technique est requis.');
  }

  await ensureSchema();
  const centreId = await resoudreCentreActif(session.controleurId, centre_id);
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  const intervalle = Number(intervalle_minutes) || 30;
  const duree = Number(duree_minutes) || 30;
  const joursAutorises = Array.isArray(jours_semaine) && jours_semaine.length ? jours_semaine : [1, 2, 3, 4, 5, 6];

  const [hDebutH, hDebutM] = heure_debut.split(':').map(Number);
  const [hFinH, hFinM] = heure_fin.split(':').map(Number);
  const cursor = new Date(date_debut + 'T00:00:00');
  const finDate = new Date(date_fin + 'T00:00:00');

  const tx = await db.transaction('write');
  let created = 0;
  try {
    while (cursor <= finDate) {
      if (joursAutorises.includes(cursor.getDay())) {
        let minutesCursor = hDebutH * 60 + hDebutM;
        const minutesFin = hFinH * 60 + hFinM;
        const dateStr = cursor.toISOString().slice(0, 10);
        while (minutesCursor < minutesFin) {
          const h = String(Math.floor(minutesCursor / 60)).padStart(2, '0');
          const m = String(minutesCursor % 60).padStart(2, '0');
          const result = await tx.execute({
            sql: `INSERT OR IGNORE INTO creneaux (centre_id, controleur_id, date, heure, duree_minutes, statut, prix, promo_pourcentage, types_vehicules) VALUES (?, ?, ?, ?, ?, 'disponible', ?, ?, ?)`,
            args: [centreId, session.controleurId, dateStr, `${h}:${m}`, duree, Number(prix), promo_pourcentage ? Number(promo_pourcentage) : null, serializeTypes(types_vehicules)],
          });
          if (result.rowsAffected > 0) created += 1;
          minutesCursor += intervalle;
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
