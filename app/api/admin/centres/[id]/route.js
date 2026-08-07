import { NextResponse } from 'next/server';
import { get, all, run } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError, todayISO } from '@/lib/utils';
import { commissionMoisEnCours } from '@/lib/facturation';
import { envoyerEmail } from '@/lib/email';
import { emailPremiumActive, emailPremiumArrete } from '@/lib/emails/templates';

export async function PATCH(request, { params }) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { ical_url, nom, est_premium, est_demo, commission_taux_fixe, premium_offert } = body;

  const centre = await get('SELECT id, nom, est_premium FROM centres WHERE id = ?', [id]);
  if (!centre) return jsonError(404, 'Centre introuvable.');

  if (nom !== undefined) {
    if (!nom.trim()) return jsonError(400, 'Le nom ne peut pas être vide.');
    await run('UPDATE centres SET nom = ? WHERE id = ?', [nom.trim(), id]);
  }
  if (ical_url !== undefined) {
    await run('UPDATE centres SET ical_url = ? WHERE id = ?', [ical_url ? ical_url.trim() : null, id]);
  }
  if (est_demo !== undefined) {
    await run('UPDATE centres SET est_demo = ? WHERE id = ?', [est_demo ? 1 : 0, id]);
  }
  if (commission_taux_fixe !== undefined) {
    const valeur = commission_taux_fixe === '' || commission_taux_fixe === null ? null : Number(commission_taux_fixe);
    if (valeur !== null && (Number.isNaN(valeur) || valeur < 0 || valeur > 100)) {
      return jsonError(400, 'Le taux fixe doit être compris entre 0 et 100, ou vide pour revenir aux paliers habituels.');
    }
    await run('UPDATE centres SET commission_taux_fixe = ? WHERE id = ?', [valeur, id]);
  }
  if (premium_offert !== undefined) {
    await run('UPDATE centres SET premium_offert = ? WHERE id = ?', [premium_offert ? 1 : 0, id]);
    // Le Premium offert active aussi le statut lui-même, sans quoi le
    // centre ne bénéficierait d'aucun des avantages malgré la gratuité.
    if (premium_offert && !centre.est_premium) {
      await run(
        'UPDATE centres SET est_premium = 1, premium_depuis = ?, premium_desactive_le = NULL WHERE id = ?',
        [new Date().toISOString(), id]
      );
    }
  }

  if (est_premium !== undefined && !!est_premium !== !!centre.est_premium) {
    const maintenant = new Date().toISOString();
    if (est_premium) {
      await run(
        'UPDATE centres SET est_premium = 1, premium_depuis = ?, premium_desactive_le = NULL WHERE id = ?',
        [maintenant, id]
      );
    } else {
      await run('UPDATE centres SET est_premium = 0, premium_desactive_le = ? WHERE id = ?', [maintenant, id]);
    }

    const controleurs = await all(
      `SELECT ctrl.nom, ctrl.email FROM controleurs ctrl JOIN controleur_centres cc ON cc.controleur_id = ctrl.id WHERE cc.centre_id = ?`,
      [id]
    );
    const moisEnCours = await commissionMoisEnCours(id);
    const moisLisible = new Date(todayISO() + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const jourDuMois = Number(todayISO().slice(8, 10));
    const totalJoursMois = new Date(Number(todayISO().slice(0, 4)), Number(todayISO().slice(5, 7)), 0).getDate();

    for (const c of controleurs) {
      if (est_premium) {
        const { subject, html } = emailPremiumActive({
          nomControleur: c.nom, nomCentre: centre.nom,
          montantProrata: moisEnCours.montant_premium,
          joursRestants: totalJoursMois - jourDuMois + 1,
          moisLisible,
        });
        envoyerEmail({ to: c.email, subject, html }).catch(() => {});
      } else {
        const { subject, html } = emailPremiumArrete({
          nomControleur: c.nom, nomCentre: centre.nom,
          montantProrata: moisEnCours.montant_premium,
          joursActifs: jourDuMois,
          moisLisible,
        });
        envoyerEmail({ to: c.email, subject, html }).catch(() => {});
      }
    }
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
