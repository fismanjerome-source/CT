// app/api/cron/parrainage/route.js — à appeler une fois par jour par une
// tâche planifiée externe (ex: cron-job.org), avec ?cle=VOTRE_CRON_SECRET.
// Deux missions : accorder le Premium offert de 2 mois aux parrains dont le
// filleul a honoré son premier rendez-vous, et désactiver le Premium offert
// dont la période de 2 mois est arrivée à échéance.

import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/utils';
import { traiterRecompensesEnAttente, expirerPremiumOfferts } from '@/lib/parrainage';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cle = searchParams.get('cle');
  if (!process.env.CRON_SECRET || cle !== process.env.CRON_SECRET) {
    return jsonError(401, 'Clé secrète manquante ou incorrecte.');
  }

  const recompensesAccordees = await traiterRecompensesEnAttente();
  const premiumExpires = await expirerPremiumOfferts();

  return NextResponse.json({ recompenses_accordees: recompensesAccordees, premium_expires: premiumExpires });
}
