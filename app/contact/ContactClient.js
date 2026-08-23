'use client';

import { useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function ContactClient() {
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', nom_centre: '', message: '' });
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState(null);
  const [erreur, setErreur] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
    <>
      <Header />

      <section className="hero">
        <div className="container">
          <div className="eyebrow">🤝 Devenir centre partenaire</div>
          <h1>Parlons de votre centre</h1>
          <p className="lead">
            Que vous gériez un ou plusieurs centres, décrivez-nous votre situation. Nous revenons vers vous
            rapidement pour vous présenter comment Créneau CT peut vous aider à remplir votre planning.
          </p>
        </div>
      </section>

      <section className="container" style={{ padding: '32px 24px 64px', maxWidth: 560 }}>
        {succes ? (
          <div className="confirmation-box">
            <h2 style={{ color: 'var(--color-success)' }}>Message envoyé</h2>
            <p>{succes}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card">
            {erreur && <div className="message-banner error">{erreur}</div>}
            <div className="form-row">
              <label htmlFor="nom">Votre nom</label>
              <input id="nom" type="text" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div className="form-row">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-row">
              <label htmlFor="telephone">Téléphone (optionnel)</label>
              <input id="telephone" type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>
            <div className="form-row">
              <label htmlFor="nom_centre">Nom de votre centre (optionnel)</label>
              <input id="nom_centre" type="text" value={form.nom_centre} onChange={(e) => setForm({ ...form, nom_centre: e.target.value })} />
            </div>
            <div className="form-row">
              <label htmlFor="message">Votre message</label>
              <textarea id="message" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <button type="submit" disabled={envoi} style={{ width: '100%' }}>
              {envoi ? 'Envoi…' : 'Envoyer'}
            </button>
          </form>
        )}
      </section>

      <Footer />
    </>
  );
}
