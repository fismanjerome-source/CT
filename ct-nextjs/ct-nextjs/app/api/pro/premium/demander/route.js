import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resoudreCentreActif } from '@/lib/pro';
import { jsonError } from '@/lib/utils';
import { envoyerEmail } from '@/lib/email';
import { emailPremiumDemande } from '@/lib/emails/templates';
import { envoyerNotificationTelegram } from '@/lib/telegram';

export async function POST(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const { searchParams } = new URL(request.url);
  const centreId = await resoudreCentreActif(session.controleurId, searchParams.get('centre'));
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  const centre = await get('SELECT nom, est_premium FROM centres WHERE id = ?', [centreId]);
  if (!centre) return jsonError(404, 'Centre introuvable.');
  if (centre.est_premium) return jsonError(400, 'Ce centre est déjà en statut Premium.');

  const controleur = await get('SELECT nom FROM controleurs WHERE id = ?', [session.controleurId]);

  const { subject, html } = emailPremiumDemande({ nomControleur: controleur.nom, nomCentre: centre.nom });
  envoyerEmail({ to: 'contact@creneauct.fr', subject, html }).catch(() => {});
  envoyerNotificationTelegram(
    `★ <b>Nouvelle demande Premium</b>\n${controleur.nom} — ${centre.nom}\nÀ activer depuis l'espace admin une fois le règlement convenu.`
  ).catch(() => {});

  return NextResponse.json({ message: 'Votre demande a bien été transmise. Nous revenons vers vous rapidement.' });
}
