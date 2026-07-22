'use client';

import { useState } from 'react';
import ProSidebar from '../../components/ProSidebar';
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

  const [zoneDangerOuverte, setZoneDangerOuverte] = useState(false);
  const [mdpSuppression, setMdpSuppression] = useState('');
  const [confirmationSuppression, setConfirmationSuppression] = useState('');
  const [erreurSuppression, setErreurSuppression] = useState(null);
  const [envoiSuppression, setEnvoiSuppression] = useState(false);

  async function handleSupprimerCompte(e) {
    e.preventDefault();
    setErreurSuppression(null);
    if (!confirm('Cette action est définitive : vos informations personnelles seront supprimées et vous ne pourrez plus vous reconnecter. Confirmez-vous ?')) {
      return;
    }
    setEnvoiSuppression(true);
    try {
      const res = await fetch('/api/pro/supprimer-compte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: mdpSuppression, confirmation: confirmationSuppression }),
      });
      const data = await res.json();
      if (!res.ok) { setErreurSuppression(data.erreur); setEnvoiSuppression(false); return; }
      router.push('/');
    } catch {
      setErreurSuppression('Erreur réseau. Réessayez.');
      setEnvoiSuppression(false);
    }
  }

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
      <ProSidebar />

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

        <p style={{ maxWidth: 420, marginTop: 40 }}>
          <button
            type="button"
            onClick={() => setZoneDangerOuverte(!zoneDangerOuverte)}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
          >
            Options avancées
          </button>
        </p>

        {zoneDangerOuverte && (
          <section className="card" style={{ marginTop: 8, maxWidth: 420, borderColor: 'var(--color-danger)' }}>
            <div className="card-header"><h2 style={{ margin: 0, fontSize: '1rem' }}>Supprimer mon compte Créneau CT</h2></div>
            <p className="help-text">
              Conformément au RGPD, vous pouvez demander la suppression de vos données personnelles à tout moment.
              Votre nom, email et téléphone seront définitivement effacés et vous ne pourrez plus vous connecter.
              Par obligation comptable, l'historique des rendez-vous déjà honorés (nécessaire aux factures déjà
              émises) est conservé de façon anonyme, sans donnée vous identifiant.
            </p>
            {erreurSuppression && <div className="message-banner error">{erreurSuppression}</div>}
            <form onSubmit={handleSupprimerCompte}>
              <div className="form-row">
                <label htmlFor="mdp_suppression">Mot de passe actuel</label>
                <input id="mdp_suppression" type="password" required value={mdpSuppression} onChange={(e) => setMdpSuppression(e.target.value)} />
              </div>
              <div className="form-row">
                <label htmlFor="confirmation_suppression">Tapez SUPPRIMER pour confirmer</label>
                <input id="confirmation_suppression" type="text" required value={confirmationSuppression} onChange={(e) => setConfirmationSuppression(e.target.value)} />
              </div>
              <button type="submit" className="btn-danger" disabled={envoiSuppression} style={{ width: '100%' }}>
                {envoiSuppression ? 'Suppression…' : 'Supprimer définitivement mon compte'}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
