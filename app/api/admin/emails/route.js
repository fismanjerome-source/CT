import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';
import { emailBienvenuePro, emailConfirmationReservation, emailRappelRendezVous } from '@/lib/emails/templates';

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

  return NextResponse.json({
    emails_professionnels: [
      { cle: 'bienvenue_pro', titre: 'Bienvenue (création de compte centre)', declencheur: "Envoyé automatiquement dès qu'un centre crée son compte.", ...bienvenuePro },
    ],
    emails_clients: [
      { cle: 'confirmation_reservation', titre: 'Confirmation de réservation', declencheur: 'Envoyé automatiquement dès qu\'un client confirme un créneau, avec un fichier .ics joint.', ...confirmation },
      { cle: 'rappel_rdv', titre: 'Rappel la veille du RDV', declencheur: "Envoyé automatiquement la veille du rendez-vous par la tâche planifiée quotidienne.", ...rappel },
    ],
  });
}
