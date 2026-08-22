'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function AvisPage({ params }) {
  const { reference } = use(params);

  const [email, setEmail] = useState('');
  const [note, setNote] = useState(0);
  const [survolNote, setSurvolNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function envoyerAvis(e) {
    e.preventDefault();
    if (note === 0) { setErreur('Merci de choisir une note en cliquant sur les étoiles.'); return; }
    setEnvoi(true);
    setErreur(null);
    try {
      const res = await fetch('/api/avis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, email: email.trim(), note, commentaire: commentaire.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); setEnvoi(false); return; }
      setEnvoye(true);
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <Header />
      <section className="container" style={{ padding: '40px 24px 64px', maxWidth: 520 }}>
        <h1>Votre avis compte</h1>
        <p className="help-text" style={{ marginBottom: 24 }}>
          Référence : <span className="mono">{reference}</span>
        </p>

        {envoye ? (
          <div className="message-banner success">
            Merci pour votre avis ! Il aide les prochains automobilistes à choisir leur centre en toute confiance.
          </div>
        ) : (
          <form onSubmit={envoyerAvis}>
            <div className="form-row">
              <label htmlFor="email">Votre email (celui utilisé pour la réservation)</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="form-row">
              <label>Votre note</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNote(n)}
                    onMouseEnter={() => setSurvolNote(n)}
                    onMouseLeave={() => setSurvolNote(0)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                      fontSize: '2rem', lineHeight: 1,
                      color: n <= (survolNote || note) ? 'var(--color-accent)' : 'var(--color-border)',
                    }}
                    aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="commentaire">Un commentaire (optionnel)</label>
              <textarea
                id="commentaire" rows={4} placeholder="Votre expérience, en quelques mots..."
                value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
              />
            </div>

            {erreur && <div className="message-banner error">{erreur}</div>}

            <button type="submit" style={{ width: '100%' }} disabled={envoi}>
              {envoi ? 'Envoi…' : 'Envoyer mon avis'}
            </button>
          </form>
        )}

        <p className="help-text" style={{ marginTop: 24 }}>
          <Link href="/">← Retour à l'accueil</Link>
        </p>
      </section>
      <Footer />
    </>
  );
}
