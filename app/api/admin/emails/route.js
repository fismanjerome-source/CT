import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';
import {
  emailBienvenuePro, emailDetailsEspacePro, emailConfirmationReservation, emailRappelRendezVous,
  emailVerificationPassage, emailRdvNonHonore, emailNouvelleReservationCentre,
  emailChangementRdvCentre, emailMotDePasseModifie, emailRappelCommissionMensuelle,
} from '@/lib/emails/templates';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const bienvenuePro = emailBienvenuePro({ nom: 'Karim Belhadj', nomCentre: 'Auto Sécurité Bastille' });
  const detailsPro = emailDetailsEspacePro({ nom: 'Karim Belhadj', nomCentre: 'Auto Sécurité Bastille' });
  const nouvelleReservationCentre = emailNouvelleReservationCentre({
    nomControleur: 'Karim Belhadj', clientNom: 'Jean Dupont', clientTelephone: '06 12 34 56 78',
    clientEmail: 'jean.dupont@exemple.fr', dateLisible: 'lundi 3 août 2026', heure: '14:30',
    typeVehiculeLabel: 'Voiture — Essence', immatriculation: 'AB-123-CD', reference: 'CT-A1B2C3', prixPaye: 78,
  });
  const annulationCentre = emailChangementRdvCentre({
    nomControleur: 'Karim Belhadj', type: 'annulation', clientNom: 'Jean Dupont',
    ancienneDateLisible: 'lundi 3 août 2026', ancienneHeure: '14:30', reference: 'CT-A1B2C3',
  });
  const modificationCentre = emailChangementRdvCentre({
    nomControleur: 'Karim Belhadj', type: 'modification', clientNom: 'Jean Dupont',
    dateLisible: 'mercredi 5 août 2026', heure: '09:00',
    ancienneDateLisible: 'lundi 3 août 2026', ancienneHeure: '14:30', reference: 'CT-A1B2C3',
  });
  const motDePasseModifie = emailMotDePasseModifie({ nom: 'Karim Belhadj' });
  const rappelCommission = emailRappelCommissionMensuelle({
    nomControleur: 'Karim Belhadj', nomCentre: 'Auto Sécurité Bastille', mois: 'juillet 2026',
    montant: 342.60, dateLimite: '10 août 2026',
  });
  const confirmation = emailConfirmationReservation({
    clientNom: 'Jean Dupont',
    centreNom: 'Auto Sécurité Bastille',
    adresse: '12 rue de Charonne, Paris',
    dateLisible: 'lundi 3 août 2026',
    heure: '14:30',
    reference: 'CT-A1B2C3',
  });
  const rappel = emailRappelRendezVous({
    clientNom: 'Jean Dupont',
    centreNom: 'Auto Sécurité Bastille',
    adresse: '12 rue de Charonne, Paris',
    heure: '14:30',
  });
  const verification = emailVerificationPassage({
    clientNom: 'Jean Dupont',
    centreNom: 'Auto Sécurité Bastille',
    dateLisible: 'lundi 3 août 2026',
  });
  const nonHonore = emailRdvNonHonore({
    clientNom: 'Jean Dupont',
    centreNom: 'Auto Sécurité Bastille',
    dateLisible: 'lundi 3 août 2026',
    heure: '14:30',
  });

  return NextResponse.json({
    emails_professionnels: [
      { cle: 'bienvenue_pro', titre: 'Bienvenue (création de compte centre)', declencheur: "Envoyé automatiquement dès qu'un centre crée son compte.", ...bienvenuePro },
      { cle: 'details_espace_pro', titre: 'Présentation détaillée de l\'espace pro', declencheur: "Envoyé automatiquement 1h après la création du compte, par la tâche planifiée « email-details-pro ».", ...detailsPro },
      { cle: 'nouvelle_reservation_centre', titre: 'Nouvelle réservation (destiné au centre)', declencheur: "Envoyé automatiquement au centre dès qu'un client réserve un créneau chez lui.", ...nouvelleReservationCentre },
      { cle: 'annulation_centre', titre: 'Annulation par le client (destiné au centre)', declencheur: "Envoyé automatiquement au centre dès qu'un client annule son rendez-vous.", ...annulationCentre },
      { cle: 'modification_centre', titre: 'Modification par le client (destiné au centre)', declencheur: "Envoyé automatiquement au centre dès qu'un client déplace son rendez-vous.", ...modificationCentre },
      { cle: 'mot_de_passe_modifie', titre: 'Mot de passe modifié', declencheur: "Envoyé automatiquement (centre ou admin) dès qu'un mot de passe est changé.", ...motDePasseModifie },
      { cle: 'rappel_commission', titre: 'Rappel de commission mensuelle', declencheur: "Envoyé automatiquement le 1er de chaque mois, uniquement si une commission est due, par la tâche planifiée « rappel-commission ».", ...rappelCommission },
    ],
    emails_clients: [
      { cle: 'confirmation_reservation', titre: 'Confirmation de réservation', declencheur: 'Envoyé automatiquement dès qu\'un client confirme un créneau, avec un fichier .ics joint.', ...confirmation },
      { cle: 'rappel_rdv', titre: 'Rappel la veille du RDV', declencheur: "Envoyé automatiquement la veille du rendez-vous par la tâche planifiée quotidienne.", ...rappel },
      { cle: 'verification_passage', titre: 'Vérification post-RDV', declencheur: "Envoyé automatiquement le lendemain du RDV par la tâche planifiée quotidienne.", ...verification },
      { cle: 'rdv_non_honore', titre: 'Rendez-vous non honoré', declencheur: "Envoyé automatiquement, dans l'heure, dès qu'un centre signale un client absent depuis l'onglet « Client absent ».", ...nonHonore },
    ],
  });
}
