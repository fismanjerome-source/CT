import Link from 'next/link';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import SideMenu from './SideMenu';

export default function Header() {
  return (
    <header className="site-header">
      <div className="container">
        <SideMenu />

        <Link href="/" className="brand">
          <Logo />
          Créneau CT
        </Link>

        {/* Navigation bureau : une seule ligne, inchangée */}
        <nav className="nav-desktop">
          <Link href="/guide">Le contrôle technique, c'est quoi ?</Link>
          <Link href="/suivi">Suivre un RDV</Link>
          <Link href="/faq-clients">FAQ</Link>
          <Link href="/pro/login">Espace professionnel</Link>
          <ThemeToggle />
        </nav>

        {/* Navigation mobile : logo centré au-dessus, puis lignes à deux colonnes */}
        <nav className="nav-mobile">
          <Link href="/guide" className="nav-mobile-centre">Le contrôle technique, c'est quoi ?</Link>
          <div className="nav-mobile-colonnes">
            <Link href="/suivi">Suivre un RDV</Link>
            <span className="nav-mobile-separateur" />
            <Link href="/pro/login">Espace professionnel</Link>
          </div>
          <div className="nav-mobile-colonnes">
            <Link href="/faq-clients">FAQ RDV client</Link>
            <span className="nav-mobile-separateur" />
            <Link href="/faq-centres">FAQ Centre de CT</Link>
          </div>
          <div className="nav-mobile-centre" style={{ display: 'flex', justifyContent: 'center' }}>
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
