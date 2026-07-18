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

export function MotoIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="2.5" />
      <circle cx="18.5" cy="17.5" r="2.5" />
      <path d="M5.5 17.5 9 10h4l2.5 3.5H18l1.5 4" />
      <path d="M9 10 8 7h3" />
    </svg>
  );
}
