'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/Logo';
import { PhoneIcon, MailIcon } from '../../components/ContactIcons';

export default function ProContactPage() {
  const pathname = usePathname();

  return (
    <div className="pro-shell">
      <aside className="pro-sidebar">
        <div className="brand"><Logo /> Espace pro</div>
        <nav>
          <Link href="/pro/dashboard">Tableau de bord</Link>
          <Link href="/pro/centres">Mes centres</Link>
          <Link href="/pro/factures">Mes factures</Link>
          <Link href="/pro/parametres">Paramètres</Link>
          <Link href="/pro/contact" className={pathname.startsWith('/pro/contact') ? 'active' : ''}>Contact Créneau CT</Link>
        </nav>
      </aside>

      <main className="pro-main">
        <h1>Contacter Créneau CT</h1>
        <p className="help-text">
          Une question, un souci technique, ou besoin d'aide pour configurer votre centre ? Nous sommes
          disponibles directement — un vrai contact humain, pas un formulaire perdu dans le vide.
        </p>

        <div className="contact-humain" style={{ marginTop: 20, maxWidth: 460 }}>
          <span className="contact-humain-label">Nous joindre :</span>
          <div className="contact-humain-boutons">
            <a href="tel:+33186761234" className="contact-btn">
              <PhoneIcon size={16} />
              01 86 76 12 34
            </a>
            <a href="mailto:contact@creneauct.com" className="contact-btn">
              <MailIcon size={16} />
              contact@creneauct.com
            </a>
          </div>
        </div>

        <p className="help-text" style={{ marginTop: 24 }}>
          Vous pouvez aussi consulter notre <Link href="/faq-centres">FAQ dédiée aux centres</Link> — beaucoup de
          questions courantes (commission, remises, multi-centres...) y trouvent déjà leur réponse.
        </p>
      </main>
    </div>
  );
}
