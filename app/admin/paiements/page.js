'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { useRouter } from 'next/navigation';
import AlertePaiements from '../../components/AlertePaiements';

function formatMois(mois) {
  const [annee, m] = mois.split('-');
  const date = new Date(Number(annee), Number(m) - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export default function AdminPaiementsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(null);

  async function charger() {
    try {
      const res = await fetch('/api/admin/paiements');
      if (res.status === 401) { router.push('/admin/login'); return; }
      const json = await res.json();
      if (!res.ok) { setErreur(json.erreur); return; }
      setData(json);
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    }
  }

  useEffect(() => { charger(); }, []);

  async function marquer(centreId, mois, statut) {
    setEnCours(`${centreId}-${mois}`);
    try {
      await fetch('/api/admin/paiements/marquer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centre_id: centreId, mois, statut }),
      });
      charger();
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="pro-shell">
      <AdminSidebar />

      <main className="pro-main">
        <h1>Paiements</h1>
        <p className="help-text">
          Chaque centre doit régler sa commission du mois avant le 10 du mois suivant. Passé ce délai sans
          paiement enregistré ici, l'ouverture de nouveaux créneaux est automatiquement bloquée pour ce centre.
        </p>

        <AlertePaiements />

        {erreur && <div className="message-banner error">{erreur}</div>}

        {!data ? (
          <p className="help-text">Chargement…</p>
        ) : data.centres.length === 0 ? (
          <div className="empty-state">Aucun paiement à suivre pour le moment.</div>
        ) : (
          data.centres.map((c) => (
            <div key={c.centre_id} className="card">
              <div className="card-header">
                <div>
                  <h2 style={{ margin: 0 }}>{c.centre_nom}</h2>
                  <p className="help-text" style={{ margin: 0 }}>{c.enseigne || 'Indépendant'} · {c.ville}</p>
                </div>
                {c.bloque && <span className="badge reserve" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>Bloqué</span>}
              </div>

              {c.retards.length > 0 && (
                <table style={{ marginBottom: 10 }}>
                  <thead><tr><th>Mois</th><th>Montant</th><th>Date limite</th><th></th></tr></thead>
                  <tbody>
                    {c.retards.map((r) => (
                      <tr key={r.mois}>
                        <td>{formatMois(r.mois)}</td>
                        <td className="mono" style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{r.montant.toFixed(2)} €</td>
                        <td className="mono">{new Date(r.date_limite).toLocaleDateString('fr-FR')}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => marquer(c.centre_id, r.mois, 'paye')}
                            disabled={enCours === `${c.centre_id}-${r.mois}`}
                          >
                            Marquer comme payé
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {c.mois_en_cours.montant > 0 && (
                <p className="help-text">
                  Mois en cours ({formatMois(c.mois_en_cours.mois)}) : <strong className="mono">{c.mois_en_cours.montant.toFixed(2)} €</strong> générés,
                  pas encore exigibles — à régler avant le 10 du mois suivant.
                </p>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
