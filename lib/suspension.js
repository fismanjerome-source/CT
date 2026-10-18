// Interrupteur d'urgence : les nouvelles réservations (et les déplacements de
// RDV) sont suspendues tant que RESERVATIONS_OUVERTES n'est pas "1" dans les
// variables d'environnement de l'hébergeur. Pour rouvrir : définir
// RESERVATIONS_OUVERTES=1 puis redéployer, ou retirer ce garde-fou.
export const RESERVATIONS_SUSPENDUES = process.env.RESERVATIONS_OUVERTES !== '1';

export const MESSAGE_SUSPENSION =
  "Les réservations sont temporairement suspendues. Merci de réessayer plus tard ou de contacter Créneau CT au 06 08 12 91 45.";
