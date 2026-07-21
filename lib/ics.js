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
