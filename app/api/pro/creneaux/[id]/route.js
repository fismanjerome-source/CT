import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const { id } = await params;
  const creneau = await get('SELECT * FROM creneaux WHERE id = ? AND controleur_id = ?', [id, session.controleurId]);
  if (!creneau) return jsonError(404, 'Créneau introuvable.');
  if (creneau.statut === 'reserve') {
    return jsonError(409, "Impossible de supprimer un créneau déjà réservé. Contactez le client pour annuler le RDV d'abord.");
  }

  await run('DELETE FROM creneaux WHERE id = ?', [id]);
  return NextResponse.json({ message: 'Créneau supprimé.' });
}
