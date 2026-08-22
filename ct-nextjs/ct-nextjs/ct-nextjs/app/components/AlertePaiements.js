'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AlertePaiements() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/admin/paiements').then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className={`paiements-banner ${data.total_en_retard > 0 ? 'alerte' : 'ok'}`}>
      <div>
        <strong>
          {data.total_en_retard > 0
            ? `${data.total_en_retard.toFixed(2)} € en retard de paiement`
            : 'Aucun retard de paiement en cours'}
        </strong>
        {data.nombre_centres_bloques > 0 && (
          <span> — {data.nombre_centres_bloques} centre{data.nombre_centres_bloques > 1 ? 's' : ''} actuellement bloqué{data.nombre_centres_bloques > 1 ? 's' : ''}</span>
        )}
        <span className="help-text" style={{ marginLeft: 10 }}>
          + {data.total_mois_en_cours.toFixed(2)} € générés ce mois-ci (pas encore exigibles)
        </span>
      </div>
      <Link href="/admin/paiements" className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
        Voir les paiements
      </Link>
    </div>
  );
}
