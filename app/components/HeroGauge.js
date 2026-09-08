// Motif décoratif du hero : reprend le langage graphique du logo (cadran à
// graduations, voir Logo.js) plutôt qu'un fond générique à flous radiaux.
// Purement décoratif (aria-hidden), le cercle est centré hors-cadre à droite
// du SVG pour ne montrer qu'un demi-cadran qui "saigne" du côté du hero —
// asymétrique et non centré, à l'inverse d'un blob de dégradé classique.
export default function HeroGauge() {
  // Arrondi à 2 décimales : comme dans Logo.js, Math.sin/cos peuvent différer
  // de ~1e-13 entre le rendu serveur (Node) et le navigateur pour un même
  // angle, ce qui suffit à déclencher un avertissement d'hydratation React
  // sans aucune incidence visuelle sur un motif décoratif de cette taille.
  const arrondi = (n) => Math.round(n * 100) / 100;

  const cx = 260;
  const cy = 260;
  const rInt = 188;
  const rExtMineure = 208;
  const rExtMajeure = 226;

  const nbTicks = 15;
  const debutDeg = 90;
  const finDeg = 270;

  const ticks = Array.from({ length: nbTicks }, (_, i) => {
    const deg = debutDeg + (i * (finDeg - debutDeg)) / (nbTicks - 1);
    const rad = (deg * Math.PI) / 180;
    const majeure = i % 4 === 0;
    const rExt = majeure ? rExtMajeure : rExtMineure;
    return {
      key: i,
      majeure,
      x1: arrondi(cx + rInt * Math.cos(rad)),
      y1: arrondi(cy + rInt * Math.sin(rad)),
      x2: arrondi(cx + rExt * Math.cos(rad)),
      y2: arrondi(cy + rExt * Math.sin(rad)),
    };
  });

  return (
    <svg
      viewBox="0 0 260 520"
      aria-hidden="true"
      className="hero-gauge"
    >
      <circle cx={cx} cy={cy} r={rInt} fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      {ticks.map((t) => (
        <line
          key={t.key}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="currentColor"
          strokeWidth={t.majeure ? 2.5 : 1.2}
          strokeLinecap="round"
          opacity={t.majeure ? 0.75 : 0.4}
        />
      ))}
    </svg>
  );
}
