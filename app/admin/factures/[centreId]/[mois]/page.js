'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../../../components/Logo';
import FactureDocument from '../../../../components/FactureDocument';

export default function AdminFactureDetailPage({ params }) {
  const { centreId, mois } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    async function charger() {
      try {
        const res = await fetch(`/api/admin/factures/${centreId}/${mois}`);
        if (res.status === 401) { router.push('/admin/login'); return; }
        const json = await res.json();
        if (!res.ok) { setErreur(json.erreur); return; }
        setData(json);
      } catch {
        setErreur('Erreur réseau. Réessayez.');
      }
    }
    charger();
  }, [router, centreId, mois]);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <div className="pro-shell">
      <aside className="pro-sidebar no-print">
        <div className="brand"><Logo /> Espace admin</div>
        <nav>
          <Link href="/admin/dashboard" className={pathname === '/admin/dashboard' ? 'active' : ''}>Commissions</Link>
          <Link href="/admin/paiements" className={pathname.startsWith('/admin/paiements') ? 'active' : ''}>Paiements</Link>
          <Link href="/admin/promotions" className={pathname.startsWith('/admin/promotions') ? 'active' : ''}>Promotions</Link>
          <Link href="/admin/reserver" className={pathname.startsWith('/admin/reserver') ? 'active' : ''}>Réserver un RDV</Link>
          <Link href="/admin/factures" className={pathname.startsWith('/admin/factures') ? 'active' : ''}>Factures</Link>
          <Link href="/admin/centres" className={pathname.startsWith('/admin/centres') ? 'active' : ''}>Centres & utilisateurs</Link>
          <Link href="/admin/emails" className={pathname.startsWith('/admin/emails') ? 'active' : ''}>Modèles de mails</Link>
          <Link href="/admin/contacts" className={pathname.startsWith('/admin/contacts') ? 'active' : ''}>Contacts</Link>
        </nav>
        <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <button className="btn-secondary" style={{ width: '100%', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }} onClick={logout}>
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="pro-main">
        {erreur && <div className="message-banner error">{erreur}</div>}
        {!data ? (
          <p className="help-text">Chargement…</p>
        ) : (
          <FactureDocument centre={data.centre} mois={data.mois} lignes={data.lignes} total={data.total} />
        )}
      </main>
    </div>
  );
}
