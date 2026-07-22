'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from './Logo';
import Horloge from './Horloge';

export default function ProSidebar({ centreId, className = '' }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/pro/logout', { method: 'POST' });
    router.push('/pro/login');
  }

  const hrefDashboard = centreId ? `/pro/dashboard?centre=${centreId}` : '/pro/dashboard';
  const hrefFactures = centreId ? `/pro/factures?centre=${centreId}` : '/pro/factures';

  return (
    <aside className={`pro-sidebar ${className}`.trim()}>
      <div className="brand"><Logo /> Espace pro</div>
      <Horloge />
      <nav>
        <Link href={hrefDashboard} className={pathname === '/pro/dashboard' ? 'active' : ''}>📊 Tableau de bord</Link>
        <Link href="/pro/clients" className={pathname.startsWith('/pro/clients') ? 'active' : ''}>🚗 Mes RDV clients</Link>
        <Link href="/pro/absences" className={pathname.startsWith('/pro/absences') ? 'active' : ''}>🚫 Client absent</Link>
        <Link href="/pro/centres" className={pathname.startsWith('/pro/centres') ? 'active' : ''}>🏢 Mes centres</Link>
        <Link href={hrefFactures} className={pathname.startsWith('/pro/factures') ? 'active' : ''}>🧾 Mes factures</Link>
        <Link href="/pro/parametres" className={pathname.startsWith('/pro/parametres') ? 'active' : ''}>⚙️ Paramètres</Link>
        <Link href="/pro/contact" className={pathname.startsWith('/pro/contact') ? 'active' : ''}>💬 Contact Créneau CT</Link>
      </nav>
      <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <button className="btn-secondary" style={{ width: '100%', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }} onClick={logout}>
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
