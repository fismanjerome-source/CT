// lib/ics.js — génère un fichier .ics pour un rendez-vous, compatible avec
// Google Calendar, Outlook, Apple Calendar... Pas de dépendance : le format
// iCal est un simple texte structuré.

function formatDateICS(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Formate une date/heure locale (sans conversion UTC) pour DTSTART/DTEND —
// évite un décalage horaire dans l'agenda du client, le créneau étant déjà
// exprimé en heure française par le centre.
function formatDateLocaleICS(dateStr, heureStr) {
  return `${dateStr.replace(/-/g, '')}T${heureStr.replace(':', '')}00`;
}

// Génère un flux iCal complet (plusieurs événements), destiné à un
// abonnement d'agenda externe (Google Calendar, Outlook, logiciel de
// planning...) — contrairement à genererICSRendezVous, celui-ci renvoie le
// texte brut (pas du base64), pour être servi directement comme fichier.
export function genererFluxICS(nomCentre, listeRdv) {
  const maintenant = new Date();
  const lignes = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Créneau CT//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Créneau CT — ${nomCentre}`,
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
  ];

  for (const rdv of listeRdv) {
    const debutLocal = new Date(`${rdv.date}T${rdv.heure}:00`);
    const finLocal = new Date(debutLocal.getTime() + (rdv.duree_minutes || 30) * 60000);
    const finDateStr = finLocal.toISOString().slice(0, 10);
    const finHeureStr = `${String(finLocal.getHours()).padStart(2, '0')}:${String(finLocal.getMinutes()).padStart(2, '0')}`;

    lignes.push(
      'BEGIN:VEVENT',
      `UID:${rdv.reference}@creneauct.fr`,
      `DTSTAMP:${formatDateICS(maintenant)}`,
      `DTSTART;TZID=Europe/Paris:${formatDateLocaleICS(rdv.date, rdv.heure)}`,
      `DTEND;TZID=Europe/Paris:${formatDateLocaleICS(finDateStr, finHeureStr)}`,
      `SUMMARY:CT — ${rdv.client_prenom} ${rdv.client_nom} (${rdv.immatriculation})`,
      `DESCRIPTION:Client : ${rdv.client_prenom} ${rdv.client_nom}\\nTéléphone : ${rdv.client_telephone}\\nImmatriculation : ${rdv.immatriculation}\\nRéférence : ${rdv.reference}`,
      'END:VEVENT'
    );
  }

  lignes.push('END:VCALENDAR');
  return lignes.join('\r\n');
}

export function genererICSRendezVous({ titre, description, lieu, dateStr, heureStr, dureeMinutes = 30 }) {
  const debutLocal = new Date(`${dateStr}T${heureStr}:00`);
  const finLocal = new Date(debutLocal.getTime() + dureeMinutes * 60000);
  const finDateStr = finLocal.toISOString().slice(0, 10);
  const finHeureStr = `${String(finLocal.getHours()).padStart(2, '0')}:${String(finLocal.getMinutes()).padStart(2, '0')}`;
  const maintenant = new Date();

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Créneau CT//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@creneauct.fr`,
    `DTSTAMP:${formatDateICS(maintenant)}`,
    `DTSTART;TZID=Europe/Paris:${formatDateLocaleICS(dateStr, heureStr)}`,
    `DTEND;TZID=Europe/Paris:${formatDateLocaleICS(finDateStr, finHeureStr)}`,
    `SUMMARY:${titre}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${lieu}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Rappel contrôle technique',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return Buffer.from(ics).toString('base64');
}
