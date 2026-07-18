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

// Remise automatique selon la proximité du créneau, appliquée par le
// système à tous les créneaux (pas de saisie manuelle par le centre) :
// -25% dans les 7 prochains jours, -20% la semaine suivante, -15% au-delà.
export function calculerRemise(dateStr) {
  const aujourdHui = new Date(todayISO() + 'T00:00:00');
  const dateCreneau = new Date(dateStr + 'T00:00:00');
  const joursDiff = Math.round((dateCreneau - aujourdHui) / (1000 * 60 * 60 * 24));

  if (joursDiff < 0) return null; // créneau passé, ne devrait pas arriver
  if (joursDiff <= 6) return 25;
  if (joursDiff <= 13) return 20;
  return 15;
}

// Commission due par le centre à Créneau CT, calculée au moment de la
// réservation selon le délai entre la prise de RDV et la date du créneau :
// 30% si le RDV est dans les 7 jours, 25% entre 7 et 14 jours, 20% au-delà.
// Cette valeur est figée à la réservation (elle ne doit pas être recalculée
// après coup, contrairement à la remise ci-dessus).
export function calculerTauxCommission(dateCreneauStr) {
  const aujourdHui = new Date(todayISO() + 'T00:00:00');
  const dateCreneau = new Date(dateCreneauStr + 'T00:00:00');
  const joursDiff = Math.round((dateCreneau - aujourdHui) / (1000 * 60 * 60 * 24));

  if (joursDiff <= 7) return 30;
  if (joursDiff <= 14) return 25;
  return 20;
}
