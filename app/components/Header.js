import Link from 'next/link';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="brand">
          <Logo />
          Créneau CT
        </Link>
        <nav>
          <Link href="/suivi">Suivre un RDV</Link>
          <Link href="/faq-clients">FAQ</Link>
          <Link href="/pro/login">Espace professionnel</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
