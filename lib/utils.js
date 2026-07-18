import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

export function generateReference() {
  return `CT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export function jsonError(status, message) {
  return NextResponse.json({ erreur: message }, { status });
}

export function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
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
