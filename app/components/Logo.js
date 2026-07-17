export default function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" role="img" aria-label="Créneau CT" style={{ flexShrink: 0 }}>
      <circle cx="80" cy="80" r="76" fill="#1B3A5C" />
      <circle cx="80" cy="80" r="76" fill="none" stroke="#C8952A" strokeWidth="3" />

      <g stroke="#C8952A" strokeWidth="3.5" strokeLinecap="round">
        <line x1="80" y1="6" x2="80" y2="16" />
        <line x1="80" y1="144" x2="80" y2="154" />
        <line x1="6" y1="80" x2="16" y2="80" />
        <line x1="144" y1="80" x2="154" y2="80" />
        <line x1="27" y1="27" x2="34" y2="34" />
        <line x1="133" y1="27" x2="126" y2="34" />
        <line x1="27" y1="133" x2="34" y2="126" />
        <line x1="133" y1="133" x2="126" y2="126" />
      </g>

      <g stroke="#C8952A" strokeWidth="2" strokeLinecap="round">
        <line x1="80" y1="80" x2="80" y2="22" />
        <line x1="80" y1="80" x2="138" y2="80" />
        <line x1="80" y1="80" x2="80" y2="138" />
        <line x1="80" y1="80" x2="22" y2="80" />
        <line x1="80" y1="80" x2="121" y2="39" />
        <line x1="80" y1="80" x2="121" y2="121" />
        <line x1="80" y1="80" x2="39" y2="121" />
        <line x1="80" y1="80" x2="39" y2="39" />
      </g>

      <circle cx="80" cy="80" r="46" fill="#1B3A5C" />
      <path d="M 115,50 A 46,46 0 1 0 115,110" fill="none" stroke="#C8952A" strokeWidth="6" strokeLinecap="round" />

      <line x1="80" y1="80" x2="46" y2="80" stroke="#F4F1E8" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="80" x2="114" y2="80" stroke="#F4F1E8" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="80" x2="80" y2="120" stroke="#C8952A" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="80" cy="80" r="3" fill="#C8952A" />
    </svg>
  );
}
