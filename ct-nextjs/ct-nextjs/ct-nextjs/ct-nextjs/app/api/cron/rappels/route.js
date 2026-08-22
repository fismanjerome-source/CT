// app/api/cron/rappels/route.js — à appeler une fois par jour (17h30
// suggéré) par un service de tâche planifiée externe et gratuit (ex:
// cron-job.org), avec le paramètre ?cle=VOTRE_CRON_SECRET dans l'URL.
// Envoie un email de rappel à tous les clients ayant un RDV confirmé le
// lendemain, sans jamais envoyer deux fois le même rappel.

import { NextResponse } from 'next/server';
import { all, run } from '@/lib/db';
import { todayISO, jsonError } from '@/lib/utils';
import { envoyerEmail } from '@/lib/email';
import { emailRappelRendezVous } from '@/lib/emails/templates';
import { libelleType } from '@/lib/vehicules';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cle = searchParams.get('cle');

  if (!process.env.CRON_SECRET || cle !== process.env.CRON_SECRET) {
    return jsonError(401, 'Clé secrète manquante ou incorrecte.');
  }

  const demain = todayISO(1);

  const rdvsDemain = await all(
    `SELECT r.id, r.reference, r.client_prenom, r.client_nom, r.client_email, r.type_vehicule, c.heure, ce.nom AS centre_nom, ce.adresse, ce.ville
     FROM rdv r
     JOIN creneaux c ON c.id = r.creneau_id
     JOIN centres ce ON ce.id = c.centre_id
     WHERE c.date = ? AND r.statut = 'confirme' AND (r.rappel_envoye IS NULL OR r.rappel_envoye = 0)`,
    [demain]
  );

  let envoyes = 0;
  for (const rdv of rdvsDemain) {
    const { subject, html } = emailRappelRendezVous({
      clientNom: `${rdv.client_prenom || ''} ${rdv.client_nom}`.trim(),
      centreNom: rdv.centre_nom,
      adresse: `${rdv.adresse}, ${rdv.ville}`,
      heure: rdv.heure,
      typeVehiculeLabel: rdv.type_vehicule ? libelleType(rdv.type_vehicule) : null,
    });
    const resultat = await envoyerEmail({ to: rdv.client_email, subject, html });
    if (resultat.envoye) {
      await run('UPDATE rdv SET rappel_envoye = 1 WHERE id = ?', [rdv.id]);
      envoyes += 1;
    }
  }

  return NextResponse.json({ message: `${envoyes} rappel(s) envoyé(s) pour le ${demain}.`, total_trouves: rdvsDemain.length });
}
