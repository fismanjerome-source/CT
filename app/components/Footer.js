import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p style={{ margin: 0 }}>
          Plateforme indépendante de mise en relation pour rendez-vous de contrôle technique.
        </p>
        <nav className="footer-links">
          <Link href="/contact">Contact</Link>
          <Link href="/faq-clients">FAQ Clients</Link>
          <Link href="/faq-centres">FAQ Centres</Link>
          <Link href="/partenaires">Partenaires</Link>
          <Link href="/cgu">CGU</Link>
          <Link href="/mentions-legales">Mentions légales</Link>
        </nav>
      </div>
    </footer>
  );
}
