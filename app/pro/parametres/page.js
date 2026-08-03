'use client';

import { useState, useEffect } from 'react';
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

  const [statutTotp, setStatutTotp] = useState(null);
  const [setupEnCours, setSetupEnCours] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);
  const [secret, setSecret] = useState(null);
  const [codeConfirmation, setCodeConfirmation] = useState('');
  const [envoiTotp, setEnvoiTotp] = useState(false);
  const [motDePasseDesactivation, setMotDePasseDesactivation] = useState('');
  const [messageTotp, setMessageTotp] = useState(null);
  const [erreurTotp, setErreurTotp] = useState(null);

  useEffect(() => {
    async function chargerStatutTotp() {
      try {
        const res = await fetch('/api/pro/securite');
        if (res.status === 401) return;
        const data = await res.json();
        if (res.ok) setStatutTotp(data);
      } catch {
        // Pas grave, l'utilisateur peut recharger la page.
      }
    }
    chargerStatutTotp();
  }, []);

  async function demarrerActivationTotp() {
    setEnvoiTotp(true);
    setErreurTotp(null);
    try {
      const res = await fetch('/api/pro/securite/generer', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setErreurTotp(data.erreur); return; }
      setQrUrl(data.qr_url);
      setSecret(data.secret);
      setSetupEnCours(true);
    } catch {
      setErreurTotp('Erreur réseau. Réessayez.');
    } finally {
      setEnvoiTotp(false);
    }
  }

  async function confirmerActivationTotp(e) {
    e.preventDefault();
    setEnvoiTotp(true);
    setErreurTotp(null);
    try {
      const res = await fetch('/api/pro/securite/confirmer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeConfirmation }),
      });
      const data = await res.json();
      if (!res.ok) { setErreurTotp(data.erreur); setEnvoiTotp(false); return; }
      setMessageTotp({ type: 'success', text: data.message });
      setSetupEnCours(false);
      setCodeConfirmation('');
      const res2 = await fetch('/api/pro/securite');
      setStatutTotp(await res2.json());
    } catch {
      setErreurTotp('Erreur réseau. Réessayez.');
    } finally {
      setEnvoiTotp(false);
    }
  }

  async function desactiverTotp(e) {
    e.preventDefault();
    setEnvoiTotp(true);
    setErreurTotp(null);
    try {
      const res = await fetch('/api/pro/securite/desactiver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: motDePasseDesactivation }),
      });
      const data = await res.json();
      if (!res.ok) { setErreurTotp(data.erreur); setEnvoiTotp(false); return; }
      setMessageTotp({ type: 'success', text: data.message });
      setMotDePasseDesactivation('');
      const res2 = await fetch('/api/pro/securite');
      setStatutTotp(await res2.json());
    } catch {
      setErreurTotp('Erreur réseau. Réessayez.');
    } finally {
      setEnvoiTotp(false);
    }
  }

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

        <section className="card" style={{ marginTop: 20, maxWidth: 460 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>🔐 Double authentification</h2></div>
          <p className="help-text">
            Ajoute un code à 6 chiffres (généré par une application comme Google Authenticator) en plus de votre
            mot de passe — un vrai plus de sécurité, notamment si le service informatique de votre centre le
            demande.
          </p>

          {erreurTotp && <div className="message-banner error">{erreurTotp}</div>}
          {messageTotp && <div className={`message-banner ${messageTotp.type}`}>{messageTotp.text}</div>}

          {!statutTotp ? (
            <p className="help-text">Chargement…</p>
          ) : statutTotp.totp_actif ? (
            <>
              <div className="message-banner success">✅ Double authentification activée sur ce compte.</div>
              <form onSubmit={desactiverTotp} style={{ marginTop: 12 }}>
                <div className="form-row">
                  <label htmlFor="mdp_desactivation">Mot de passe (pour désactiver)</label>
                  <input
                    id="mdp_desactivation" type="password" required
                    value={motDePasseDesactivation} onChange={(e) => setMotDePasseDesactivation(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-danger" disabled={envoiTotp}>
                  {envoiTotp ? 'Désactivation…' : 'Désactiver la double authentification'}
                </button>
              </form>
            </>
          ) : !setupEnCours ? (
            <button type="button" onClick={demarrerActivationTotp} disabled={envoiTotp}>
              {envoiTotp ? 'Préparation…' : 'Activer la double authentification'}
            </button>
          ) : (
            <div>
              <p style={{ marginBottom: 10 }}>
                1. Scannez ce QR code avec Google Authenticator (ou une application équivalente) :
              </p>
              {qrUrl && <img src={qrUrl} alt="QR code de double authentification" style={{ display: 'block', marginBottom: 12 }} />}
              <p className="help-text" style={{ marginBottom: 12 }}>
                Impossible de scanner ? Entrez ce code manuellement dans l'application : <span className="mono">{secret}</span>
              </p>
              <form onSubmit={confirmerActivationTotp}>
                <div className="form-row">
                  <label htmlFor="code_confirmation">2. Entrez le code affiché pour confirmer</label>
                  <input
                    id="code_confirmation" type="text" inputMode="numeric" maxLength={6} required
                    value={codeConfirmation} onChange={(e) => setCodeConfirmation(e.target.value.replace(/\D/g, ''))}
                    style={{ fontSize: '1.2rem', letterSpacing: '0.3em', textAlign: 'center' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" disabled={envoiTotp}>{envoiTotp ? 'Vérification…' : 'Confirmer et activer'}</button>
                  <button type="button" className="btn-secondary" onClick={() => setSetupEnCours(false)}>Annuler</button>
                </div>
              </form>
            </div>
          )}
        </section>

        <p className="help-text" style={{ maxWidth: 420 }}>
          Mot de passe oublié et déconnecté ? <Link href="/pro/mot-de-passe-oublie">Faites une demande de réinitialisation</Link>.
        </p>

        <p className="help-text" style={{ maxWidth: 420 }}>
          Pour toute question, contactez Créneau CT : <Link href="/pro/contact">accédez au formulaire de contact</Link>.
        </p>

        <p className="help-text" style={{ maxWidth: 420 }}>
          Consultez à tout moment nos <Link href="/cgu" target="_blank" rel="noopener noreferrer">Conditions Générales d'Utilisation (CGU)</Link>.
        </p>

        <section className="card" style={{ marginTop: 20, maxWidth: 460 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>📱 Installer l'application sur votre téléphone</h2></div>
          <p className="help-text">
            Créneau CT peut s'installer comme une vraie application, avec sa propre icône sur votre écran d'accueil
            — pratique pour y accéder en un geste, sans passer par un navigateur.
          </p>
          <p style={{ marginBottom: 6 }}><strong>Sur iPhone / iPad (Safari uniquement)</strong></p>
          <ol style={{ marginTop: 0, paddingLeft: 20, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            <li>Ouvrez ce site dans <strong>Safari</strong> (Chrome ne le permet pas sur iPhone)</li>
            <li>Appuyez sur le bouton Partager (le carré avec une flèche vers le haut)</li>
            <li>Choisissez « Sur l'écran d'accueil », puis « Ajouter »</li>
          </ol>
          <p style={{ marginBottom: 6 }}><strong>Sur Android</strong></p>
          <ol style={{ marginTop: 0, paddingLeft: 20, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            <li>Une bannière « Installer l'application » apparaît généralement automatiquement</li>
            <li>À défaut, menu ⋮ de Chrome → « Installer l'application »</li>
          </ol>
        </section>

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
