'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/Logo';
import AlertePaiements from '../../components/AlertePaiements';

export default function AdminDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState(null);
  const [centreOuvert, setCentreOuvert] = useState(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    async function charger() {
      try {
        const res = await fetch('/api/admin/commissions');
        if (res.status === 401) { router.push('/admin/login'); return; }
        const json = await res.json();
        if (!res.ok) { setErreur(json.erreur); return; }
        setData(json);
      } catch {
        setErreur('Erreur réseau. Réessayez.');
      }
    }
    charger();
  }, [router]);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <div className="pro-shell">
      <aside className="pro-sidebar">
        <div className="brand"><Logo /> Espace admin</div>
        <nav>
          <Link href="/admin/dashboard" className={pathname === '/admin/dashboard' ? 'active' : ''}>💰 Commissions</Link>
          <Link href="/admin/paiements" className={pathname.startsWith('/admin/paiements') ? 'active' : ''}>💳 Paiements</Link>
          <Link href="/admin/promotions" className={pathname.startsWith('/admin/promotions') ? 'active' : ''}>🏷️ Promotions</Link>
          <Link href="/admin/reserver" className={pathname.startsWith('/admin/reserver') ? 'active' : ''}>📅 Réserver un RDV</Link>
          <Link href="/admin/factures" className={pathname.startsWith('/admin/factures') ? 'active' : ''}>🧾 Factures</Link>
          <Link href="/admin/centres" className={pathname.startsWith('/admin/centres') ? 'active' : ''}>🏢 Centres & utilisateurs</Link>
          <Link href="/admin/emails" className={pathname.startsWith('/admin/emails') ? 'active' : ''}>✉️ Modèles de mails</Link>
          <Link href="/admin/contacts" className={pathname.startsWith('/admin/contacts') ? 'active' : ''}>💬 Contacts</Link>
          <Link href="/admin/securite">🔐 Sécurité</Link>
        </nav>
        <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <button className="btn-secondary" style={{ width: '100%', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }} onClick={logout}>
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="pro-main">
        <h1>Commissions dues par les centres</h1>
        <AlertePaiements />
        <p className="help-text">
          Calculées automatiquement à la réservation : 30% si le RDV est pris dans les 7 jours, 25% entre 7 et 14 jours,
          20% au-delà — appliqué sur le prix renseigné par chaque centre.
        </p>

        {erreur && <div className="message-banner error" style={{ marginTop: 16 }}>{erreur}</div>}

        {!data ? (
          <p className="help-text" style={{ marginTop: 20 }}>Chargement…</p>
        ) : (
          <>
            <div className="card" style={{ marginTop: 24 }}>
              <div className="card-header">
                <h2 style={{ margin: 0 }}>Total à recevoir</h2>
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                {Number(data.total_general).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </p>
              <p className="help-text">sur {data.nombre_rdv_total} rendez-vous confirmés, tous centres confondus.</p>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 style={{ margin: 0 }}>Détail par centre</h2>
              </div>
              {data.centres.length === 0 ? (
                <div className="empty-state">Aucun centre pour le moment.</div>
              ) : (
                data.centres.map((c) => {
                  const ouvert = centreOuvert === c.centre_id;
                  return (
                    <div key={c.centre_id} style={{ borderTop: '1px solid var(--color-border)', padding: '14px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <strong>{c.centre_nom}</strong>
                          <span className="help-text" style={{ marginLeft: 8 }}>{c.enseigne || 'Indépendant'} · {c.ville}</span>
                          <div className="help-text">{c.nombre_rdv} RDV confirmé{c.nombre_rdv > 1 ? 's' : ''}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <span className="mono" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                            {Number(c.total_commission).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                          </span>
                          {c.nombre_rdv > 0 && (
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => setCentreOuvert(ouvert ? null : c.centre_id)}
                            >
                              {ouvert ? 'Masquer le détail' : 'Voir le détail'}
                            </button>
                          )}
                        </div>
                      </div>

                      {ouvert && (
                        <div className="table-scroll" style={{ marginTop: 12 }}>
                          <table>
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Heure</th>
                                <th>Référence</th>
                                <th>Montant TTC</th>
                                <th>Taux</th>
                                <th>Commission</th>
                              </tr>
                            </thead>
                            <tbody>
                              {c.lignes.map((l) => (
                                <tr key={l.reference}>
                                  <td className="mono">{new Date(l.date + 'T00:00:00').toLocaleDateString('fr-FR')}</td>
                                  <td className="mono">{l.heure}</td>
                                  <td className="mono">{l.reference}</td>
                                  <td className="mono">{l.prix != null ? `${l.prix.toFixed(2)} €` : '—'}</td>
                                  <td className="mono">{l.commission_pourcentage}%</td>
                                  <td className="mono" style={{ fontWeight: 700 }}>
                                    {l.commission_montant != null ? `${l.commission_montant.toFixed(2)} €` : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
