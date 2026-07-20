import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { get, run } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

function genererMotDePasseTemporaire() {
  // Lisible à l'oral pour être communiqué facilement par téléphone.
  const mots = ['ROUTE', 'FREIN', 'PHARE', 'MOTEUR', 'VIRAGE', 'PNEU', 'CEINTURE', 'CAPOT'];
  const mot = mots[crypto.randomInt(mots.length)];
  const chiffres = crypto.randomInt(1000, 9999);
  return `${mot}${chiffres}!`;
}

export async function POST(request, { params }) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const { id } = await params;
  const controleur = await get('SELECT id, nom, email FROM controleurs WHERE id = ?', [id]);
  if (!controleur) return jsonError(404, 'Compte introuvable.');

  const nouveauMotDePasse = genererMotDePasseTemporaire();
  await run('UPDATE controleurs SET password_hash = ? WHERE id = ?', [
    hashPassword(nouveauMotDePasse),
    id,
  ]);

  // Si des demandes de réinitialisation étaient en attente pour cet email, on les clôt.
  await run(
    `UPDATE contacts SET statut = 'traite' WHERE email = ? AND type = 'reinitialisation_mdp' AND statut = 'nouveau'`,
    [controleur.email]
  );

  return NextResponse.json({
    message: `Nouveau mot de passe généré pour ${controleur.nom}.`,
    nouveau_mot_de_passe: nouveauMotDePasse,
    email: controleur.email,
  });
}
