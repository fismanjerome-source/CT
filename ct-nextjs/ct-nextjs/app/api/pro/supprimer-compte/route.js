import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getSession, verifyPassword, clearSessionCookie, hashPassword } from '@/lib/auth';
import { jsonError } from '@/lib/utils';
import crypto from 'node:crypto';

// RGPD — droit à l'effacement. On n'efface pas la ligne "controleurs" en
// base (ce qui supprimerait en cascade tous les créneaux du centre, et donc
// l'historique de réservations d'autres clients ainsi que les commissions
// dues, déjà facturées ou non). On anonymise à la place les données
// personnelles (nom, email, téléphone, mot de passe) de façon irréversible,
// et on retire l'accès de ce compte à tous ses centres — l'historique
// commercial reste intact, mais plus aucune donnée personnelle identifiable
// n'est conservée, et le compte ne peut plus jamais se reconnecter.
export async function POST(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const { password, confirmation } = body;

  if (confirmation !== 'SUPPRIMER') {
    return jsonError(400, 'Merci de taper SUPPRIMER pour confirmer.');
  }

  const controleur = await get('SELECT password_hash FROM controleurs WHERE id = ?', [session.controleurId]);
  if (!controleur || !verifyPassword(password || '', controleur.password_hash)) {
    return jsonError(401, 'Mot de passe incorrect.');
  }

  const identifiantAnonyme = crypto.randomBytes(8).toString('hex');
  await run(
    `UPDATE controleurs
     SET nom = 'Compte supprimé', email = ?, telephone = NULL, password_hash = ?
     WHERE id = ?`,
    [`supprime-${identifiantAnonyme}@deleted.creneauct.fr`, hashPassword(crypto.randomBytes(32).toString('hex')), session.controleurId]
  );
  await run('DELETE FROM controleur_centres WHERE controleur_id = ?', [session.controleurId]);

  await clearSessionCookie();

  return NextResponse.json({ message: 'Votre compte a été supprimé.' });
}
