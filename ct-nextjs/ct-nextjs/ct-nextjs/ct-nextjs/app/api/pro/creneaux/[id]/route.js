import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const { id } = await params;
  const creneau = await get('SELECT * FROM creneaux WHERE id = ? AND controleur_id = ?', [id, session.controleurId]);
  if (!creneau) return jsonError(404, 'Créneau introuvable.');

  const body = await request.json().catch(() => ({}));
  const { promo_pourcentage, prix } = body;

  const nouveauPourcentage = promo_pourcentage === '' || promo_pourcentage == null ? null : Number(promo_pourcentage);
  if (nouveauPourcentage != null && (Number.isNaN(nouveauPourcentage) || nouveauPourcentage <= 0 || nouveauPourcentage > 90)) {
    return jsonError(400, 'La remise doit être comprise entre 1 et 90 %.');
  }

  const champs = ['promo_pourcentage = ?'];
  const valeurs = [nouveauPourcentage];
  if (prix !== undefined && prix !== '') {
    champs.push('prix = ?');
    valeurs.push(Number(prix));
  }
  valeurs.push(id);

  await run(`UPDATE creneaux SET ${champs.join(', ')} WHERE id = ?`, valeurs);
  return NextResponse.json({ message: 'Créneau mis à jour.' });
}

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
