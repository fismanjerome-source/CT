import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { jsonError } from '@/lib/utils';
import { envoyerEmail } from '@/lib/email';
import { emailChangementRdvCentre } from '@/lib/emails/templates';

export async function GET(request, { params }) {
  const { reference } = await params;
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || '';

  const rdv = await get(
    `SELECT r.*, c.date, c.heure, c.centre_id, ce.nom AS centre_nom, ce.adresse, ce.ville
     FROM rdv r JOIN creneaux c ON c.id = r.creneau_id JOIN centres ce ON ce.id = c.centre_id
     WHERE r.reference = ?`,
    [reference]
  );

  if (!rdv || rdv.client_email.toLowerCase() !== email.toLowerCase()) {
    return jsonError(404, 'Rendez-vous introuvable pour cette référence et cet email.');
  }

  return NextResponse.json({ rdv });
}

export async function DELETE(request, { params }) {
  const { reference } = await params;
  const { searchParams } = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const email = body.email || searchParams.get('email') || '';

  const rdv = await get(
    `SELECT r.*, c.date, c.heure, c.controleur_id
     FROM rdv r JOIN creneaux c ON c.id = r.creneau_id
     WHERE r.reference = ?`,
    [reference]
  );
  if (!rdv || rdv.client_email.toLowerCase() !== email.toLowerCase()) {
    return jsonError(404, 'Rendez-vous introuvable pour cette référence et cet email.');
  }

  await run(`UPDATE rdv SET statut = 'annule' WHERE id = ?`, [rdv.id]);
  await run(`UPDATE creneaux SET statut = 'disponible' WHERE id = ?`, [rdv.creneau_id]);

  const controleur = await get('SELECT nom, email FROM controleurs WHERE id = ?', [rdv.controleur_id]);
  if (controleur) {
    const ancienneDateLisible = new Date(rdv.date + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const { subject, html } = emailChangementRdvCentre({
      nomControleur: controleur.nom,
      type: 'annulation',
      clientNom: `${rdv.client_prenom || ''} ${rdv.client_nom}`.trim(),
      ancienneDateLisible, ancienneHeure: rdv.heure,
      reference,
    });
    envoyerEmail({ to: controleur.email, subject, html }).catch(() => {});
  }

  return NextResponse.json({ message: 'Rendez-vous annulé. Le créneau est de nouveau disponible.' });
}
