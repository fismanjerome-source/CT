import { NextResponse } from 'next/server';
import { db, get, ensureSchema } from '@/lib/db';
import { jsonError, creneauSuffisammentEloigne } from '@/lib/utils';
import { calculerTauxCommissionEffectif } from '@/lib/facturation';
import { envoyerEmail } from '@/lib/email';
import { emailConfirmationReservation, emailChangementRdvCentre, emailNouvelleReservationCentre } from '@/lib/emails/templates';
import { genererICSRendezVous } from '@/lib/ics';
import { envoyerNotificationTelegram } from '@/lib/telegram';
import { libelleType } from '@/lib/vehicules';

export async function PATCH(request, { params }) {
  const { reference } = await params;
  const body = await request.json().catch(() => ({}));
  const { email, nouveau_creneau_id } = body;

  if (!email || !nouveau_creneau_id) {
    return jsonError(400, 'Email et nouveau créneau requis.');
  }

  await ensureSchema();

  const rdv = await get(
    `SELECT r.*, c.centre_id AS ancien_centre_id, c.id AS ancien_creneau_id, c.date AS ancienne_date, c.heure AS ancienne_heure, c.controleur_id AS ancien_controleur_id
     FROM rdv r JOIN creneaux c ON c.id = r.creneau_id
     WHERE r.reference = ?`,
    [reference]
  );
  if (!rdv || rdv.client_email.toLowerCase() !== email.toLowerCase()) {
    return jsonError(404, 'Rendez-vous introuvable pour cette référence et cet email.');
  }
  if (rdv.statut !== 'confirme') {
    return jsonError(409, 'Ce rendez-vous ne peut plus être modifié (déjà annulé).');
  }

  const nouveauCreneau = await get('SELECT * FROM creneaux WHERE id = ?', [nouveau_creneau_id]);
  if (!nouveauCreneau) return jsonError(404, 'Nouveau créneau introuvable.');
  const changeDeCentre = nouveauCreneau.centre_id !== rdv.ancien_centre_id;
  if (nouveauCreneau.statut !== 'disponible') {
    return jsonError(409, "Ce créneau vient d'être réservé par quelqu'un d'autre. Choisissez-en un autre.");
  }
  if (!creneauSuffisammentEloigne(nouveauCreneau.date, nouveauCreneau.heure)) {
    return jsonError(409, "Ce créneau est trop proche dans le temps (minimum 1h30 à l'avance). Choisissez un créneau plus tard.");
  }

  const prixInitial = nouveauCreneau.prix || null;
  const prixPaye = prixInitial != null && nouveauCreneau.promo_pourcentage
    ? Math.round(prixInitial * (1 - nouveauCreneau.promo_pourcentage / 100) * 100) / 100
    : prixInitial;
  const commissionPourcentage = await calculerTauxCommissionEffectif(nouveauCreneau.centre_id, nouveauCreneau.date);
  const commissionMontant = prixPaye != null ? Math.round(prixPaye * commissionPourcentage) / 100 : null;

  const tx = await db.transaction('write');
  try {
    await tx.execute({ sql: `UPDATE creneaux SET statut = 'disponible' WHERE id = ?`, args: [rdv.ancien_creneau_id] });

    const updateNouveau = await tx.execute({
      sql: `UPDATE creneaux SET statut = 'reserve' WHERE id = ? AND statut = 'disponible'`,
      args: [nouveau_creneau_id],
    });
    if (updateNouveau.rowsAffected === 0) {
      await tx.rollback();
      return jsonError(409, "Ce créneau vient d'être réservé par quelqu'un d'autre. Choisissez-en un autre.");
    }

    await tx.execute({
      sql: `UPDATE rdv SET creneau_id = ?, prix = ?, commission_pourcentage = ?, commission_montant = ?, rappel_envoye = 0 WHERE id = ?`,
      args: [nouveau_creneau_id, prixPaye, commissionPourcentage, commissionMontant, rdv.id],
    });

    await tx.commit();
  } catch (e) {
    await tx.rollback();
    return jsonError(500, 'Erreur lors de la modification du rendez-vous.');
  }

  const centre = await get('SELECT nom, adresse, ville FROM centres WHERE id = ?', [nouveauCreneau.centre_id]);
  const dateLisible = new Date(nouveauCreneau.date + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const adresseComplete = `${centre.adresse}, ${centre.ville}`;

  const { subject, html } = emailConfirmationReservation({
    clientNom: `${rdv.client_prenom || ''} ${rdv.client_nom}`.trim(), centreNom: centre.nom, adresse: adresseComplete,
    dateLisible, heure: nouveauCreneau.heure, reference,
    typeVehiculeLabel: rdv.type_vehicule ? libelleType(rdv.type_vehicule) : null,
  });
  const icsBase64 = genererICSRendezVous({
    titre: `Contrôle technique — ${centre.nom}`,
    description: `Rendez-vous de contrôle technique chez ${centre.nom} (modifié). Référence : ${reference}.`,
    lieu: adresseComplete,
    dateStr: nouveauCreneau.date,
    heureStr: nouveauCreneau.heure,
    dureeMinutes: nouveauCreneau.duree_minutes || 30,
  });
  envoyerEmail({
    to: rdv.client_email,
    subject: `Votre RDV a été modifié — ${reference}`,
    html,
    attachments: [{ filename: 'rendez-vous-controle-technique.ics', content: icsBase64 }],
  }).catch(() => {});

  const controleur = await get('SELECT nom, email FROM controleurs WHERE id = ?', [nouveauCreneau.controleur_id]);
  const ancienneDateLisible = new Date(rdv.ancienne_date + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  if (changeDeCentre) {
    // Le centre d'origine perd ce rendez-vous : on le prévient comme pour une annulation.
    const ancienControleur = await get('SELECT nom, email FROM controleurs WHERE id = ?', [rdv.ancien_controleur_id]);
    if (ancienControleur) {
      const { subject: subjectAncien, html: htmlAncien } = emailChangementRdvCentre({
        nomControleur: ancienControleur.nom,
        type: 'annulation',
        clientNom: `${rdv.client_prenom || ''} ${rdv.client_nom}`.trim(),
        ancienneDateLisible, ancienneHeure: rdv.ancienne_heure,
        reference,
      });
      envoyerEmail({ to: ancienControleur.email, subject: subjectAncien, html: htmlAncien }).catch(() => {});
    }
    // Le nouveau centre découvre ce client : on le prévient comme pour une nouvelle réservation.
    if (controleur) {
      const { subject: subjectNouveau, html: htmlNouveau } = emailNouvelleReservationCentre({
        nomControleur: controleur.nom,
        clientNom: `${rdv.client_prenom || ''} ${rdv.client_nom}`.trim(),
        clientTelephone: rdv.client_telephone,
        clientEmail: rdv.client_email,
        dateLisible, heure: nouveauCreneau.heure,
        typeVehiculeLabel: rdv.type_vehicule ? libelleType(rdv.type_vehicule) : null,
        immatriculation: rdv.immatriculation,
        reference,
        prixPaye,
      });
      envoyerEmail({ to: controleur.email, subject: subjectNouveau, html: htmlNouveau }).catch(() => {});
    }
  } else if (controleur) {
    const { subject: subjectCentre, html: htmlCentre } = emailChangementRdvCentre({
      nomControleur: controleur.nom,
      type: 'modification',
      clientNom: `${rdv.client_prenom || ''} ${rdv.client_nom}`.trim(),
      dateLisible, heure: nouveauCreneau.heure,
      ancienneDateLisible, ancienneHeure: rdv.ancienne_heure,
      reference,
    });
    envoyerEmail({ to: controleur.email, subject: subjectCentre, html: htmlCentre }).catch(() => {});
  }

  envoyerNotificationTelegram(
    `🔄 <b>RDV modifié par le client</b>\nCentre : ${centre.nom}\nNouvelle date : ${nouveauCreneau.date} à ${nouveauCreneau.heure}\n🚗 Véhicule : ${rdv.type_vehicule ? libelleType(rdv.type_vehicule) : 'non renseigné'}\nRéférence : ${reference}\n💰 Commission Créneau CT : ${commissionMontant != null ? `${commissionMontant.toFixed(2)} € (${commissionPourcentage}%)` : 'non calculable'}`
  ).catch(() => {});

  return NextResponse.json({
    rdv: { reference, date: nouveauCreneau.date, heure: nouveauCreneau.heure, centre },
  });
}
