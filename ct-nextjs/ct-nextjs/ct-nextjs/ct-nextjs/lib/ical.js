// lib/ical.js — récupère et analyse un flux iCal (.ics) public/privé d'un
// agenda externe (Google Calendar, Outlook, Apple Calendar...) pour en
// extraire les plages occupées. Analyseur volontairement minimal : gère les
// événements simples (DTSTART/DTEND en UTC ou horodatage local), pas les
// événements récurrents (RRULE) — suffisant pour bloquer les créneaux en
// conflit sans dépendance npm supplémentaire.

import { all, get, run } from './db';
import { todayISO } from './utils';

function parseICalDate(value) {
  // Formats courants : 20260720T100000Z (UTC) ou 20260720T100000 (local) ou 20260720 (jour entier)
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h = '00', mi = '00', s = '00', z] = m;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}${z ? 'Z' : ''}`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function deplierLignes(texte) {
  // Une ligne qui commence par un espace ou une tabulation est la suite de
  // la ligne précédente (repliement de ligne standard du format iCal).
  return texte.split(/\r\n|\n|\r/).reduce((lignes, ligne) => {
    if ((ligne.startsWith(' ') || ligne.startsWith('\t')) && lignes.length > 0) {
      lignes[lignes.length - 1] += ligne.slice(1);
    } else {
      lignes.push(ligne);
    }
    return lignes;
  }, []);
}

export function parserICal(texteIcal) {
  const lignes = deplierLignes(texteIcal);
  const evenements = [];
  let courant = null;

  for (const ligne of lignes) {
    if (ligne === 'BEGIN:VEVENT') {
      courant = {};
    } else if (ligne === 'END:VEVENT') {
      if (courant?.debut && courant?.fin) evenements.push(courant);
      courant = null;
    } else if (courant) {
      const [cle, ...reste] = ligne.split(':');
      const valeur = reste.join(':');
      if (cle.startsWith('DTSTART')) courant.debut = parseICalDate(valeur);
      else if (cle.startsWith('DTEND')) courant.fin = parseICalDate(valeur);
      else if (cle === 'SUMMARY') courant.titre = valeur;
    }
  }

  return evenements;
}

export async function recupererEvenementsAgenda(icalUrl) {
  const res = await fetch(icalUrl, { headers: { 'User-Agent': 'CreneauCT-Sync/1.0' } });
  if (!res.ok) throw new Error(`Impossible de récupérer l'agenda (HTTP ${res.status}).`);
  const texte = await res.text();
  return parserICal(texte);
}

// Synchronise l'agenda externe d'un centre : bloque les créneaux Créneau CT
// qui entrent en conflit avec un événement de son agenda. Utilisée à la
// fois par l'admin (pour n'importe quel centre) et par le centre lui-même
// (pour son propre agenda) — la logique métier est strictement identique.
export async function synchroniserAgendaCentre(centreId) {
  const centre = await get('SELECT * FROM centres WHERE id = ?', [centreId]);
  if (!centre) throw Object.assign(new Error('Centre introuvable.'), { statusCode: 404 });
  if (!centre.ical_url) throw Object.assign(new Error("Aucun lien d'agenda renseigné pour ce centre."), { statusCode: 400 });

  const evenements = await recupererEvenementsAgenda(centre.ical_url);

  // On ne regarde que les événements à venir dans les 60 prochains jours,
  // pour rester rapide et pertinent (pas la peine de scanner tout l'historique).
  const debutFenetre = new Date(todayISO() + 'T00:00:00');
  const finFenetre = new Date(todayISO(60) + 'T23:59:59');
  const evenementsPertinents = evenements.filter((e) => e.fin >= debutFenetre && e.debut <= finFenetre);

  const creneaux = await all(
    `SELECT id, date, heure, duree_minutes FROM creneaux
     WHERE centre_id = ? AND statut = 'disponible' AND date BETWEEN ? AND ?`,
    [centreId, todayISO(), todayISO(60)]
  );

  let bloques = 0;
  for (const c of creneaux) {
    const debutCreneau = new Date(`${c.date}T${c.heure}:00`);
    const finCreneau = new Date(debutCreneau.getTime() + (c.duree_minutes || 30) * 60000);

    const enConflit = evenementsPertinents.some((e) => debutCreneau < e.fin && finCreneau > e.debut);
    if (enConflit) {
      await run(`UPDATE creneaux SET statut = 'bloque' WHERE id = ?`, [c.id]);
      bloques += 1;
    }
  }

  return {
    message: `${bloques} créneau(x) bloqué(s) suite à ${evenementsPertinents.length} événement(s) trouvé(s) dans l'agenda externe.`,
    evenements_trouves: evenementsPertinents.length,
    creneaux_bloques: bloques,
  };
}
