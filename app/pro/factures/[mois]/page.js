'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import FactureDocument from '../../../components/FactureDocument';

export default function ProFactureDetailPage({ params }) {
  const { mois } = use(params);
  const router = useRouter();
  const [data, setData] = useState(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    async function charger() {
      try {
        const res = await fetch(`/api/pro/factures/${mois}`);
        if (res.status === 401) { router.push('/pro/login'); return; }
        const json = await res.json();
        if (!res.ok) { setErreur(json.erreur); return; }
        setData(json);
      } catch {
        setErreur('Erreur réseau. Réessayez.');
      }
    }
    charger();
  }, [router, mois]);

  if (erreur) {
    return (
      <div className="container" style={{ padding: 40 }}>
        <div className="message-banner error">{erreur}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="container" style={{ padding: 40 }}><p className="help-text">Chargement…</p></div>;
  }

  return <FactureDocument centre={data.centre} mois={data.mois} lignes={data.lignes} total={data.total} />;
}
