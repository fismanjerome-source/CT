import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { verifierAccesCentre } from '@/lib/pro';
import { jsonError } from '@/lib/utils';
import { envoyerEmail } from '@/lib/email';
import { emailRdvNonHonore } from '@/lib/emails/templates';
import { envoyerNotificationTelegram } from '@/lib/telegram';

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const nouveauStatut = body.absent === false ? 'confirme' : 'absent';

  const rdv = await get(
    `SELECT r.*, c.centre_id, c.date, c.heure, ce.nom AS centre_nom
     FROM rdv r
     JOIN creneaux c ON c.id = r.creneau_id
     JOIN centres ce ON ce.id = c.centre_id
     WHERE r.id = ?`,
    [id]
  );
  if (!rdv) return jsonError(404, 'Rendez-vous introuvable.');

  const centreId = await verifierAccesCentre(session.controleurId, rdv.centre_id);
  if (!centreId) return jsonError(403, 'Non autorisé pour ce rendez-vous.');

  await run('UPDATE rdv SET statut = ? WHERE id = ?', [nouveauStatut, id]);

  if (nouveauStatut === 'absent') {
    const dateLisible = new Date(rdv.date + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const { subject, html } = emailRdvNonHonore({
      clientNom: `${rdv.client_prenom || ''} ${rdv.client_nom}`.trim(),
      centreNom: rdv.centre_nom,
      dateLisible,
      heure: rdv.heure,
    });
    envoyerEmail({ to: rdv.client_email, subject, html }).catch(() => {});
    envoyerNotificationTelegram(
      `🚫 <b>Client absent signalé</b>\nCentre : ${rdv.centre_nom}\nClient : ${rdv.client_prenom || ''} ${rdv.client_nom}\nRDV du : ${rdv.date} à ${rdv.heure}\nRéférence : ${rdv.reference}\nCommission annulée.`
    ).catch(() => {});
  }

  return NextResponse.json({
    message: nouveauStatut === 'absent'
      ? 'Client signalé absent — la commission correspondante ne sera pas due. Un email vient de lui être envoyé.'
      : 'Signalement annulé, le rendez-vous redevient confirmé.',
  });
}
