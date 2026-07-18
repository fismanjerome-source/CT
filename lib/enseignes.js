// lib/enseignes.js — codes couleur par enseigne, pour que le badge affiché
// à côté du nom d'un centre soit immédiatement reconnaissable.
//
// "degrade" (optionnel) permet un badge bicolore (ex: Ausecuritas, Autosécurité).

export const COULEURS_ENSEIGNES = {
  'Sécuritest': { fond: '#8FD19E', texte: '#1B4332' },
  'Mon Contrôle Technique': { fond: '#E4772E', texte: '#FFFFFF' },
  'Autovision': { fond: '#C0392B', texte: '#FFFFFF' },
  'Autosur': { fond: '#2E6B9E', texte: '#FFFFFF' },
  'Dekra': { fond: '#1E5631', texte: '#FFFFFF' },
  'Norisko': { fond: '#E8C547', texte: '#4A3B00' },
  'Autobilan': { fond: '#8A8F87', texte: '#FFFFFF' },
  'Ausecuritas': { degrade: 'linear-gradient(90deg, #FFFFFF 50%, #AEE1F5 50%)', texte: '#1B3A5C', bordure: '#AEE1F5' },
  'A3S': { degrade: 'linear-gradient(90deg, #FFFFFF 50%, #AEE1F5 50%)', texte: '#1B3A5C', bordure: '#AEE1F5' },
  'Autosécurité': { degrade: 'linear-gradient(90deg, #1B3A5C 50%, #E8C547 50%)', texte: '#FFFFFF' },
};

// Couleur pour les centres indépendants — volontairement différente de
// toutes les enseignes ci-dessus (violet, ne rentre en collision avec aucune).
export const COULEUR_INDEPENDANT = { fond: '#6B4C8A', texte: '#FFFFFF' };

// Couleur par défaut pour une enseigne non répertoriée dans la liste.
const COULEUR_DEFAUT = { fond: '#1B3A5C', texte: '#FFFFFF' };

export function couleurEnseigne(enseigne) {
  if (!enseigne) return COULEUR_INDEPENDANT;
  return COULEURS_ENSEIGNES[enseigne] || COULEUR_DEFAUT;
}
