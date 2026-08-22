// app/api/cron/rappel-commission/route.js — à appeler une fois par jour par
// une tâche planifiée externe (ex: cron-job.org), avec ?cle=VOTRE_CRON_SECRET.
// Envoie un rappel de commission au centre le 1er de chaque mois (jour
// courant vérifié dans le code, donc sans risque même si la tâche tourne
// tous les jours) — uniquement si une commission est réellement due sur le
// mois qui vient de se terminer.

import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { jsonError, todayISO } from '@/lib/utils';
import { dateLimitePaiement } from '@/lib/facturation';
import { envoyerEmail } from '@/lib/email';
import { emailRappelCommissionMensuelle } from '@/lib/emails/templates';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cle = searchParams.get('cle');
  if (!process.env.CRON_SECRET || cle !== process.env.CRON_SECRET) {
    return jsonError(401, 'Clé secrète manquante ou incorrecte.');
  }

  const aujourdHui = todayISO();
  if (Number(aujourdHui.slice(8, 10)) !== 1) {
    return NextResponse.json({ message: "Rien à faire aujourd'hui (envoyé uniquement le 1er du mois).", envoyes: 0 });
  }

  // Le mois qui vient de se terminer (celui d'hier).
  const [annee, mois] = aujourdHui.slice(0, 7).split('-').map(Number);
  const moisPrecedent = mois === 1 ? `${annee - 1}-12` : `${annee}-${String(mois - 1).padStart(2, '0')}`;
  const dateLimite = dateLimitePaiement(moisPrecedent);
  const dateLimiteLisible = new Date(dateLimite + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const totauxParCentre = await all(
    `SELECT c.centre_id, ce.nom AS nom_centre, COALESCE(SUM(r.commission_montant), 0) AS montant
     FROM rdv r JOIN creneaux c ON c.id = r.creneau_id JOIN centres ce ON ce.id = c.centre_id
     WHERE r.statut = 'confirme' AND strftime('%Y-%m', r.created_at) = ?
     GROUP BY c.centre_id
     HAVING montant > 0`,
    [moisPrecedent]
  );

  let envoyes = 0;
  for (const t of totauxParCentre) {
    const controleurs = await all(
      `SELECT DISTINCT ctrl.nom, ctrl.email FROM controleurs ctrl
       JOIN controleur_centres cc ON cc.controleur_id = ctrl.id
       WHERE cc.centre_id = ?`,
      [t.centre_id]
    );
    for (const controleur of controleurs) {
      const { subject, html } = emailRappelCommissionMensuelle({
        nomControleur: controleur.nom,
        nomCentre: t.nom_centre,
        mois: new Date(moisPrecedent + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        montant: t.montant,
        dateLimite: dateLimiteLisible,
      });
      try {
        await envoyerEmail({ to: controleur.email, subject, html });
        envoyes += 1;
      } catch {
        // Une erreur d'envoi pour un centre ne doit jamais bloquer les autres.
      }
    }
  }

  return NextResponse.json({ centres_concernes: totauxParCentre.length, envoyes });
}
