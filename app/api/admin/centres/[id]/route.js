import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function PATCH(request, { params }) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { ical_url, nom, est_premium } = body;

  const centre = await get('SELECT id FROM centres WHERE id = ?', [id]);
  if (!centre) return jsonError(404, 'Centre introuvable.');

  if (nom !== undefined) {
    if (!nom.trim()) return jsonError(400, 'Le nom ne peut pas être vide.');
    await run('UPDATE centres SET nom = ? WHERE id = ?', [nom.trim(), id]);
  }
  if (ical_url !== undefined) {
    await run('UPDATE centres SET ical_url = ? WHERE id = ?', [ical_url ? ical_url.trim() : null, id]);
  }
  if (est_premium !== undefined) {
    await run(
      'UPDATE centres SET est_premium = ?, premium_depuis = ? WHERE id = ?',
      [est_premium ? 1 : 0, est_premium ? new Date().toISOString() : null, id]
    );
  }

  return NextResponse.json({ message: 'Centre mis à jour.' });
}

export async function DELETE(request, { params }) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const { id } = await params;
  const centre = await get('SELECT id FROM centres WHERE id = ?', [id]);
  if (!centre) return jsonError(404, 'Centre introuvable.');

  const rdvEnCours = await get(
    `SELECT COUNT(*) AS total FROM rdv r JOIN creneaux c ON c.id = r.creneau_id
     WHERE c.centre_id = ? AND r.statut = 'confirme' AND c.date >= date('now')`,
    [id]
  );
  if (rdvEnCours.total > 0) {
    return jsonError(409, `Impossible : ${rdvEnCours.total} rendez-vous confirmé(s) à venir sur ce centre. Contactez les clients concernés avant de le supprimer.`);
  }

  // Supprime le centre et tout ce qui lui est directement lié (créneaux,
  // historique de rendez-vous, factures) — les comptes contrôleurs qui ne
  // géraient QUE ce centre sont ensuite nettoyés séparément.
  await run('DELETE FROM centres WHERE id = ?', [id]);
  await run(
    `DELETE FROM controleurs WHERE id NOT IN (SELECT DISTINCT controleur_id FROM controleur_centres)`
  );

  return NextResponse.json({ message: 'Centre supprimé.' });
}
