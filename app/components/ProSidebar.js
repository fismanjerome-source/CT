'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from './Logo';
import Horloge from './Horloge';
import { InstagramIcon, FacebookIcon, LinkedInIcon } from './ContactIcons';
import { IconTableauBord, IconVoiture, IconInterdit, IconBatiment, IconRecu, IconEngrenage, IconCadenas, IconMessage, IconBalance, IconPersonnes } from './UISvgIcons';

function IconMenuBurger() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default function ProSidebar({
  centreId,
  className = '',
  premium = false,
  centreSwitcher = null,
  extraNavLinks = null,
  footerNote = null,
}) {
  const pathname = usePathname();
  const router = useRouter();
  // Replié par défaut sur mobile : la navigation complète (~1000px de haut)
  // s'affichait sinon intégralement avant le contenu du tableau de bord.
  const [menuOuvert, setMenuOuvert] = useState(false);

  async function logout() {
    await fetch('/api/pro/logout', { method: 'POST' });
    router.push('/pro/login');
  }

  const hrefDashboard = centreId ? `/pro/dashboard?centre=${centreId}` : '/pro/dashboard';
  const hrefFactures = centreId ? `/pro/factures?centre=${centreId}` : '/pro/factures';

  return (
    <aside className={`pro-sidebar ${className}`.trim()}>
      <div className="pro-sidebar-entete">
        <div className="brand">
          <Logo />
          <div>
            <div className="brand-nom">Créneau CT</div>
            <div className="brand-sous-titre">Espace pro</div>
            {premium && <div className="sidebar-premium-badge">★ Compte Premium</div>}
          </div>
        </div>
        <button
          type="button"
          className="pro-sidebar-toggle"
          onClick={() => setMenuOuvert((v) => !v)}
          aria-expanded={menuOuvert}
          aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          <IconMenuBurger />
        </button>
      </div>

      <div className={`pro-sidebar-corps ${menuOuvert ? 'ouvert' : ''}`}>
        <Horloge />
        {centreSwitcher && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: '0.72rem', color: '#cfe0d2', display: 'block', marginBottom: 4 }}>Centre géré</label>
            <select
              value={centreSwitcher.valeur}
              onChange={(e) => centreSwitcher.onChange(e.target.value)}
              style={{ width: '100%' }}
            >
              {centreSwitcher.centres.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
        )}
        <nav>
          {extraNavLinks}
          <Link href={hrefDashboard} className={pathname === '/pro/dashboard' ? 'active' : ''}><IconTableauBord /> Tableau de bord</Link>
          <Link href={centreId ? `/pro/clients?centre=${centreId}` : '/pro/clients'} className={pathname.startsWith('/pro/clients') ? 'active' : ''}><IconVoiture /> Mes RDV clients</Link>
          <Link href={centreId ? `/pro/absences?centre=${centreId}` : '/pro/absences'} className={pathname.startsWith('/pro/absences') ? 'active' : ''}><IconInterdit /> Client absent</Link>
          <Link href={centreId ? `/pro/centres?centre=${centreId}` : '/pro/centres'} className={pathname.startsWith('/pro/centres') ? 'active' : ''}><IconBatiment /> Mes centres</Link>
          <Link href={hrefFactures} className={pathname.startsWith('/pro/factures') ? 'active' : ''}><IconRecu /> Mes factures</Link>
          <Link href={centreId ? `/pro/parametres?centre=${centreId}` : '/pro/parametres'} className={pathname.startsWith('/pro/parametres') ? 'active' : ''}><IconEngrenage /> Paramètres</Link>
          <Link href={centreId ? `/pro/juridique?centre=${centreId}` : '/pro/juridique'} className={pathname.startsWith('/pro/juridique') ? 'active' : ''}><IconBalance /> Juridique</Link>
          <Link href={centreId ? `/pro/premium?centre=${centreId}` : '/pro/premium'} className={pathname.startsWith('/pro/premium') ? 'active' : ''}>★ Premium</Link>
          <Link href={centreId ? `/pro/recrutement?centre=${centreId}` : '/pro/recrutement'} className={pathname.startsWith('/pro/recrutement') ? 'active' : ''}><IconPersonnes /> Recrutement</Link>
          <Link href={centreId ? `/pro/api?centre=${centreId}` : '/pro/api'} className={pathname.startsWith('/pro/api') ? 'active' : ''}><IconCadenas /> Clés API</Link>
          <Link href={centreId ? `/pro/contact?centre=${centreId}` : '/pro/contact'} className={pathname.startsWith('/pro/contact') ? 'active' : ''}><IconMessage /> Contact Créneau CT</Link>
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
          {footerNote && <p style={{ fontSize: '0.85rem', color: '#cfe0d2', marginBottom: 10 }}>{footerNote}</p>}
          <button className="btn-secondary" style={{ width: '100%', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }} onClick={logout}>
            Se déconnecter
          </button>
        </div>
      </div>
    </aside>
  );
}
