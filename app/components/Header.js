'use client';

import Link from 'next/link';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import SideMenu from './SideMenu';
import { useSite } from './SiteContext';

export default function Header() {
  const site = useSite();
  return (
    <>
      <header className="site-header">
        <div className="container">
          <SideMenu />
          <div className="mobile-theme-toggle-wrap"><ThemeToggle /></div>

          <Link href="/" className="brand">
            <Logo />
            {site === 'pl' ? 'Créneau CT PL' : 'Créneau CT'}
          </Link>
          <p className="brand-tagline">
            {site === 'pl' ? 'Contrôle technique poids lourds et autocars' : 'Réservation de contrôle technique en ligne'}
          </p>

          {/* Navigation bureau : une seule ligne, inchangée */}
          <nav className="nav-desktop">
            <Link href="/guide">Guide</Link>
            <Link href="/suivi">Suivre un RDV</Link>
            <Link href="/faq-clients">FAQ</Link>
            <Link href="/pro/login">Espace professionnel</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Encadré clair mobile, distinct du bandeau bleu, avec les liens essentiels */}
      <nav className="mobile-subnav">
        <Link href="/guide" className="mobile-subnav-centre">Guide</Link>
        <div className="mobile-subnav-colonnes">
          <Link href="/suivi">Suivre un RDV</Link>
          <span className="mobile-subnav-separateur" />
          <Link href="/pro/login">Espace professionnel</Link>
        </div>
        <div className="mobile-subnav-colonnes">
          <Link href="/faq-clients">FAQ RDV client</Link>
          <span className="mobile-subnav-separateur" />
          <Link href="/faq-centres">FAQ Centre de CT</Link>
        </div>
      </nav>
    </>
  );
}
