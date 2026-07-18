'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '../../components/Logo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); setEnvoi(false); return; }
      router.push('/admin/dashboard');
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
          Espace admin
        </div>
        <p className="help-text" style={{ marginBottom: 20 }}>
          Accès réservé au propriétaire de la plateforme — suivi des commissions dues par les centres.
        </p>

        {erreur && <div className="message-banner error">{erreur}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="password">Mot de passe admin</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          <button type="submit" style={{ width: '100%', marginTop: 6 }} disabled={envoi}>
            {envoi ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
