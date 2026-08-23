import Link from 'next/link';
import { InstagramIcon, FacebookIcon, LinkedInIcon } from './ContactIcons';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p style={{ margin: 0 }}>
          Plateforme indépendante de mise en relation pour rendez-vous de contrôle technique.
        </p>
        <div className="footer-reseaux">
          <a href="https://instagram.com/creneauct" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer-reseau-btn footer-reseau-instagram">
            <InstagramIcon size={18} />
          </a>
          <a href="https://facebook.com/creneauct" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="footer-reseau-btn footer-reseau-facebook">
            <FacebookIcon size={18} />
          </a>
          <a href="https://linkedin.com/company/creneauct" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="footer-reseau-btn footer-reseau-linkedin">
            <LinkedInIcon size={18} />
          </a>
        </div>
        <nav className="footer-links">
          <Link href="/guide">Contrôle technique : le guide</Link>
          <a href="https://avant.creneauct.fr?utm_source=creneau-ct&utm_medium=website&utm_campaign=footer" target="_blank" rel="noopener noreferrer">
            Checklist gratuite avant votre CT
          </a>
          <Link href="/contact">Contact</Link>
          <Link href="/faq-clients">FAQ Clients</Link>
          <Link href="/faq-centres">FAQ Centres</Link>
          <Link href="/partenaires">Partenaires</Link>
          <Link href="/securite">Sécurité</Link>
          <Link href="/cgu">CGU</Link>
          <Link href="/mentions-legales">Mentions légales</Link>
        </nav>
        <p className="footer-copyright">© {new Date().getFullYear()} Créneau CT. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
