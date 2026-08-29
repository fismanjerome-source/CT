'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '../../components/AdminSidebar';
import { SquelletteCarte } from '../../components/Squelette';
import AlertePaiements from '../../components/AlertePaiements';

const LABELS_CATEGORIE = { client: '👤 Clients', pro: '🏢 Centres', admin: '🔐 Admin', avantmonct: '🔗 Avant Mon CT' };
const COULEURS_CATEGORIE = { client: '#1B3A5C', pro: '#C8952A', admin: '#5B665F', avantmonct: '#2E7D45' };
const CATEGORIES = ['client', 'pro', 'admin', 'avantmonct'];

export default function StatistiquesPage() {
  const router = useRouter();
  const [donnees, setDonnees] = useState(null);
  const [jours, setJours] = useState(30);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    async function charger() {
      try {
        const res = await fetch(`/api/admin/statistiques?jours=${jours}`);
        if (res.status === 401) { router.push('/admin/login'); return; }
        const data = await res.json();
        if (!res.ok) { setErreur(data.erreur); return; }
        setDonnees(data);
      } catch {
        setErreur('Erreur réseau. Réessayez.');
      }
    }
    charger();
  }, [jours, router]);

  const totalParCategorie = (cat) => donnees?.totaux.find((t) => t.categorie === cat)?.total || 0;
  const totalGeneral = donnees?.totaux.reduce((s, t) => s + t.total, 0) || 0;

  return (
    <div className="pro-shell">
      <AdminSidebar />

      <main className="pro-main">
        <h1>Statistiques de fréquentation</h1>
        <AlertePaiements />

        <p className="help-text">
          Basées sur les pages réellement visitées, sans cookie ni traceur — la ville n'est qu'une estimation
          d'après l'adresse IP au moment de la visite, jamais conservée elle-même.
        </p>

        <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
          {[7, 30, 90].map((j) => (
            <button
              key={j}
              type="button"
              className={jours === j ? '' : 'btn-secondary'}
              onClick={() => setJours(j)}
            >
              {j} derniers jours
            </button>
          ))}
        </div>

        {erreur && <div className="message-banner error">{erreur}</div>}

        {!donnees ? (
          <div className="grid-2" style={{ gap: 16, marginTop: 16 }}>
            <SquelletteCarte lignes={2} />
            <SquelletteCarte lignes={2} />
            <SquelletteCarte lignes={2} />
          </div>
        ) : (
          <>
            <div className="grid-2" style={{ gap: 16, marginBottom: 24 }}>
              {CATEGORIES.map((cat) => (
                <div key={cat} className="card" style={{ textAlign: 'center' }}>
                  <p className="eyebrow" style={{ marginBottom: 6 }}>{LABELS_CATEGORIE[cat]}</p>
                  <p style={{ fontSize: '2.2rem', fontWeight: 700, margin: 0, color: COULEURS_CATEGORIE[cat] }}>
                    {totalParCategorie(cat)}
                  </p>
                  <p className="help-text" style={{ margin: 0 }}>
                    {totalGeneral > 0 ? Math.round((totalParCategorie(cat) / totalGeneral) * 100) : 0}% des visites
                  </p>
                </div>
              ))}
            </div>

            <section className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><h2 style={{ margin: 0 }}>Répartition client / centre / admin / Avant Mon CT</h2></div>
              <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', marginTop: 10 }}>
                {CATEGORIES.map((cat) => {
                  const pct = totalGeneral > 0 ? (totalParCategorie(cat) / totalGeneral) * 100 : 0;
                  return pct > 0 ? (
                    <div key={cat} style={{ width: `${pct}%`, background: COULEURS_CATEGORIE[cat] }} title={`${LABELS_CATEGORIE[cat]} : ${Math.round(pct)}%`} />
                  ) : null;
                })}
              </div>
            </section>

            {donnees.visites_depuis_avant_mon_ct > 0 && (
              <div className="message-banner success" style={{ marginBottom: 20 }}>
                🔗 <strong>{donnees.visites_depuis_avant_mon_ct}</strong> visite{donnees.visites_depuis_avant_mon_ct > 1 ? 's' : ''} sur Créneau CT
                {' '}{donnees.visites_depuis_avant_mon_ct > 1 ? 'proviennent' : 'provient'} d'un lien posé sur Avant Mon CT
                {totalParCategorie('client') > 0 ? ` (${Math.round((donnees.visites_depuis_avant_mon_ct / totalParCategorie('client')) * 100)}% des visites clients)` : ''}.
              </div>
            )}

            <div className="grid-2" style={{ gap: 20 }}>
              <section className="card">
                <div className="card-header"><h2 style={{ margin: 0 }}>📍 Villes les plus actives</h2></div>
                {donnees.par_ville.length === 0 ? (
                  <div className="empty-state">Pas encore assez de données géolocalisées.</div>
                ) : (
                  <table>
                    <thead><tr><th>Ville</th><th>Région</th><th>Visites</th></tr></thead>
                    <tbody>
                      {donnees.par_ville.map((v, i) => (
                        <tr key={i}>
                          <td>{v.ville}</td>
                          <td className="help-text">{v.region}</td>
                          <td className="mono">{v.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <p className="help-text" style={{ marginTop: 10 }}>
                  {donnees.taux_geolocalisation}% des visites ont pu être localisées.
                </p>
              </section>

              <section className="card">
                <div className="card-header"><h2 style={{ margin: 0 }}>🗺️ Régions les plus actives</h2></div>
                {donnees.par_region.length === 0 ? (
                  <div className="empty-state">Pas encore assez de données géolocalisées.</div>
                ) : (
                  <table>
                    <thead><tr><th>Région</th><th>Visites</th></tr></thead>
                    <tbody>
                      {donnees.par_region.map((r, i) => (
                        <tr key={i}>
                          <td>{r.region}</td>
                          <td className="mono">{r.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </div>

            <section className="card" style={{ marginTop: 20 }}>
              <div className="card-header"><h2 style={{ margin: 0 }}>Pages les plus visitées (Créneau CT)</h2></div>
              {donnees.pages_populaires.length === 0 ? (
                <div className="empty-state">Pas encore de données.</div>
              ) : (
                <table>
                  <thead><tr><th>Page</th><th>Visites</th></tr></thead>
                  <tbody>
                    {donnees.pages_populaires.map((p, i) => (
                      <tr key={i}>
                        <td className="mono">{p.chemin}</td>
                        <td className="mono">{p.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="card" style={{ marginTop: 20 }}>
              <div className="card-header"><h2 style={{ margin: 0 }}>🔗 Pages les plus visitées (Avant Mon CT)</h2></div>
              {donnees.pages_populaires_avant_mon_ct.length === 0 ? (
                <div className="empty-state">Pas encore de données.</div>
              ) : (
                <table>
                  <thead><tr><th>Page</th><th>Visites</th></tr></thead>
                  <tbody>
                    {donnees.pages_populaires_avant_mon_ct.map((p, i) => (
                      <tr key={i}>
                        <td className="mono">{p.chemin}</td>
                        <td className="mono">{p.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
