export function SquelletteLigne({ largeur = '100%', hauteur = 14, style = {} }) {
  return <div className="squelette" style={{ width: largeur, height: hauteur, borderRadius: 4, ...style }} />;
}

export function SquelletteCarte({ lignes = 3 }) {
  return (
    <div className="card">
      <SquelletteLigne largeur="40%" hauteur={12} style={{ marginBottom: 14, opacity: 0.7 }} />
      {Array.from({ length: lignes }).map((_, i) => (
        <SquelletteLigne key={i} largeur={i === lignes - 1 ? '60%' : '100%'} style={{ marginBottom: 10 }} />
      ))}
    </div>
  );
}

export function SquelletteTableau({ lignes = 5, colonnes = 5 }) {
  return (
    <div className="table-scroll">
      <table>
        <tbody>
          {Array.from({ length: lignes }).map((_, l) => (
            <tr key={l}>
              {Array.from({ length: colonnes }).map((_, c) => (
                <td key={c}><SquelletteLigne largeur={c === 0 ? '80%' : '60%'} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
