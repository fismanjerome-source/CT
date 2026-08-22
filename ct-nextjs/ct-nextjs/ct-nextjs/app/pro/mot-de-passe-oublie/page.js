'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from '../../components/Logo';

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState(null);
  const [erreur, setErreur] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const res = await fetch('/api/pro/mot-de-passe-oublie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); setEnvoi(false); return; }
      setSucces(data.message);
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
          Mot de passe oublié
        </div>

        {succes ? (
          <div className="confirmation-box">
            <h2 style={{ color: 'var(--color-success)' }}>Demande envoyée</h2>
            <p>{succes}</p>
          </div>
        ) : (
          <>
            <p className="help-text" style={{ marginBottom: 20 }}>
              Indiquez l'email de votre compte. Notre équipe vous recontacte rapidement (par téléphone ou email)
              pour vous communiquer un nouveau mot de passe.
            </p>

            {erreur && <div className="message-banner error">{erreur}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label htmlFor="email">Email du compte</label>
                <input id="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button type="submit" style={{ width: '100%', marginTop: 6 }} disabled={envoi}>
                {envoi ? 'Envoi…' : 'Envoyer la demande'}
              </button>
            </form>
          </>
        )}

        <p className="help-text" style={{ marginTop: 20 }}><Link href="/pro/login">← Retour à la connexion</Link></p>
      </div>
    </div>
  );
}
