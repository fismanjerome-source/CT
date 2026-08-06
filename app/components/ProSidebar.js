'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import Horloge from './Horloge';
import { InstagramIcon, FacebookIcon, LinkedInIcon } from './ContactIcons';
import { IconTableauBord, IconVoiture, IconInterdit, IconBatiment, IconRecu, IconEngrenage, IconMessage, IconBalance, IconPersonnes } from './UISvgIcons';

export default function ProSidebar({ centreId, className = '' }) {
  const pathname = usePathname();
  const router = useRouter();
  const [estPremium, setEstPremium] = useState(false);

  useEffect(() => {
    let annule = false;
    fetch(`/api/pro/me${centreId ? `?centre=${centreId}` : ''}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!annule && data?.centre) setEstPremium(!!data.centre.est_premium); })
      .catch(() => {});
    return () => { annule = true; };
  }, [centreId]);

  async function logout() {
    await fetch('/api/pro/logout', { method: 'POST' });
    router.push('/pro/login');
  }

  const hrefDashboard = centreId ? `/pro/dashboard?centre=${centreId}` : '/pro/dashboard';
  const hrefFactures = centreId ? `/pro/factures?centre=${centreId}` : '/pro/factures';

  return (
    <aside className={`pro-sidebar ${className}`.trim()}>
      <div className="brand">
        <Logo />
        <div>
          <div className="brand-nom">Créneau CT</div>
          <div className="brand-sous-titre">Espace pro</div>
          {estPremium && <div className="sidebar-premium-badge">★ Compte Premium</div>}
        </div>
      </div>
      <Horloge />
      <nav>
        <Link href={hrefDashboard} className={pathname === '/pro/dashboard' ? 'active' : ''}><IconTableauBord /> Tableau de bord</Link>
        <Link href="/pro/clients" className={pathname.startsWith('/pro/clients') ? 'active' : ''}><IconVoiture /> Mes RDV clients</Link>
        <Link href="/pro/absences" className={pathname.startsWith('/pro/absences') ? 'active' : ''}><IconInterdit /> Client absent</Link>
        <Link href="/pro/centres" className={pathname.startsWith('/pro/centres') ? 'active' : ''}><IconBatiment /> Mes centres</Link>
        <Link href={hrefFactures} className={pathname.startsWith('/pro/factures') ? 'active' : ''}><IconRecu /> Mes factures</Link>
        <Link href="/pro/parametres" className={pathname.startsWith('/pro/parametres') ? 'active' : ''}><IconEngrenage /> Paramètres</Link>
        <Link href="/pro/juridique" className={pathname.startsWith('/pro/juridique') ? 'active' : ''}><IconBalance /> Juridique</Link>
        <Link href={centreId ? `/pro/premium?centre=${centreId}` : '/pro/premium'} className={pathname.startsWith('/pro/premium') ? 'active' : ''}>★ Premium</Link>
        <Link href={centreId ? `/pro/recrutement?centre=${centreId}` : '/pro/recrutement'} className={pathname.startsWith('/pro/recrutement') ? 'active' : ''}><IconPersonnes /> Recrutement</Link>
        <Link href="/pro/contact" className={pathname.startsWith('/pro/contact') ? 'active' : ''}><IconMessage /> Contact Créneau CT</Link>
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
