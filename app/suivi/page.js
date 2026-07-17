'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from '../components/Logo';

export default function SuiviPage() {
  const [reference, setReference] = useState('');
  const [email, setEmail] = useState('');
  const [rdv, setRdv] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState(false);
  const [messageAnnulation, setMessageAnnulation] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setRecherche(true);
    setErreur(null);
    setRdv(null);
    setMessageAnnulation(null);
    try {
      const ref = reference.trim().toUpperCase();
      const res = await fetch(`/api/rdv/${encodeURIComponent(ref)}?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); return; }
      setRdv(data.rdv);
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    } finally {
      setRecherche(false);
    }
  }

  async function annuler() {
    if (!confirm('Confirmez-vous l\'annulation de ce rendez-vous ?')) return;
    const res = await fetch(`/api/rdv/${encodeURIComponent(rdv.reference)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessageAnnulation(data.message);
      setRdv({ ...rdv, statut: 'annule' });
    } else {
      setErreur(data.erreur);
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="container">
          <Link href="/" className="brand"><Logo /> Créneau CT</Link>
          <nav><Link href="/pro/login">Espace professionnel</Link></nav>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <div className="eyebrow">Gestion de rendez-vous</div>
          <h1>Suivre ou annuler un rendez-vous</h1>
          <p className="lead">Renseignez votre référence de réservation (format CT-XXXXXX) et l'email utilisé lors de la prise de rendez-vous.</p>

          <form className="search-box" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="reference">Référence</label>
              <input id="reference" type="text" required placeholder="CT-A1B2C3" style={{ textTransform: 'uppercase' }}
                value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 0, alignSelf: 'flex-end' }}>
              <button type="submit" disabled={recherche}>{recherche ? 'Recherche…' : 'Rechercher'}</button>
            </div>
          </form>
        </div>
      </section>

      <section className="container" style={{ padding: '32px 24px 64px' }}>
        {erreur && <div className="message-banner error">{erreur}</div>}
        {messageAnnulation && <div className="message-banner success">{messageAnnulation}</div>}

        {rdv && (
          <div className="card">
            <div className="card-header">
              <h2 style={{ margin: 0 }}>{rdv.centre_nom}</h2>
              <span className={`badge ${rdv.statut === 'annule' ? 'reserve' : 'disponible'}`}>
                {rdv.statut === 'annule' ? 'Annulé' : 'Confirmé'}
              </span>
            </div>
            <p className="help-text">{rdv.adresse}, {rdv.ville}</p>
            <p>
              <strong>{new Date(rdv.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
              {' '}à <strong>{rdv.heure}</strong>
            </p>
            <p className="mono help-text">Référence : {rdv.reference} · Immatriculation : {rdv.immatriculation}</p>
            {rdv.statut !== 'annule' && (
              <button className="btn-danger" onClick={annuler}>Annuler ce rendez-vous</button>
            )}
          </div>
        )}
      </section>
    </>
  );
}
