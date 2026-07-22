'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../../../components/Logo';
import AdminSidebar from '../../../../components/AdminSidebar';
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
      <AdminSidebar className="no-print" />

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
