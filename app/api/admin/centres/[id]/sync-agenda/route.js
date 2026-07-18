import { NextResponse } from 'next/server';
import { all, get, run } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError, todayISO } from '@/lib/utils';
import { recupererEvenementsAgenda } from '@/lib/ical';

export async function POST(request, { params }) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const { id } = await params;
  const centre = await get('SELECT * FROM centres WHERE id = ?', [id]);
  if (!centre) return jsonError(404, 'Centre introuvable.');
  if (!centre.ical_url) return jsonError(400, "Aucun lien d'agenda renseigné pour ce centre.");

  let evenements;
  try {
    evenements = await recupererEvenementsAgenda(centre.ical_url);
  } catch (e) {
    return jsonError(502, `Échec de la lecture de l'agenda externe : ${e.message}`);
  }

  // On ne regarde que les événements à venir dans les 60 prochains jours,
  // pour rester rapide et pertinent (pas la peine de scanner tout l'historique).
  const debutFenetre = new Date(todayISO() + 'T00:00:00');
  const finFenetre = new Date(todayISO(60) + 'T23:59:59');
  const evenementsPertinents = evenements.filter((e) => e.fin >= debutFenetre && e.debut <= finFenetre);

  const creneaux = await all(
    `SELECT id, date, heure, duree_minutes FROM creneaux
     WHERE centre_id = ? AND statut = 'disponible' AND date BETWEEN ? AND ?`,
    [id, todayISO(), todayISO(60)]
  );

  let bloques = 0;
  for (const c of creneaux) {
    const debutCreneau = new Date(`${c.date}T${c.heure}:00`);
    const finCreneau = new Date(debutCreneau.getTime() + (c.duree_minutes || 30) * 60000);

    const enConflit = evenementsPertinents.some((e) => debutCreneau < e.fin && finCreneau > e.debut);
    if (enConflit) {
      await run(`UPDATE creneaux SET statut = 'bloque' WHERE id = ?`, [c.id]);
      bloques += 1;
    }
  }

  return NextResponse.json({
    message: `${bloques} créneau(x) bloqué(s) suite à ${evenementsPertinents.length} événement(s) trouvé(s) dans l'agenda externe.`,
    evenements_trouves: evenementsPertinents.length,
    creneaux_bloques: bloques,
  });
}
