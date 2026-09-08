import { NextResponse } from 'next/server';
import { all, run } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resoudreCentreActif } from '@/lib/pro';
import { jsonError, todayISO } from '@/lib/utils';
import { listeJoursFeriesPeriode, joursFeriesFrance, FENETRE_JOURS } from '@/lib/joursFeries';

export async function GET(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const { searchParams } = new URL(request.url);
  const centreId = await resoudreCentreActif(session.controleurId, searchParams.get('centre'));
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  const debut = todayISO();
  const fin = todayISO(FENETRE_JOURS);
  const joursFeries = listeJoursFeriesPeriode(debut, fin);

  const [ignorees, bloques, reserves] = await Promise.all([
    all('SELECT date FROM jours_feries_ignores WHERE centre_id = ? AND date BETWEEN ? AND ?', [centreId, debut, fin]),
    all(
      `SELECT date, COUNT(*) AS nombre FROM creneaux
       WHERE centre_id = ? AND date BETWEEN ? AND ? AND statut = 'bloque' AND bloque_raison = 'ferie'
       GROUP BY date`,
      [centreId, debut, fin]
    ),
    all(
      `SELECT date, COUNT(*) AS nombre FROM creneaux
       WHERE centre_id = ? AND date BETWEEN ? AND ? AND statut = 'reserve'
       GROUP BY date`,
      [centreId, debut, fin]
    ),
  ]);

  const datesDebloquees = new Set(ignorees.map((r) => r.date));
  const bloquesParDate = new Map(bloques.map((r) => [r.date, r.nombre]));
  const reservesParDate = new Map(reserves.map((r) => [r.date, r.nombre]));

  const resultat = joursFeries.map((j) => ({
    date: j.date,
    nom: j.nom,
    bloque: !datesDebloquees.has(j.date),
    nombre_creneaux_bloques: bloquesParDate.get(j.date) || 0,
    nombre_rdv_deja_reserves: reservesParDate.get(j.date) || 0,
  }));

  return NextResponse.json({ jours_feries: resultat });
}

export async function PATCH(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const { date, debloque, centre_id } = body;
  if (!date) return jsonError(400, 'Date requise.');

  const centreId = await resoudreCentreActif(session.controleurId, centre_id);
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  // On ne fait jamais confiance à une date arbitraire envoyée par le client :
  // elle doit correspondre à un vrai jour férié calculé.
  const annee = Number(String(date).slice(0, 4));
  if (!Number.isInteger(annee) || !joursFeriesFrance(annee).some((j) => j.date === date)) {
    return jsonError(400, "Cette date n'est pas un jour férié reconnu.");
  }

  let rowsAffected = 0;
  if (debloque) {
    await run('INSERT OR IGNORE INTO jours_feries_ignores (centre_id, date) VALUES (?, ?)', [centreId, date]);
    const resultat = await run(
      `UPDATE creneaux SET statut = 'disponible', bloque_raison = NULL
       WHERE centre_id = ? AND date = ? AND statut = 'bloque' AND bloque_raison = 'ferie'`,
      [centreId, date]
    );
    rowsAffected = Number(resultat.rowsAffected || 0);
  } else {
    await run('DELETE FROM jours_feries_ignores WHERE centre_id = ? AND date = ?', [centreId, date]);
    const resultat = await run(
      `UPDATE creneaux SET statut = 'bloque', bloque_raison = 'ferie'
       WHERE centre_id = ? AND date = ? AND statut = 'disponible'`,
      [centreId, date]
    );
    rowsAffected = Number(resultat.rowsAffected || 0);
  }

  const message = debloque
    ? `Jour débloqué. ${rowsAffected} créneau(x) redevenu(s) disponible(s).`
    : `Jour rebloqué. ${rowsAffected} créneau(x) bloqué(s).`;

  return NextResponse.json({ message, rows_affected: rowsAffected });
}
