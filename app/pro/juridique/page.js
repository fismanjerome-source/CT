'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProSidebar from '../../components/ProSidebar';

export default function JuridiquePage() {
  const router = useRouter();
  const [fiches, setFiches] = useState(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    async function charger() {
      try {
        const res = await fetch('/api/fiches-juridiques');
        if (res.status === 401) { router.push('/pro/login'); return; }
        const data = await res.json();
        if (!res.ok) { setErreur(data.erreur); return; }
        setFiches(data.fiches);
      } catch {
        setErreur('Erreur réseau. Réessayez.');
      }
    }
    charger();
  }, [router]);

  return (
    <div className="pro-shell">
      <ProSidebar />

      <main className="pro-main">
        <h1>Juridique</h1>
        <p className="help-text">
          Informations juridiques utiles pour votre centre — mises à jour par l'équipe Créneau CT.
        </p>

        {erreur && <div className="message-banner error" style={{ marginTop: 16 }}>{erreur}</div>}

        {!fiches ? (
          <p className="help-text">Chargement…</p>
        ) : fiches.length === 0 ? (
          <div className="empty-state">Aucune fiche disponible pour le moment.</div>
        ) : (
          fiches.map((f) => (
            <section key={f.id} className="card">
              <div className="card-header"><h2 style={{ margin: 0 }}>{f.titre}</h2></div>
              {f.resume && <p className="help-text" style={{ fontStyle: 'italic' }}>{f.resume}</p>}
              <p style={{ whiteSpace: 'pre-line' }}>{f.contenu}</p>
              {f.lien_externe && (
                <a href={f.lien_externe} target="_blank" rel="noopener noreferrer">
                  {f.lien_libelle || 'En savoir plus'} ↗
                </a>
              )}
            </section>
          ))
        )}
      </main>
    </div>
  );
}
