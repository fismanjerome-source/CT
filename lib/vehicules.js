// lib/vehicules.js — catégories de véhicules gérées par la plateforme.
//
// Un centre déclare les catégories qu'il accepte (ex: pas de moto, pas de
// GPL). Un créneau peut en plus être restreint à un sous-ensemble de ces
// catégories (ex: un batch de créneaux réservé aux motos). Stockage en
// base sous forme de chaîne séparée par des virgules (pas de type array
// natif pratique en SQLite/libSQL pour ce volume de données).

export const TYPES_VEHICULES = [
  { value: 'essence', label: 'Essence', categorie: 'voiture', icone: 'pompe', couleur: '#E4572E' },
  { value: 'diesel', label: 'Diesel', categorie: 'voiture', icone: 'pompe', couleur: '#52616B' },
  { value: 'gpl', label: 'GPL', categorie: 'voiture', icone: 'gpl', couleur: '#2E86AB' },
  { value: 'hybride', label: 'Hybride', categorie: 'voiture', icone: 'hybride', couleur: '#6B8E23' },
  { value: 'electrique', label: 'Électrique', categorie: 'voiture', icone: 'electrique', couleur: '#0EA5E9' },
  { value: '4x4', label: '4x4 / SUV', categorie: 'voiture', icone: 'suv', couleur: '#7A5C3E' },
  { value: 'moto', label: 'Moto/scooter', categorie: 'moto', icone: 'moto', couleur: '#8E4162' },
  { value: 'sans_permis', label: 'Voiture sans permis', categorie: 'moto', icone: 'moto', couleur: '#B08968' },
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
