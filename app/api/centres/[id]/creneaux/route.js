import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { jsonError } from '@/lib/utils';

export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  if (!date) return jsonError(400, 'Paramètre "date" requis (YYYY-MM-DD).');

  const creneaux = await all(
    `SELECT c.id, c.heure, c.duree_minutes, ctrl.nom AS controleur_nom
     FROM creneaux c JOIN controleurs ctrl ON ctrl.id = c.controleur_id
     WHERE c.centre_id = ? AND c.date = ? AND c.statut = 'disponible'
     ORDER BY c.heure`,
    [id, date]
  );

  return NextResponse.json({ creneaux });
}
