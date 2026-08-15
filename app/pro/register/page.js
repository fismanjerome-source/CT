'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/Logo';

export default function ProRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '', password: '', confirmation: '', nom: '',
    nom_centre: '', adresse: '', code_postal: '', ville: '', telephone: '', code_parrainage: '',
  });
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [cguAcceptees, setCguAcceptees] = useState(false);

  function champ(id, patch = {}) {
    return {
      id,
      value: form[id],
      onChange: (e) => setForm({ ...form, [id]: e.target.value }),
      ...patch,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur(null);

    if (form.password !== form.confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setEnvoi(true);
    try {
      const res = await fetch('/api/pro/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cgu_acceptees: cguAcceptees }),
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
      <div className="login-card" style={{ maxWidth: 460 }}>
        <div className="brand" style={{ color: 'var(--color-primary)', marginBottom: 24 }}>
          <Logo size={40} />
          Créer mon compte centre
        </div>
        <p className="help-text" style={{ marginBottom: 20 }}>
          Aucun abonnement, aucun engagement — vous pourrez gérer vos créneaux dès la création de votre compte.
        </p>
        <p className="help-text" style={{ marginBottom: 20 }}>
          📱 Ordinateur, smartphone ou tablette : votre espace vous suit partout, sans rien installer.
        </p>

        {erreur && <div className="message-banner error">{erreur}</div>}

        <form onSubmit={handleSubmit}>
          <p className="eyebrow" style={{ marginBottom: 8 }}>Votre compte</p>
          <div className="form-row">
            <label htmlFor="nom">Votre nom</label>
            <input type="text" required autoComplete="name" {...champ('nom')} />
          </div>
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input type="email" required autoComplete="username" {...champ('email')} />
          </div>
          <div className="grid-2">
            <div className="form-row">
              <label htmlFor="password">Mot de passe</label>
              <input type="password" required minLength={8} autoComplete="new-password" {...champ('password')} />
            </div>
            <div className="form-row">
              <label htmlFor="confirmation">Confirmer</label>
              <input type="password" required minLength={8} autoComplete="new-password" {...champ('confirmation')} />
            </div>
          </div>
          <div className="form-row">
            <label htmlFor="telephone">Téléphone (optionnel)</label>
            <input type="tel" autoComplete="tel" {...champ('telephone')} />
          </div>

          <p className="eyebrow" style={{ marginTop: 16, marginBottom: 8 }}>Votre premier centre</p>
          <p className="help-text" style={{ marginTop: -4, marginBottom: 10 }}>
            Vous pourrez en ajouter d'autres ensuite depuis votre tableau de bord.
          </p>
          <div className="form-row">
            <label htmlFor="nom_centre">Nom du centre</label>
            <input type="text" required {...champ('nom_centre')} />
          </div>
          <div className="form-row">
            <label htmlFor="adresse">Adresse</label>
            <input type="text" required {...champ('adresse')} />
          </div>
          <div className="grid-2">
            <div className="form-row">
              <label htmlFor="code_postal">Code postal</label>
              <input type="text" required maxLength={5} {...champ('code_postal')} />
            </div>
            <div className="form-row">
              <label htmlFor="ville">Ville</label>
              <input type="text" required {...champ('ville')} />
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="code_parrainage">Code de parrainage (optionnel)</label>
            <input
              id="code_parrainage" type="text" placeholder="ex : BASTIL4"
              value={form.code_parrainage}
              onChange={(e) => setForm({ ...form, code_parrainage: e.target.value.toUpperCase() })}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 16, fontSize: '0.88rem' }}>
            <input
              type="checkbox"
              required
              checked={cguAcceptees}
              onChange={(e) => setCguAcceptees(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <span>
              J'ai lu et j'accepte les{' '}
              <Link href="/cgu" target="_blank" rel="noopener noreferrer">Conditions Générales d'Utilisation (CGU)</Link> de Créneau CT.
            </span>
          </label>

          <button type="submit" style={{ width: '100%', marginTop: 10 }} disabled={envoi}>
            {envoi ? 'Création du compte…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="help-text" style={{ marginTop: 20 }}>
          Déjà un compte ? <Link href="/pro/login">Connectez-vous</Link>
        </p>
        <p className="help-text"><Link href="/">← Retour au site public</Link></p>
      </div>
    </div>
  );
}
