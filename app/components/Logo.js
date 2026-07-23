export default function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" role="img" aria-label="Créneau CT" style={{ flexShrink: 0 }}>
      {/* Cercle extérieur */}
      <circle cx="80" cy="80" r="76" fill="#1B3A5C" />
      <circle cx="80" cy="80" r="76" fill="none" stroke="#C8952A" strokeWidth="3" />

      {/* Douze repères réguliers façon cadran, tous identiques pour un rendu net */}
      <g stroke="#C8952A" strokeWidth="3" strokeLinecap="round" opacity="0.9">
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const rExt = 71;
          const rInt = 62;
          const x1 = 80 + rInt * Math.sin(angle);
          const y1 = 80 - rInt * Math.cos(angle);
          const x2 = 80 + rExt * Math.sin(angle);
          const y2 = 80 - rExt * Math.cos(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>

      {/* Disque central */}
      <circle cx="80" cy="80" r="48" fill="#1B3A5C" stroke="#C8952A" strokeWidth="1.5" />

      {/* "C" : arc doré ouvert à droite */}
      <path d="M 116,52 A 48,48 0 1 0 116,108" fill="none" stroke="#C8952A" strokeWidth="7" strokeLinecap="round" />

      {/* "T" : barre horizontale crème + pied doré, épaisseurs assorties */}
      <line x1="44" y1="80" x2="112" y2="80" stroke="#F4F1E8" strokeWidth="7" strokeLinecap="round" />
      <line x1="80" y1="80" x2="80" y2="116" stroke="#C8952A" strokeWidth="7" strokeLinecap="round" />

      <circle cx="80" cy="80" r="4" fill="#F4F1E8" />
    </svg>
  );
}
