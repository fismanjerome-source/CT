'use client';

import { useEffect, useState, use, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../../components/Logo';
import FactureDocument from '../../../components/FactureDocument';

function ProFactureDetailInner({ mois }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const centreId = searchParams.get('centre');

  const [data, setData] = useState(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    async function charger() {
      try {
        const url = centreId ? `/api/pro/factures/${mois}?centre=${centreId}` : `/api/pro/factures/${mois}`;
        const res = await fetch(url);
        if (res.status === 401) { router.push('/pro/login'); return; }
        const json = await res.json();
        if (!res.ok) { setErreur(json.erreur); return; }
        setData(json);
      } catch {
        setErreur('Erreur réseau. Réessayez.');
      }
    }
    charger();
  }, [router, mois, centreId]);

  return (
    <div className="pro-shell">
      <aside className="pro-sidebar no-print">
        <div className="brand"><Logo /> Espace pro</div>
        <nav>
          <Link href="/pro/dashboard">Tableau de bord</Link>
          <Link href="/pro/factures" className={pathname.startsWith('/pro/factures') ? 'active' : ''}>Mes factures</Link>
          <Link href="/pro/contact">Contact Créneau CT</Link>
        </nav>
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

export default function ProFactureDetailPage({ params }) {
  const { mois } = use(params);
  return (
    <Suspense fallback={<div className="container" style={{ padding: 40 }}><p className="help-text">Chargement…</p></div>}>
      <ProFactureDetailInner mois={mois} />
    </Suspense>
  );
}
