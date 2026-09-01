// lib/site.js — un seul code, un seul déploiement, deux domaines publics :
// creneauct.fr (véhicules légers) et pl.creneauct.fr (poids lourds). Le
// choix se fait uniquement sur l'en-tête Host, déjà présent sur chaque
// requête HTTP — pas de configuration ni de table supplémentaire.
export function detecterSite(host) {
  return host?.startsWith('pl.') ? 'pl' : 'vl';
}
