import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resoudreCentreActif } from '@/lib/pro';
import { jsonError, todayISO } from '@/lib/utils';
import { commissionMoisEnCours } from '@/lib/facturation';
import { envoyerEmail } from '@/lib/email';
import { emailPremiumArrete } from '@/lib/emails/templates';

export async function POST(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const { searchParams } = new URL(request.url);
  const centreId = await resoudreCentreActif(session.controleurId, searchParams.get('centre'));
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  const centre = await get('SELECT nom, est_premium FROM centres WHERE id = ?', [centreId]);
  if (!centre) return jsonError(404, 'Centre introuvable.');
  if (!centre.est_premium) return jsonError(400, "Ce centre n'est pas en statut Premium.");

  const maintenant = new Date().toISOString();
  await run('UPDATE centres SET est_premium = 0, premium_desactive_le = ? WHERE id = ?', [maintenant, centreId]);

  const controleur = await get('SELECT nom, email FROM controleurs WHERE id = ?', [session.controleurId]);
  const moisEnCours = await commissionMoisEnCours(centreId);
  const moisLisible = new Date(todayISO() + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const joursActifs = Number(todayISO().slice(8, 10));

  const { subject, html } = emailPremiumArrete({
    nomControleur: controleur.nom, nomCentre: centre.nom,
    montantProrata: moisEnCours.montant_premium, joursActifs, moisLisible,
  });
  envoyerEmail({ to: controleur.email, subject, html }).catch(() => {});

  return NextResponse.json({ message: 'Statut Premium arrêté.' });
}
