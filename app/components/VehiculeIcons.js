// Icônes SVG dédiées à chaque catégorie de véhicule/carburant — volontairement
// distinctes les unes des autres (pas de simple recoloriage d'une même
// icône) pour qu'on comprenne au premier coup d'œil de quoi il s'agit.

export function PompeIcon({ size = 16, color = 'currentColor' }) {
  // Essence / Diesel — pompe à carburant
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="9" height="18" rx="1.5" />
      <line x1="4" y1="9" x2="13" y2="9" />
      <path d="M13 8h3.5a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 0 3 0v-6l-2.5-2.5" />
      <line x1="7" y1="13" x2="10" y2="13" />
    </svg>
  );
}

export function GplIcon({ size = 16, color = 'currentColor' }) {
  // GPL — bonbonne de gaz
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3h4v2.5c1.8.9 3 2.8 3 4.9V19a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-8.6c0-2.1 1.2-4 3-4.9V3Z" />
      <line x1="9.5" y1="8" x2="14.5" y2="8" />
      <line x1="10" y1="1.5" x2="10" y2="3" />
      <line x1="14" y1="1.5" x2="14" y2="3" />
    </svg>
  );
}

export function HybrideIcon({ size = 16, color = 'currentColor' }) {
  // Hybride — feuille (double motorisation / éco)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19c0-7.7 6.3-14 14-14 0 7.7-6.3 14-14 14Z" />
      <path d="M5 19c3-3 6-6 11.5-11.5" />
    </svg>
  );
}

export function ElectriqueIcon({ size = 16, color = 'currentColor' }) {
  // Électrique — éclair
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

export function MotoIcon({ size = 16, color = 'currentColor' }) {
  // Moto — vraie silhouette (roues, cadre, selle, guidon)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="M5 17h2.5l3-6h4l2 3h2.5" />
      <path d="M10.5 11 12 7.5h3" />
      <path d="M7.5 11h6.5" />
      <path d="M16.5 14 15 9.5" />
    </svg>
  );
}

export function SuvIcon({ size = 16, color = 'currentColor' }) {
  // 4x4 / SUV — carrosserie surélevée avec barres de toit
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 14 4 7.5A2 2 0 0 1 6 6h12a2 2 0 0 1 2 1.7L21 14" />
      <rect x="2" y="14" width="20" height="5.5" rx="1.5" />
      <circle cx="7" cy="20" r="1.7" />
      <circle cx="17" cy="20" r="1.7" />
      <line x1="6" y1="4.5" x2="18" y2="4.5" />
      <line x1="6" y1="4.5" x2="6" y2="6" />
      <line x1="18" y1="4.5" x2="18" y2="6" />
    </svg>
  );
}

export function CamionIcon({ size = 16, color = 'currentColor' }) {
  // Camion / poids lourd — cabine + benne, roues doubles à l'arrière
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8.5h11v8H2z" />
      <path d="M13 11h4l3 2.5v3H13z" />
      <circle cx="6" cy="18" r="1.8" />
      <circle cx="17.5" cy="18" r="1.8" />
      <line x1="16" y1="13.5" x2="16" y2="16.5" />
    </svg>
  );
}

export function AutocarIcon({ size = 16, color = 'currentColor' }) {
  // Autocar / autobus — carrosserie longue avec fenêtres en bande
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="12" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6.5" y1="7.3" x2="6.5" y2="9.7" />
      <line x1="11" y1="7.3" x2="11" y2="9.7" />
      <line x1="15.5" y1="7.3" x2="15.5" y2="9.7" />
      <circle cx="6.5" cy="19" r="1.6" />
      <circle cx="17.5" cy="19" r="1.6" />
    </svg>
  );
}

// Icône voiture générique, conservée pour d'éventuels usages neutres
// (n'est plus utilisée pour représenter un carburant précis).
export function CarIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13 4.5 7.5A2 2 0 0 1 6.4 6h11.2a2 2 0 0 1 1.9 1.5L21 13" />
      <rect x="2.5" y="13" width="19" height="6" rx="1.5" />
      <circle cx="7" cy="19.5" r="1.5" />
      <circle cx="17" cy="19.5" r="1.5" />
    </svg>
  );
}

const ICONES = {
  pompe: PompeIcon,
  gpl: GplIcon,
  hybride: HybrideIcon,
  electrique: ElectriqueIcon,
  suv: SuvIcon,
  moto: MotoIcon,
  camion: CamionIcon,
  autocar: AutocarIcon,
};

// Renvoie le bon composant d'icône pour une catégorie de véhicule donnée
// (utiliser avec l'objet de lib/vehicules.js : IconePourType(type.icone)).
export function IconeVehicule({ icone, size = 16, color = 'currentColor' }) {
  const Composant = ICONES[icone] || CarIcon;
  return <Composant size={size} color={color} />;
}
