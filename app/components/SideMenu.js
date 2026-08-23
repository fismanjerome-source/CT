'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

export default function SideMenu() {
  const [ouvert, setOuvert] = useState(false);
  const fermerBtnRef = useRef(null);

  useEffect(() => {
    if (!ouvert) return;
    fermerBtnRef.current?.focus();
    function onKeyDown(e) {
      if (e.key === 'Escape') setOuvert(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [ouvert]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-label="Ouvrir le menu"
        className="hamburger-btn"
      >
        <HamburgerIcon />
      </button>

      {ouvert && (
        <div className="side-menu-overlay" onClick={(e) => e.target === e.currentTarget && setOuvert(false)}>
          <div className="side-menu-panel" role="navigation" aria-label="Menu principal">
            <div className="side-menu-header">
              <span className="side-menu-titre">Menu</span>
              <button ref={fermerBtnRef} type="button" onClick={() => setOuvert(false)} aria-label="Fermer le menu" className="side-menu-close">
                <CloseIcon />
              </button>
            </div>

            <div className="side-menu-section">
              <span className="side-menu-section-titre">Vous êtes client</span>
              <Link href="/" onClick={() => setOuvert(false)}>📅 Réserver un RDV</Link>
              <Link href="/suivi" onClick={() => setOuvert(false)}>🔎 Suivre mon RDV</Link>
              <Link href="/guide" onClick={() => setOuvert(false)}>🚗 Guide du contrôle technique</Link>
              <Link href="/faq-clients" onClick={() => setOuvert(false)}>❓ FAQ Clients</Link>
              <a
                href="https://avant.creneauct.fr/checklist?utm_source=creneau-ct&utm_medium=website&utm_campaign=side-menu"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOuvert(false)}
              >
                ✅ Checklist gratuite avant le CT
              </a>
            </div>

            <div className="side-menu-section">
              <span className="side-menu-section-titre">Vous êtes un centre</span>
              <Link href="/pro/login" onClick={() => setOuvert(false)}>🏢 Espace professionnel</Link>
              <Link href="/faq-centres" onClick={() => setOuvert(false)}>❓ FAQ Centres</Link>
              <Link href="/partenaires" onClick={() => setOuvert(false)}>🤝 Partenaires</Link>
            </div>

            <div className="side-menu-section">
              <span className="side-menu-section-titre">Informations</span>
              <Link href="/contact" onClick={() => setOuvert(false)}>💬 Contact</Link>
              <Link href="/securite" onClick={() => setOuvert(false)}>🔒 Sécurité et confidentialité</Link>
              <Link href="/cgu" onClick={() => setOuvert(false)}>📄 Conditions générales d'utilisation</Link>
              <Link href="/mentions-legales" onClick={() => setOuvert(false)}>⚖️ Mentions légales</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
