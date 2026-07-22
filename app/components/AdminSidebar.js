'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from './Logo';
import Horloge from './Horloge';

export default function AdminSidebar({ className = '' }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <aside className={`pro-sidebar ${className}`.trim()}>
      <div className="brand"><Logo /> Espace admin</div>
      <Horloge />
      <nav>
        <Link href="/admin/dashboard" className={pathname === '/admin/dashboard' ? 'active' : ''}>💰 Commissions</Link>
        <Link href="/admin/paiements" className={pathname.startsWith('/admin/paiements') ? 'active' : ''}>💳 Paiements</Link>
        <Link href="/admin/promotions" className={pathname.startsWith('/admin/promotions') ? 'active' : ''}>🏷️ Promotions</Link>
        <Link href="/admin/reserver" className={pathname.startsWith('/admin/reserver') ? 'active' : ''}>📅 Réserver un RDV</Link>
        <Link href="/admin/factures" className={pathname.startsWith('/admin/factures') ? 'active' : ''}>🧾 Factures</Link>
        <Link href="/admin/centres" className={pathname.startsWith('/admin/centres') ? 'active' : ''}>🏢 Centres & utilisateurs</Link>
        <Link href="/admin/espaces-pro" className={pathname.startsWith('/admin/espaces-pro') ? 'active' : ''}>👁️ Espaces pro</Link>
        <Link href="/admin/emails" className={pathname.startsWith('/admin/emails') ? 'active' : ''}>✉️ Modèles de mails</Link>
        <Link href="/admin/contacts" className={pathname.startsWith('/admin/contacts') ? 'active' : ''}>💬 Contacts</Link>
        <Link href="/admin/securite" className={pathname.startsWith('/admin/securite') ? 'active' : ''}>🔐 Sécurité</Link>
      </nav>
      <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <button className="btn-secondary" style={{ width: '100%', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }} onClick={logout}>
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
