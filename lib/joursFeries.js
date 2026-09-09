// Calcul pur des jours fériés légaux français — aucune dépendance à la base
// de données (voir lib/pro.js pour la vérification liée à un centre).

function pad2(n) {
  return String(n).padStart(2, '0');
}

function dateISO(annee, mois, jour) {
  return `${annee}-${pad2(mois)}-${pad2(jour)}`;
}

// Algorithme de Gauss/Meeus (calendrier grégorien) : renvoie le dimanche de
// Pâques pour une année donnée.
function dimanchePaques(annee) {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(annee, mois - 1, jour));
}

function ajouterJours(date, jours) {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + jours);
  return d;
}

function versISO(date) {
  return dateISO(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

// 11 jours fériés légaux français pour une année donnée, triés par date.
export function joursFeriesFrance(annee) {
  const paques = dimanchePaques(annee);
  const fixes = [
    { date: dateISO(annee, 1, 1), nom: 'Jour de l’An' },
    { date: dateISO(annee, 5, 1), nom: 'Fête du Travail' },
    { date: dateISO(annee, 5, 8), nom: 'Victoire 1945' },
    { date: dateISO(annee, 7, 14), nom: 'Fête Nationale' },
    { date: dateISO(annee, 8, 15), nom: 'Assomption' },
    { date: dateISO(annee, 11, 1), nom: 'Toussaint' },
    { date: dateISO(annee, 11, 11), nom: 'Armistice' },
    { date: dateISO(annee, 12, 25), nom: 'Noël' },
  ];
  const mobiles = [
    { date: versISO(ajouterJours(paques, 1)), nom: 'Lundi de Pâques' },
    { date: versISO(ajouterJours(paques, 39)), nom: 'Ascension' },
    { date: versISO(ajouterJours(paques, 50)), nom: 'Lundi de Pentecôte' },
  ];
  return [...fixes, ...mobiles].sort((a, b) => (a.date < b.date ? -1 : 1));
}

// Fenêtre utilisée par la migration de rattrapage : ~13 mois, largement
// suffisant pour couvrir les créneaux qu'un centre a déjà pu ouvrir à
// l'avance (en pratique jamais plusieurs années d'un coup).
export const FENETRE_JOURS = 400;

// Fenêtre utilisée par la liste affichée dans l'onglet "Jours fériés" :
// jusqu'au 31 décembre de (année en cours + nbAnnees), plutôt qu'un compte
// de jours glissant qui coupait la liste en plein milieu de l'année
// suivante (ex : elle s'arrêtait au 15 août, juste avant Toussaint/
// Armistice/Noël de cette même année à venir).
export function finAnneesAVenir(nbAnnees = 2) {
  const annee = new Date().getUTCFullYear() + nbAnnees;
  return `${annee}-12-31`;
}

// Liste des jours fériés dans une période [debutISO, finISO] (bornes
// incluses), en gérant les plages à cheval sur plusieurs années civiles.
export function listeJoursFeriesPeriode(debutISO, finISO) {
  const anneeDebut = Number(debutISO.slice(0, 4));
  const anneeFin = Number(finISO.slice(0, 4));
  const resultat = [];
  for (let annee = anneeDebut; annee <= anneeFin; annee += 1) {
    for (const j of joursFeriesFrance(annee)) {
      if (j.date >= debutISO && j.date <= finISO) resultat.push(j);
    }
  }
  return resultat.sort((a, b) => (a.date < b.date ? -1 : 1));
}
