import { NextResponse } from 'next/server';
import { db, get, ensureSchema } from '@/lib/db';
import { generateReference, jsonError } from '@/lib/utils';
import { calculerTauxCommissionEffectif } from '@/lib/facturation';
import { envoyerEmail } from '@/lib/email';
import { emailConfirmationReservation } from '@/lib/emails/templates';
import { genererICSRendezVous } from '@/lib/ics';
import { envoyerNotificationTelegram } from '@/lib/telegram';
import { libelleType } from '@/lib/vehicules';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { creneau_id, client_prenom, client_nom, client_email, client_telephone, immatriculation, type_vehicule } = body;

  if (!creneau_id || !client_prenom || !client_nom || !client_email || !client_telephone || !immatriculation) {
    return jsonError(400, 'Champs requis manquants (prénom, nom, email, téléphone, immatriculation).');
  }

  await ensureSchema();

  const creneau = await get('SELECT * FROM creneaux WHERE id = ?', [creneau_id]);
  if (!creneau) return jsonError(404, 'Créneau introuvable.');

  const reference = generateReference();
  const now = new Date().toISOString();

  // La commission est figée au moment de la réservation, et calculée sur le
  // prix EFFECTIVEMENT payé par le client (donc après l'éventuelle remise
  // choisie par le centre) — pas sur le prix initial. Exemple : CT à 100€,
  // remise de 30% par le centre → client paie 70€ → commission = 30% de 70€.
  // Cette information n'est jamais renvoyée au client, uniquement stockée
  // pour la consultation par le centre et par l'admin.
  const prixInitial = creneau.prix || null;
  const prixPaye = prixInitial != null && creneau.promo_pourcentage
    ? Math.round(prixInitial * (1 - creneau.promo_pourcentage / 100) * 100) / 100
    : prixInitial;
  const commissionPourcentage = await calculerTauxCommissionEffectif(creneau.centre_id, creneau.date);
  const commissionMontant = prixPaye != null ? Math.round(prixPaye * commissionPourcentage) / 100 : null;

  const tx = await db.transaction('write');
  try {
    const updateResult = await tx.execute({
      sql: `UPDATE creneaux SET statut = 'reserve' WHERE id = ? AND statut = 'disponible'`,
      args: [creneau_id],
    });
    if (updateResult.rowsAffected === 0) {
      await tx.rollback();
      return jsonError(409, "Ce créneau vient d'être réservé par quelqu'un d'autre. Merci d'en choisir un autre.");
    }
    await tx.execute({
      sql: `INSERT INTO rdv (creneau_id, client_prenom, client_nom, client_email, client_telephone, immatriculation, type_vehicule, reference, statut, prix, commission_pourcentage, commission_montant, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirme', ?, ?, ?, ?)`,
      args: [creneau_id, client_prenom, client_nom, client_email, client_telephone, immatriculation.toUpperCase(), type_vehicule || null, reference, prixPaye, commissionPourcentage, commissionMontant, now],
    });
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    return jsonError(500, 'Erreur lors de la réservation.');
  }

  const nomComplet = `${client_prenom} ${client_nom}`;
  const centre = await get('SELECT nom, adresse, ville FROM centres WHERE id = ?', [creneau.centre_id]);

  const dateLisible = new Date(creneau.date + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const adresseComplete = `${centre.adresse}, ${centre.ville}`;

  const { subject, html } = emailConfirmationReservation({
    clientNom: nomComplet, centreNom: centre.nom, adresse: adresseComplete,
    dateLisible, heure: creneau.heure, reference,
    typeVehiculeLabel: type_vehicule ? libelleType(type_vehicule) : null,
  });
  const icsBase64 = genererICSRendezVous({
    titre: `Contrôle technique — ${centre.nom}`,
    description: `Rendez-vous de contrôle technique chez ${centre.nom}. Référence : ${reference}. Pensez à votre carte grise et à arriver 10 minutes en avance.`,
    lieu: adresseComplete,
    dateStr: creneau.date,
    heureStr: creneau.heure,
    dureeMinutes: creneau.duree_minutes || 30,
  });
  envoyerEmail({
    to: client_email,
    subject,
    html,
    attachments: [{ filename: 'rendez-vous-controle-technique.ics', content: icsBase64 }],
  }).catch(() => {});
  envoyerNotificationTelegram(
    `📅 <b>Nouvelle réservation client</b>\nCentre : ${centre.nom}\nDate : ${creneau.date} à ${creneau.heure}\nClient : ${nomComplet}\n🚗 Véhicule : ${type_vehicule ? libelleType(type_vehicule) : 'non renseigné'}\nRéférence : ${reference}\nPrix payé : ${prixPaye != null ? `${prixPaye.toFixed(2)} €` : 'non renseigné'}\n💰 Commission Créneau CT : ${commissionMontant != null ? `${commissionMontant.toFixed(2)} € (${commissionPourcentage}%)` : 'non calculable'}`
  ).catch(() => {});

  return NextResponse.json(
    { rdv: { reference, date: creneau.date, heure: creneau.heure, centre } },
    { status: 201 }
  );
}
