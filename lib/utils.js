import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

export function generateReference() {
  return `CT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export function jsonError(status, message) {
  return NextResponse.json({ erreur: message }, { status });
}

// Décalage horaire réel de Paris (en heures, +1 en hiver / +2 en été) pour
// un instant donné — calculé dynamiquement plutôt que codé en dur, pour que
// le passage à l'heure d'été/hiver soit toujours pris en compte correctement,
// indépendamment du fuseau horaire du serveur (Render tourne en UTC).
function decalageParisHeures(instant) {
  const formatteur = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris', hour: 'numeric', hour12: false, timeZoneName: 'shortOffset',
  });
  const partie = formatteur.formatToParts(instant).find((p) => p.type === 'timeZoneName')?.value || 'GMT+1';
  return parseInt(partie.replace('GMT', ''), 10) || 1;
}

// Date du jour au format YYYY-MM-DD, en heure de Paris (et non celle,
// potentiellement différente, du serveur qui exécute le code).
export function todayISO(offset = 0) {
  const maintenant = new Date();
  const decalage = decalageParisHeures(maintenant);
  const instantParis = new Date(maintenant.getTime() + decalage * 3600 * 1000);
  instantParis.setUTCDate(instantParis.getUTCDate() + offset);
  return instantParis.toISOString().slice(0, 10);
}

// Un créneau ne peut être réservé (ou proposé) que s'il reste au moins
// DELAI_MINIMUM_MINUTES avant son heure — le temps pour le client de s'y
// rendre et pour le centre de s'organiser. Évite qu'un client réserve à
// 15h00 un créneau à 15h30, ou pire, un créneau déjà passé dans la journée.
export const DELAI_MINIMUM_MINUTES = 90;

export function creneauSuffisammentEloigne(dateStr, heureStr) {
  const [annee, mois, jour] = dateStr.split('-').map(Number);
  const [h, m] = heureStr.split(':').map(Number);

  // Estimation initiale en UTC, puis correction avec le vrai décalage de
  // Paris à cet instant précis — fiable été comme hiver, quel que soit le
  // fuseau horaire du serveur qui exécute ce code.
  const estimation = new Date(Date.UTC(annee, mois - 1, jour, h, m));
  const decalage = decalageParisHeures(estimation);
  const debutCreneau = new Date(Date.UTC(annee, mois - 1, jour, h - decalage, m));

  const maintenant = new Date();
  const minutesRestantes = (debutCreneau - maintenant) / 60000;
  return minutesRestantes >= DELAI_MINIMUM_MINUTES;
}

// Distance à vol d'oiseau entre deux points GPS, en kilomètres
// (formule de Haversine — largement suffisante pour trier des centres
// par proximité, pas besoin d'un vrai calcul d'itinéraire routier).
export function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Commission due par le centre à Créneau CT, calculée au moment de la
// réservation selon le délai entre la prise de RDV et la date du créneau :
// 30% si le RDV est dans les 7 jours, 25% entre 7 et 14 jours, 20% au-delà.
// Cette valeur est figée à la réservation, et n'est JAMAIS montrée au client
// — c'est une information strictement interne entre le centre et Créneau CT.
export function calculerTauxCommission(dateCreneauStr) {
  const aujourdHui = new Date(todayISO() + 'T00:00:00');
  const dateCreneau = new Date(dateCreneauStr + 'T00:00:00');
  const joursDiff = Math.round((dateCreneau - aujourdHui) / (1000 * 60 * 60 * 24));

  if (joursDiff <= 7) return 30;
  if (joursDiff <= 14) return 25;
  return 20;
}
