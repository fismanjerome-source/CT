// app/api/cron/verification-passage/route.js — à appeler une fois par jour
// par un service de tâche planifiée externe (ex: cron-job.org), avec le
// paramètre ?cle=VOTRE_CRON_SECRET. Envoie, le lendemain de chaque RDV
// confirmé, un email demandant si tout s'est bien passé — sert à la fois
// de geste de suivi client et de vérification indirecte que le rendez-vous
// a bien eu lieu.

import { NextResponse } from 'next/server';
import { all, run } from '@/lib/db';
import { todayISO, jsonError } from '@/lib/utils';
import { envoyerEmail } from '@/lib/email';
import { emailVerificationPassage } from '@/lib/emails/templates';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cle = searchParams.get('cle');

  if (!process.env.CRON_SECRET || cle !== process.env.CRON_SECRET) {
    return jsonError(401, 'Clé secrète manquante ou incorrecte.');
  }

  const hier = todayISO(-1);

  const rdvsHier = await all(
    `SELECT r.id, r.client_prenom, r.client_nom, r.client_email, ce.nom AS centre_nom
     FROM rdv r
     JOIN creneaux c ON c.id = r.creneau_id
     JOIN centres ce ON ce.id = c.centre_id
     WHERE c.date = ? AND r.statut = 'confirme' AND (r.verification_envoyee IS NULL OR r.verification_envoyee = 0)`,
    [hier]
  );

  const dateLisible = new Date(hier + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  let envoyes = 0;
  for (const rdv of rdvsHier) {
    const { subject, html } = emailVerificationPassage({
      clientNom: `${rdv.client_prenom || ''} ${rdv.client_nom}`.trim(),
      centreNom: rdv.centre_nom,
      dateLisible,
    });
    const resultat = await envoyerEmail({ to: rdv.client_email, subject, html });
    if (resultat.envoye) {
      await run('UPDATE rdv SET verification_envoyee = 1 WHERE id = ?', [rdv.id]);
      envoyes += 1;
    }
  }

  return NextResponse.json({ message: `${envoyes} email(s) de vérification envoyé(s) pour le ${hier}.`, total_trouves: rdvsHier.length });
}
