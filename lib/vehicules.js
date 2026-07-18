// lib/vehicules.js — catégories de véhicules gérées par la plateforme.
//
// Un centre déclare les catégories qu'il accepte (ex: pas de moto, pas de
// GPL). Un créneau peut en plus être restreint à un sous-ensemble de ces
// catégories (ex: un batch de créneaux réservé aux motos). Stockage en
// base sous forme de chaîne séparée par des virgules (pas de type array
// natif pratique en SQLite/libSQL pour ce volume de données).

export const TYPES_VEHICULES = [
  { value: 'essence_diesel', label: 'Essence / Diesel', categorie: 'voiture', couleur: '#5B665F' },
  { value: 'gpl', label: 'GPL', categorie: 'voiture', couleur: '#2E6B8A' },
  { value: 'hybride', label: 'Hybride', categorie: 'voiture', couleur: '#3D6B52' },
  { value: 'electrique', label: 'Électrique', categorie: 'voiture', couleur: '#2E7D45' },
  { value: 'moto', label: 'Moto', categorie: 'moto', couleur: '#C8952A' },
];

export function libelleType(value) {
  return TYPES_VEHICULES.find((t) => t.value === value)?.label || value;
}

export function parseTypes(str) {
  if (!str) return [];
  return str.split(',').map((s) => s.trim()).filter(Boolean);
}

export function serializeTypes(arr) {
  if (!arr || arr.length === 0) return null;
  return arr.join(',');
}

// Un créneau est réservable pour un type de véhicule donné si :
// - le créneau n'a pas de restriction propre (types_vehicules vide → tous
//   les types acceptés par le centre conviennent), et le centre accepte ce type
// - ou le créneau a une restriction propre qui inclut ce type
export function creneauCompatible(typesCreneauStr, typesCentreStr, typeSouhaite) {
  const typesCentre = parseTypes(typesCentreStr);
  if (typesCentre.length > 0 && !typesCentre.includes(typeSouhaite)) return false;

  const typesCreneau = parseTypes(typesCreneauStr);
  if (typesCreneau.length === 0) return true; // pas de restriction propre au créneau
  return typesCreneau.includes(typeSouhaite);
}
