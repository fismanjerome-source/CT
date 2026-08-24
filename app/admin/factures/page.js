'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AlertePaiements from '../../components/AlertePaiements';

function formatMois(mois) {
  const [annee, m] = mois.split('-');
  const date = new Date(Number(annee), Number(m) - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export default function AdminFacturesPage() {
  const router = useRouter();
  const [factures, setFactures] = useState(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    async function charger() {
      try {
        const res = await fetch('/api/admin/factures');
        if (res.status === 401) { router.push('/admin/login'); return; }
        const json = await res.json();
        if (!res.ok) { setErreur(json.erreur); return; }
        setFactures(json.factures);
      } catch {
        setErreur('Erreur réseau. Réessayez.');
      }
    }
    charger();
  }, [router]);

  return (
    <div className="pro-shell">
      <AdminSidebar />

      <main className="pro-main">
        <h1>Factures</h1>
        <AlertePaiements />
        <p className="help-text">
          Une facture par centre et par mois, générée automatiquement dès qu'il y a eu au moins un RDV confirmé.
          Rien à faire pour les mois sans activité — aucune facture n'est créée.
        </p>

        {erreur && <div className="message-banner error" style={{ marginTop: 16 }}>{erreur}</div>}

        {!factures ? (
          <p className="help-text" style={{ marginTop: 20 }}>Chargement…</p>
        ) : factures.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 20 }}>Aucune facture pour le moment.</div>
        ) : (
          <div style={{ marginTop: 20 }}>
            {factures.map((f) => (
              <Link
                key={`${f.centre_id}-${f.mois}`}
                href={`/admin/factures/${f.centre_id}/${f.mois}`}
                className="facture-list-item"
              >
                <div>
                  <strong>{f.centre_nom}</strong>
                  <span className="help-text" style={{ marginLeft: 8 }}>{f.enseigne || 'Indépendant'} · {f.ville}</span>
                  <div className="help-text">{formatMois(f.mois)} · {f.nombre_rdv} RDV</div>
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
