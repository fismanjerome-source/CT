'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { useRouter } from 'next/navigation';
import AlertePaiements from '../../components/AlertePaiements';

export default function AdminSecuritePage() {
  const router = useRouter();

  const [statut, setStatut] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [nouveauNom, setNouveauNom] = useState('');
  const [nouvelEmail, setNouvelEmail] = useState('');
  const [motDePasseNouveauCompte, setMotDePasseNouveauCompte] = useState('');
  const [envoiNouveauCompte, setEnvoiNouveauCompte] = useState(false);
  const [messageNouveauCompte, setMessageNouveauCompte] = useState(null);
  const [message, setMessage] = useState(null);

  const [setupEnCours, setSetupEnCours] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);
  const [secret, setSecret] = useState(null);
  const [codeConfirmation, setCodeConfirmation] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const [motDePasseDesactivation, setMotDePasseDesactivation] = useState('');

  const [ancienMdp, setAncienMdp] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmationMdp, setConfirmationMdp] = useState('');
  const [envoiMdp, setEnvoiMdp] = useState(false);
  const [messageMdp, setMessageMdp] = useState(null);

  async function charger() {
    try {
      const res = await fetch('/api/admin/securite');
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); return; }
      setStatut(data);
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    }
  }

  useEffect(() => { charger(); }, []);

  async function demarrerActivation() {
    setEnvoi(true);
    setErreur(null);
    try {
      const res = await fetch('/api/admin/securite/generer', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); return; }
      setQrUrl(data.qr_url);
      setSecret(data.secret);
      setSetupEnCours(true);
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    } finally {
      setEnvoi(false);
    }
  }

  async function confirmerActivation(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const res = await fetch('/api/admin/securite/confirmer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeConfirmation }),
      });
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); setEnvoi(false); return; }
      setMessage({ type: 'success', text: data.message });
      setSetupEnCours(false);
      setCodeConfirmation('');
      charger();
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    } finally {
      setEnvoi(false);
    }
  }

  async function desactiver(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const res = await fetch('/api/admin/securite/desactiver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: motDePasseDesactivation }),
      });
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); setEnvoi(false); return; }
      setMessage({ type: 'success', text: data.message });
      setMotDePasseDesactivation('');
      charger();
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    } finally {
      setEnvoi(false);
    }
  }

  async function changerMotDePasse(e) {
    e.preventDefault();
    setMessageMdp(null);
    if (nouveauMdp !== confirmationMdp) {
      setMessageMdp({ type: 'error', text: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }
    setEnvoiMdp(true);
    try {
      const res = await fetch('/api/admin/mot-de-passe', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mot_de_passe_actuel: ancienMdp, nouveau_mot_de_passe: nouveauMdp }),
      });
      const data = await res.json();
      if (!res.ok) { setMessageMdp({ type: 'error', text: data.erreur }); setEnvoiMdp(false); return; }
      setMessageMdp({ type: 'success', text: data.message });
      setAncienMdp(''); setNouveauMdp(''); setConfirmationMdp('');
    } catch {
      setMessageMdp({ type: 'error', text: 'Erreur réseau. Réessayez.' });
    } finally {
      setEnvoiMdp(false);
    }
  }

  return (
    <div className="pro-shell">
      <AdminSidebar />

      <main className="pro-main">
        <h1>Sécurité de mon compte</h1>
        <AlertePaiements />

        {erreur && <div className="message-banner error" style={{ marginTop: 16 }}>{erreur}</div>}
        {message && <div className={`message-banner ${message.type}`} style={{ marginTop: 16 }}>{message.text}</div>}

        {statut && (
          <p className="help-text" style={{ marginTop: 12 }}>
            Connecté en tant que <strong>{statut.nom}</strong> ({statut.email}).
          </p>
        )}

        <section className="card" style={{ marginTop: 20, maxWidth: 460 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>Double authentification</h2></div>
          <p className="help-text">
            Ajoute un code à 6 chiffres (généré par une application comme Google Authenticator) en plus de votre
            mot de passe — fortement recommandé pour un espace donnant accès aux commissions de tous les centres.
          </p>

          {!statut ? (
            <p className="help-text">Chargement…</p>
          ) : statut.totp_actif ? (
            <>
              <div className="message-banner success">✅ Double authentification activée sur ce compte.</div>
              <form onSubmit={desactiver} style={{ marginTop: 12 }}>
                <div className="form-row">
                  <label htmlFor="mdp_desactivation">Mot de passe (pour désactiver)</label>
                  <input
                    id="mdp_desactivation" type="password" required
                    value={motDePasseDesactivation} onChange={(e) => setMotDePasseDesactivation(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-danger" disabled={envoi}>
                  {envoi ? 'Désactivation…' : 'Désactiver la double authentification'}
                </button>
              </form>
            </>
          ) : !setupEnCours ? (
            <button type="button" onClick={demarrerActivation} disabled={envoi}>
              {envoi ? 'Préparation…' : 'Activer la double authentification'}
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
              <form onSubmit={confirmerActivation}>
                <div className="form-row">
                  <label htmlFor="code_confirmation">2. Entrez le code affiché pour confirmer</label>
                  <input
                    id="code_confirmation" type="text" inputMode="numeric" maxLength={6} required
                    value={codeConfirmation} onChange={(e) => setCodeConfirmation(e.target.value.replace(/\D/g, ''))}
                    style={{ fontSize: '1.2rem', letterSpacing: '0.3em', textAlign: 'center' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" disabled={envoi}>{envoi ? 'Vérification…' : 'Confirmer et activer'}</button>
                  <button type="button" className="btn-secondary" onClick={() => setSetupEnCours(false)}>Annuler</button>
                </div>
              </form>
            </div>
          )}
        </section>

        <section className="card" style={{ marginTop: 20, maxWidth: 460 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>Changer mon mot de passe</h2></div>
          {messageMdp && <div className={`message-banner ${messageMdp.type}`}>{messageMdp.text}</div>}
          <form onSubmit={changerMotDePasse}>
            <div className="form-row">
              <label htmlFor="ancien_mdp">Mot de passe actuel</label>
              <input id="ancien_mdp" type="password" required value={ancienMdp} onChange={(e) => setAncienMdp(e.target.value)} autoComplete="current-password" />
            </div>
            <div className="form-row">
              <label htmlFor="nouveau_mdp">Nouveau mot de passe</label>
              <input id="nouveau_mdp" type="password" required minLength={8} value={nouveauMdp} onChange={(e) => setNouveauMdp(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="form-row">
              <label htmlFor="confirmation_mdp">Confirmer le nouveau mot de passe</label>
              <input id="confirmation_mdp" type="password" required minLength={8} value={confirmationMdp} onChange={(e) => setConfirmationMdp(e.target.value)} autoComplete="new-password" />
            </div>
            <button type="submit" disabled={envoiMdp} style={{ width: '100%' }}>
              {envoiMdp ? 'Enregistrement…' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        </section>

        <section className="card" style={{ marginTop: 20, maxWidth: 460 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>Ajouter un administrateur</h2></div>
          <p className="help-text">
            Utile pour donner accès à un tiers de confiance (expert-comptable, associé...) avec son propre compte
            nominatif, plutôt que de partager le vôtre.
          </p>
          {messageNouveauCompte && <div className={`message-banner ${messageNouveauCompte.type}`}>{messageNouveauCompte.text}</div>}
          <form onSubmit={async (e) => {
            e.preventDefault();
            setEnvoiNouveauCompte(true);
            setMessageNouveauCompte(null);
            try {
              const res = await fetch('/api/admin/creer-compte', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nom: nouveauNom, email: nouvelEmail, password: motDePasseNouveauCompte }),
              });
              const data = await res.json();
              if (!res.ok) { setMessageNouveauCompte({ type: 'error', text: data.erreur }); setEnvoiNouveauCompte(false); return; }
              setMessageNouveauCompte({ type: 'success', text: `Compte créé pour ${nouveauNom}.` });
              setNouveauNom(''); setNouvelEmail(''); setMotDePasseNouveauCompte('');
            } catch {
              setMessageNouveauCompte({ type: 'error', text: 'Erreur réseau. Réessayez.' });
            } finally {
              setEnvoiNouveauCompte(false);
            }
          }}>
            <div className="form-row">
              <label htmlFor="nouveau_nom">Nom</label>
              <input id="nouveau_nom" type="text" required value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)} />
            </div>
            <div className="form-row">
              <label htmlFor="nouvel_email">Email</label>
              <input id="nouvel_email" type="email" required value={nouvelEmail} onChange={(e) => setNouvelEmail(e.target.value)} />
            </div>
            <div className="form-row">
              <label htmlFor="mdp_nouveau_compte">Mot de passe initial (à faire changer ensuite)</label>
              <input id="mdp_nouveau_compte" type="password" required minLength={8} value={motDePasseNouveauCompte} onChange={(e) => setMotDePasseNouveauCompte(e.target.value)} />
            </div>
            <button type="submit" disabled={envoiNouveauCompte} style={{ width: '100%' }}>
              {envoiNouveauCompte ? 'Création…' : 'Créer le compte'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
