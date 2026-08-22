// app/api/cron/email-details-pro/route.js — à appeler toutes les 15 minutes
// par un service de tâche planifiée externe (ex: cron-job.org), avec le
// paramètre ?cle=VOTRE_CRON_SECRET dans l'URL. Envoie un email détaillé sur
// l'espace professionnel, environ 1h après la création du compte, sans
// jamais l'envoyer deux fois au même compte.

import { NextResponse } from 'next/server';
import { all, run } from '@/lib/db';
import { jsonError } from '@/lib/utils';
import { envoyerEmail } from '@/lib/email';
import { emailDetailsEspacePro } from '@/lib/emails/templates';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cle = searchParams.get('cle');

  if (!process.env.CRON_SECRET || cle !== process.env.CRON_SECRET) {
    return jsonError(401, 'Clé secrète manquante ou incorrecte.');
  }

  // Fenêtre de 55 à 90 minutes après l'inscription : suffisamment large
  // pour ne rater personne même si la tâche tourne toutes les 15 minutes.
  const maintenant = Date.now();
  const borneRecente = new Date(maintenant - 55 * 60 * 1000).toISOString();
  const borneAncienne = new Date(maintenant - 90 * 60 * 1000).toISOString();

  const comptes = await all(
    `SELECT ctrl.id, ctrl.nom, ctrl.email, ce.nom AS nom_centre
     FROM controleurs ctrl
     JOIN centres ce ON ce.id = ctrl.centre_id
     WHERE ctrl.created_at <= ? AND ctrl.created_at >= ?
       AND (ctrl.email_details_envoye IS NULL OR ctrl.email_details_envoye = 0)`,
    [borneRecente, borneAncienne]
  );

  let envoyes = 0;
  for (const compte of comptes) {
    const { subject, html } = emailDetailsEspacePro({ nom: compte.nom, nomCentre: compte.nom_centre });
    try {
      await envoyerEmail({ to: compte.email, subject, html });
      envoyes += 1;
    } catch {
      // Une erreur d'envoi pour un compte ne doit jamais bloquer les autres.
    }
    await run('UPDATE controleurs SET email_details_envoye = 1 WHERE id = ?', [compte.id]);
  }

  return NextResponse.json({ traites: comptes.length, envoyes });
}
