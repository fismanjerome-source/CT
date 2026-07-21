import Link from 'next/link';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import SideMenu from './SideMenu';

export default function Header() {
  return (
    <>
      <header className="site-header">
        <div className="container">
          <SideMenu />
          <div className="mobile-theme-toggle-wrap"><ThemeToggle /></div>

          <Link href="/" className="brand">
            <Logo />
            Créneau CT
          </Link>
          <p className="brand-tagline">Réservation de contrôle technique en ligne</p>

          {/* Navigation bureau : une seule ligne, inchangée */}
          <nav className="nav-desktop">
            <Link href="/guide">Le contrôle technique, c'est quoi ?</Link>
            <Link href="/suivi">Suivre un RDV</Link>
            <Link href="/faq-clients">FAQ</Link>
            <Link href="/pro/login">Espace professionnel</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Encadré clair mobile, distinct du bandeau bleu, avec les liens essentiels */}
      <nav className="mobile-subnav">
        <Link href="/guide" className="mobile-subnav-centre">Le contrôle technique, c'est quoi ?</Link>
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
