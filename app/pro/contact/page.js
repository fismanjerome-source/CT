'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/Logo';
import { PhoneIcon, MailIcon, WhatsAppIcon } from '../../components/ContactIcons';

export default function ProContactPage() {
  const pathname = usePathname();
  const [message, setMessage] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [statut, setStatut] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnvoi(true);
    setStatut(null);
    try {
      const res = await fetch('/api/pro/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) { setStatut({ type: 'error', text: data.erreur }); setEnvoi(false); return; }
      setStatut({ type: 'success', text: data.message });
      setMessage('');
    } catch {
      setStatut({ type: 'error', text: 'Erreur réseau. Réessayez.' });
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="pro-shell">
      <aside className="pro-sidebar">
        <div className="brand"><Logo /> Espace pro</div>
        <nav>
          <Link href="/pro/dashboard">📊 Tableau de bord</Link>
          <Link href="/pro/clients">🚗 Mes RDV clients</Link>
          <Link href="/pro/absences">🚫 Client absent</Link>
          <Link href="/pro/centres">🏢 Mes centres</Link>
          <Link href="/pro/factures">🧾 Mes factures</Link>
          <Link href="/pro/parametres">⚙️ Paramètres</Link>
          <Link href="/pro/contact" className={pathname.startsWith('/pro/contact') ? 'active' : ''}>💬 Contact Créneau CT</Link>
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
            <a href="mailto:contact@creneauct.fr" className="contact-btn">
              <MailIcon size={16} />
              contact@creneauct.fr
            </a>
            <a href="https://wa.me/33612345678" target="_blank" rel="noopener noreferrer" className="contact-btn contact-btn-whatsapp">
              <WhatsAppIcon size={16} />
              WhatsApp
            </a>
          </div>
        </div>

        <section className="card" style={{ marginTop: 20, maxWidth: 460 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>Ou écrivez-nous directement</h2></div>
          <p className="help-text">Votre message nous parvient instantanément — on revient vers vous rapidement.</p>

          {statut && <div className={`message-banner ${statut.type}`}>{statut.text}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="message">Votre message</label>
              <textarea
                id="message"
                rows={5}
                required
                placeholder="Décrivez votre question ou votre problème…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <button type="submit" disabled={envoi} style={{ width: '100%' }}>
              {envoi ? 'Envoi…' : 'Envoyer'}
            </button>
          </form>
        </section>

        <p className="help-text" style={{ marginTop: 24 }}>
          Vous pouvez aussi consulter notre <Link href="/faq-centres">FAQ dédiée aux centres</Link> — beaucoup de
          questions courantes (commission, remises, multi-centres...) y trouvent déjà leur réponse.
        </p>
      </main>
    </div>
  );
}
