'use client';

import { useEffect, useState, Suspense } from 'react';
import ProSidebar from '../../components/ProSidebar';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function formatMois(mois) {
  const [annee, m] = mois.split('-');
  const date = new Date(Number(annee), Number(m) - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function ProFacturesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const centreId = searchParams.get('centre');

  const [factures, setFactures] = useState(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    async function charger() {
      try {
        const url = centreId ? `/api/pro/factures?centre=${centreId}` : '/api/pro/factures';
        const res = await fetch(url);
        if (res.status === 401) { router.push('/pro/login'); return; }
        const json = await res.json();
        if (!res.ok) { setErreur(json.erreur); return; }
        setFactures(json.factures);
      } catch {
        setErreur('Erreur réseau. Réessayez.');
      }
    }
    charger();
  }, [router, centreId]);

  return (
    <div className="pro-shell">
      <ProSidebar centreId={centreId} />

      <main className="pro-main">
        <h1>Mes factures</h1>
        <p className="help-text">
          La commission Créneau CT due chaque mois, calculée automatiquement sur les RDV confirmés.
          Aucune facture n'est générée pour un mois sans réservation.
        </p>

        <section className="card" style={{ marginTop: 20, maxWidth: 460 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>💶 Taux de commission</h2></div>
          <p className="help-text">
            Calculée automatiquement sur le prix effectivement payé par le client, uniquement sur les rendez-vous
            honorés — jamais sur une absence signalée.
          </p>
          <table style={{ width: '100%' }}>
            <thead>
              <tr><th>Délai entre réservation et rendez-vous</th><th>Taux</th></tr>
            </thead>
            <tbody>
              <tr><td>Moins de 7 jours</td><td className="mono">25 %</td></tr>
              <tr><td>Entre 7 et 14 jours</td><td className="mono">20 %</td></tr>
              <tr><td>Plus de 14 jours</td><td className="mono">15 %</td></tr>
            </tbody>
          </table>
        </section>

        {erreur && <div className="message-banner error" style={{ marginTop: 16 }}>{erreur}</div>}

        {!factures ? (
          <p className="help-text" style={{ marginTop: 20 }}>Chargement…</p>
        ) : factures.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 20 }}>Aucune facture pour le moment.</div>
        ) : (
          <div style={{ marginTop: 20 }}>
            {factures.map((f) => (
              <Link key={f.mois} href={`/pro/factures/${f.mois}${centreId ? `?centre=${centreId}` : ''}`} className="facture-list-item">
                <div>
                  <strong>{formatMois(f.mois)}</strong>
                  <div className="help-text">{f.nombre_rdv} RDV confirmé{f.nombre_rdv > 1 ? 's' : ''}</div>
                </div>
                <span className="mono" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                  {Number(f.total_commission).toFixed(2)} €
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ProFacturesPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: 40 }}><p className="help-text">Chargement…</p></div>}>
      <ProFacturesPageInner />
    </Suspense>
  );
}
