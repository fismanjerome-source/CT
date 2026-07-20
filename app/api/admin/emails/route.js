import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';
import {
  emailBienvenuePro, emailConfirmationReservation, emailRappelRendezVous,
  emailVerificationPassage, emailRdvNonHonore,
} from '@/lib/emails/templates';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const bienvenuePro = emailBienvenuePro({ nom: 'Karim Belhadj', nomCentre: 'Auto Sécurité Bastille' });
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
    ],
    emails_clients: [
      { cle: 'confirmation_reservation', titre: 'Confirmation de réservation', declencheur: 'Envoyé automatiquement dès qu\'un client confirme un créneau, avec un fichier .ics joint.', ...confirmation },
      { cle: 'rappel_rdv', titre: 'Rappel la veille du RDV', declencheur: "Envoyé automatiquement la veille du rendez-vous par la tâche planifiée quotidienne.", ...rappel },
      { cle: 'verification_passage', titre: 'Vérification post-RDV', declencheur: "Envoyé automatiquement le lendemain du RDV par la tâche planifiée quotidienne.", ...verification },
      { cle: 'rdv_non_honore', titre: 'Rendez-vous non honoré', declencheur: "Envoyé automatiquement, dans l'heure, dès qu'un centre signale un client absent depuis l'onglet « Client absent ».", ...nonHonore },
    ],
  });
}
