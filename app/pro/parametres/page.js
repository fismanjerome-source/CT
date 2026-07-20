'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/Logo';

export default function ProParametresPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [motDePasseActuel, setMotDePasseActuel] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (nouveauMotDePasse !== confirmation) {
      setMessage({ type: 'error', text: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }

    setEnvoi(true);
    try {
      const res = await fetch('/api/pro/mot-de-passe', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mot_de_passe_actuel: motDePasseActuel, nouveau_mot_de_passe: nouveauMotDePasse }),
      });
      const data = await res.json();
      if (res.status === 401 && data.erreur?.includes('connecter')) { router.push('/pro/login'); return; }
      if (!res.ok) { setMessage({ type: 'error', text: data.erreur }); setEnvoi(false); return; }
      setMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès.' });
      setMotDePasseActuel('');
      setNouveauMotDePasse('');
      setConfirmation('');
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau. Réessayez.' });
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
          <Link href="/pro/centres">🏢 Mes centres</Link>
          <Link href="/pro/factures">🧾 Mes factures</Link>
          <Link href="/pro/parametres" className={pathname.startsWith('/pro/parametres') ? 'active' : ''}>⚙️ Paramètres</Link>
          <Link href="/pro/contact">💬 Contact Créneau CT</Link>
        </nav>
      </aside>

      <main className="pro-main">
        <h1>Paramètres du compte</h1>
        <p className="help-text">Modifiez votre mot de passe de connexion.</p>

        <section className="card" style={{ marginTop: 24, maxWidth: 420 }}>
          <div className="card-header">
            <h2 style={{ margin: 0 }}>Changer mon mot de passe</h2>
          </div>

          {message && <div className={`message-banner ${message.type}`}>{message.text}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="actuel">Mot de passe actuel</label>
              <input
                id="actuel" type="password" required autoComplete="current-password"
                value={motDePasseActuel} onChange={(e) => setMotDePasseActuel(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="nouveau">Nouveau mot de passe</label>
              <input
                id="nouveau" type="password" required minLength={8} autoComplete="new-password"
                value={nouveauMotDePasse} onChange={(e) => setNouveauMotDePasse(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="confirmation">Confirmer le nouveau mot de passe</label>
              <input
                id="confirmation" type="password" required minLength={8} autoComplete="new-password"
                value={confirmation} onChange={(e) => setConfirmation(e.target.value)}
              />
            </div>
            <button type="submit" disabled={envoi} style={{ width: '100%' }}>
              {envoi ? 'Enregistrement…' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        </section>

        <p className="help-text" style={{ maxWidth: 420 }}>
          Mot de passe oublié et déconnecté ? <Link href="/pro/mot-de-passe-oublie">Faites une demande de réinitialisation</Link>.
        </p>
      </main>
    </div>
  );
}
