'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '../../components/Logo';

export default function ProLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const res = await fetch('/api/pro/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); setEnvoi(false); return; }
      router.push('/pro/dashboard');
    } catch {
      setErreur('Erreur réseau. Réessayez.');
      setEnvoi(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="brand" style={{ color: 'var(--color-primary)', marginBottom: 24 }}>
          <Logo size={40} />
          Espace professionnel
        </div>
        <p className="help-text" style={{ marginBottom: 20 }}>
          Connectez-vous pour gérer vos créneaux et consulter vos rendez-vous.
        </p>

        {erreur && <div className="message-banner error">{erreur}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="email">Email professionnel</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </div>
          <div className="form-row">
            <label htmlFor="password">Mot de passe</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          <button type="submit" style={{ width: '100%', marginTop: 6 }} disabled={envoi}>
            {envoi ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="help-text" style={{ marginTop: 20 }}>
          Compte de démonstration : <span className="mono">karim@autosecurite-bastille.fr</span> / <span className="mono">demo1234</span>
        </p>
        <p className="help-text">Pas encore de compte ? <Link href="/pro/register">Créez votre compte centre</Link></p>
        <p className="help-text"><Link href="/">← Retour au site public</Link></p>
      </div>
    </div>
  );
}
