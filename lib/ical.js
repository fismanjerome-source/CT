// lib/ical.js — récupère et analyse un flux iCal (.ics) public/privé d'un
// agenda externe (Google Calendar, Outlook, Apple Calendar...) pour en
// extraire les plages occupées. Analyseur volontairement minimal : gère les
// événements simples (DTSTART/DTEND en UTC ou horodatage local), pas les
// événements récurrents (RRULE) — suffisant pour bloquer les créneaux en
// conflit sans dépendance npm supplémentaire.

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
