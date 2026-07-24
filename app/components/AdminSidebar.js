'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from './Logo';
import Horloge from './Horloge';
import { InstagramIcon, FacebookIcon, LinkedInIcon } from './ContactIcons';
import { IconArgent, IconGraphique, IconCarte, IconEtiquette, IconCalendrier, IconRecu, IconBatiment, IconOeil, IconEnveloppe, IconMessage, IconCadenas, IconBalance } from './UISvgIcons';

export default function AdminSidebar({ className = '' }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <aside className={`pro-sidebar ${className}`.trim()}>
      <div className="brand">
        <Logo />
        <div>
          <div className="brand-nom">Créneau CT</div>
          <div className="brand-sous-titre">Espace admin</div>
        </div>
      </div>
      <Horloge />
      <nav>
        <Link href="/admin/dashboard" className={pathname === '/admin/dashboard' ? 'active' : ''}><IconArgent /> Commissions</Link>
        <Link href="/admin/statistiques" className={pathname.startsWith('/admin/statistiques') ? 'active' : ''}><IconGraphique /> Statistiques</Link>
        <Link href="/admin/paiements" className={pathname.startsWith('/admin/paiements') ? 'active' : ''}><IconCarte /> Paiements</Link>
        <Link href="/admin/promotions" className={pathname.startsWith('/admin/promotions') ? 'active' : ''}><IconEtiquette /> Promotions</Link>
        <Link href="/admin/reserver" className={pathname.startsWith('/admin/reserver') ? 'active' : ''}><IconCalendrier /> Réserver un RDV</Link>
        <Link href="/admin/factures" className={pathname.startsWith('/admin/factures') ? 'active' : ''}><IconRecu /> Factures</Link>
        <Link href="/admin/centres" className={pathname.startsWith('/admin/centres') ? 'active' : ''}><IconBatiment /> Centres &amp; utilisateurs</Link>
        <Link href="/admin/espaces-pro" className={pathname.startsWith('/admin/espaces-pro') ? 'active' : ''}><IconOeil /> Espaces pro</Link>
        <Link href="/admin/emails" className={pathname.startsWith('/admin/emails') ? 'active' : ''}><IconEnveloppe /> Modèles de mails</Link>
        <Link href="/admin/contacts" className={pathname.startsWith('/admin/contacts') ? 'active' : ''}><IconMessage /> Contacts</Link>
        <Link href="/admin/securite" className={pathname.startsWith('/admin/securite') ? 'active' : ''}><IconCadenas /> Sécurité</Link>
        <Link href="/admin/juridique" className={pathname.startsWith('/admin/juridique') ? 'active' : ''}><IconBalance /> Juridique</Link>
        <Link href="/admin/cgu" className={pathname.startsWith('/admin/cgu') ? 'active' : ''}><IconRecu /> Modifier les CGU</Link>
      </nav>
      <div className="sidebar-reseaux">
        <a href="https://instagram.com/creneauct" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer-reseau-btn footer-reseau-instagram">
          <InstagramIcon size={15} />
        </a>
        <a href="https://facebook.com/creneauct" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="footer-reseau-btn footer-reseau-facebook">
          <FacebookIcon size={15} />
        </a>
        <a href="https://linkedin.com/company/creneauct" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="footer-reseau-btn footer-reseau-linkedin">
          <LinkedInIcon size={15} />
        </a>
      </div>
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <button className="btn-secondary" style={{ width: '100%', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }} onClick={logout}>
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
