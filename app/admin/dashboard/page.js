'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/Logo';

export default function AdminDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState(null);
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
          <Link href="/admin/dashboard" className={pathname === '/admin/dashboard' ? 'active' : ''}>Commissions</Link>
          <Link href="/admin/factures" className={pathname.startsWith('/admin/factures') ? 'active' : ''}>Factures</Link>
          <Link href="/admin/centres" className={pathname.startsWith('/admin/centres') ? 'active' : ''}>Centres & utilisateurs</Link>
          <Link href="/admin/contacts" className={pathname.startsWith('/admin/contacts') ? 'active' : ''}>Contacts</Link>
        </nav>
        <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <button className="btn-secondary" style={{ width: '100%', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }} onClick={logout}>
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="pro-main">
        <h1>Commissions dues par les centres</h1>
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
                <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Centre</th>
                      <th>Enseigne</th>
                      <th>Ville</th>
                      <th>RDV confirmés</th>
                      <th>Commission due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.centres.map((c) => (
                      <tr key={c.centre_id}>
                        <td>{c.centre_nom}</td>
                        <td>{c.enseigne || 'Indépendant'}</td>
                        <td>{c.ville}</td>
                        <td className="mono">{c.nombre_rdv}</td>
                        <td className="mono" style={{ fontWeight: 700 }}>
                          {Number(c.total_commission).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
