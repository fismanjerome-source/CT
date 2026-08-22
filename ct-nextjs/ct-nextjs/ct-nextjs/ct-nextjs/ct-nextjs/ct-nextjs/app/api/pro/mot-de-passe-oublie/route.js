import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { jsonError } from '@/lib/utils';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { email } = body;

  if (!email) return jsonError(400, 'Email requis.');

  const controleur = await get('SELECT nom, centre_id FROM controleurs WHERE email = ?', [email.toLowerCase()]);
  const nomCentre = controleur
    ? (await get('SELECT nom FROM centres WHERE id = ?', [controleur.centre_id]))?.nom
    : null;

  // On enregistre la demande même si l'email n'existe pas, sans le
  // révéler dans la réponse (bonne pratique de sécurité).
  await run(
    `INSERT INTO contacts (nom, email, nom_centre, message, type, statut, created_at)
     VALUES (?, ?, ?, ?, 'reinitialisation_mdp', 'nouveau', ?)`,
    [
      controleur?.nom || 'Compte introuvable',
      email.toLowerCase(),
      nomCentre || null,
      'Demande de réinitialisation de mot de passe.',
      new Date().toISOString(),
    ]
  );

  return NextResponse.json({
    message: "Votre demande a été transmise. Nous vous recontactons rapidement pour vous communiquer un nouveau mot de passe.",
  });
}
