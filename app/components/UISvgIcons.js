// lib/UISvgIcons.js — jeu d'icônes cohérent (trait fin, style unique) pour
// remplacer les émojis dans les espaces pro et admin. Rendu identique sur
// toutes les plateformes, contrairement aux émojis natifs du système.

const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function IconTableauBord({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="3" y="3" width="7" height="9" rx="1.2" /><rect x="14" y="3" width="7" height="5" rx="1.2" />
      <rect x="14" y="12" width="7" height="9" rx="1.2" /><rect x="3" y="16" width="7" height="5" rx="1.2" />
    </svg>
  );
}
export function IconArgent({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="8.5" /><path d="M9.5 15c0 1 1 1.8 2.5 1.8s2.5-.7 2.5-1.7c0-2.4-5-1.2-5-3.6 0-1 1-1.7 2.5-1.7s2.5.7 2.5 1.7" />
      <line x1="12" y1="7.3" x2="12" y2="8.6" /><line x1="12" y1="16.8" x2="12" y2="18.1" />
    </svg>
  );
}
export function IconCarte({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="1.8" /><line x1="2.5" y1="9.5" x2="21.5" y2="9.5" /><line x1="6" y1="14.5" x2="10" y2="14.5" />
    </svg>
  );
}
export function IconEtiquette({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M11.5 3.5h5.7a1.3 1.3 0 0 1 1.3 1.3v5.7a1.3 1.3 0 0 1-.38.9l-8 8a1.3 1.3 0 0 1-1.84 0l-5.7-5.7a1.3 1.3 0 0 1 0-1.84l8-8a1.3 1.3 0 0 1 .92-.38Z" />
      <circle cx="15" cy="9" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function IconCalendrier({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" /><line x1="3" y1="9.5" x2="21" y2="9.5" />
      <line x1="8" y1="2.5" x2="8" y2="6.5" /><line x1="16" y1="2.5" x2="16" y2="6.5" />
    </svg>
  );
}
export function IconRecu({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M6 3h12v18l-2.5-1.6L13 21l-2.5-1.6L8 21l-2-18Z" /><line x1="8.5" y1="8" x2="15.5" y2="8" /><line x1="8.5" y1="12" x2="15.5" y2="12" />
    </svg>
  );
}
export function IconBatiment({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="4" y="3" width="10" height="18" rx="1" /><rect x="15" y="9" width="6" height="12" rx="1" />
      <line x1="7" y1="7" x2="7" y2="7.01" /><line x1="11" y1="7" x2="11" y2="7.01" />
      <line x1="7" y1="11" x2="7" y2="11.01" /><line x1="11" y1="11" x2="11" y2="11.01" />
      <line x1="7" y1="15" x2="7" y2="15.01" /><line x1="11" y1="15" x2="11" y2="15.01" />
    </svg>
  );
}
export function IconEnveloppe({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M3 6.5 12 13l9-6.5" />
    </svg>
  );
}
export function IconMessage({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M21 12a8 8 0 0 1-11.5 7.2L3 20l1-5.5A8 8 0 1 1 21 12Z" />
    </svg>
  );
}
export function IconCadenas({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
    </svg>
  );
}
export function IconOeil({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
export function IconVoiture({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M4 16V11l2-5h12l2 5v5" /><rect x="2.5" y="16" width="19" height="4" rx="1.3" />
      <circle cx="7" cy="18" r="1.1" fill="currentColor" stroke="none" /><circle cx="17" cy="18" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function IconInterdit({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="8.5" /><line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}
export function IconEngrenage({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.7 6.3l-1.55 1.55M7.85 16.15 6.3 17.7M17.7 17.7l-1.55-1.55M7.85 7.85 6.3 6.3" />
    </svg>
  );
}
export function IconGraphique({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <line x1="4" y1="20" x2="20" y2="20" /><rect x="5.5" y="13" width="3.2" height="7" />
      <rect x="10.4" y="8" width="3.2" height="12" /><rect x="15.3" y="4" width="3.2" height="16" />
    </svg>
  );
}
export function IconBalance({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <line x1="12" y1="3" x2="12" y2="21" /><line x1="6" y1="21" x2="18" y2="21" />
      <line x1="4" y1="7" x2="20" y2="7" />
      <path d="M4 7 1.5 12.5a2.7 2.7 0 0 0 5 0Z" /><path d="M20 7 17.5 12.5a2.7 2.7 0 0 0 5 0Z" />
      <circle cx="12" cy="4.5" r="1.4" />
    </svg>
  );
}
export function IconImage({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.8" />
      <path d="m21 16-5.5-5.5L4 21" />
    </svg>
  );
}
export function IconCoche({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.5 2.4 2.4 4.6-5.3" />
    </svg>
  );
}
export function IconCalendrierPlus({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" /><line x1="3" y1="9.5" x2="21" y2="9.5" />
      <line x1="8" y1="2.5" x2="8" y2="6.5" /><line x1="16" y1="2.5" x2="16" y2="6.5" />
      <line x1="12" y1="13" x2="12" y2="18" /><line x1="9.5" y1="15.5" x2="14.5" y2="15.5" />
    </svg>
  );
}
