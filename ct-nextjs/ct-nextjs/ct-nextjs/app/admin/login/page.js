'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '../../components/Logo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [etape, setEtape] = useState('identifiants'); // 'identifiants' | 'code'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [jeton, setJeton] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  async function handleIdentifiants(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); setEnvoi(false); return; }
      if (data.besoin_code) {
        setJeton(data.jeton);
        setEtape('code');
        setEnvoi(false);
        return;
      }
      router.push('/admin/dashboard');
    } catch {
      setErreur('Erreur réseau. Réessayez.');
      setEnvoi(false);
    }
  }

  async function handleCode(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const res = await fetch('/api/admin/login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jeton, code }),
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
          Accès réservé aux propriétaires de la plateforme — suivi des commissions dues par les centres.
        </p>

        {erreur && <div className="message-banner error">{erreur}</div>}

        {etape === 'identifiants' ? (
          <form onSubmit={handleIdentifiants}>
            <div className="form-row">
              <label htmlFor="email">Email</label>
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
        ) : (
          <form onSubmit={handleCode}>
            <p className="help-text" style={{ marginTop: -8, marginBottom: 14 }}>
              Ouvrez votre application d'authentification (Google Authenticator ou équivalent) et saisissez le
              code à 6 chiffres affiché.
            </p>
            <div className="form-row">
              <label htmlFor="code">Code à 6 chiffres</label>
              <input
                id="code" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                autoComplete="one-time-code" style={{ fontSize: '1.3rem', letterSpacing: '0.3em', textAlign: 'center' }}
                autoFocus
              />
            </div>
            <button type="submit" style={{ width: '100%', marginTop: 6 }} disabled={envoi}>
              {envoi ? 'Vérification…' : 'Valider'}
            </button>
            <button type="button" className="btn-secondary" style={{ width: '100%', marginTop: 8 }} onClick={() => { setEtape('identifiants'); setCode(''); setErreur(null); }}>
              ← Retour
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
