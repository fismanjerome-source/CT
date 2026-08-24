import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resoudreCentreActif } from '@/lib/pro';
import { jsonError, todayISO } from '@/lib/utils';

export async function GET(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const { searchParams } = new URL(request.url);
  const centreId = await resoudreCentreActif(session.controleurId, searchParams.get('centre'));
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  const debut = searchParams.get('debut') || todayISO();
  const finDate = new Date(debut + 'T00:00:00Z');
  finDate.setUTCDate(finDate.getUTCDate() + 6);
  const fin = finDate.toISOString().slice(0, 10);

  const rdvs = await all(
    `SELECT r.id, r.client_prenom, r.client_nom, r.client_telephone, r.reference, r.statut, c.date, c.heure
     FROM rdv r JOIN creneaux c ON c.id = r.creneau_id
     WHERE c.centre_id = ? AND c.date BETWEEN ? AND ? AND r.statut IN ('confirme', 'absent')
     ORDER BY c.date, c.heure`,
    [centreId, debut, fin]
  );

  return NextResponse.json({ rdvs, debut, fin });
}
