'use client';

import { useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';

function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default function SuiviPage() {
  const [reference, setReference] = useState('');
  const [email, setEmail] = useState('');
  const [rdv, setRdv] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState(false);
  const [message, setMessage] = useState(null);

  const [modeModification, setModeModification] = useState(false);
  const [dateModif, setDateModif] = useState(todayISO());
  const [creneauxModif, setCreneauxModif] = useState(null);
  const [chargementCreneaux, setChargementCreneaux] = useState(false);
  const [envoiModif, setEnvoiModif] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setRecherche(true);
    setErreur(null);
    setRdv(null);
    setMessage(null);
    setModeModification(false);
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
      setMessage({ type: 'success', text: data.message });
      setRdv({ ...rdv, statut: 'annule' });
    } else {
      setErreur(data.erreur);
    }
  }

  async function ouvrirModification() {
    setModeModification(true);
    setMessage(null);
    setDateModif(todayISO());
    chargerCreneauxModif(todayISO());
  }

  async function chargerCreneauxModif(date) {
    setDateModif(date);
    setChargementCreneaux(true);
    try {
      const params = new URLSearchParams({ date });
      if (rdv.type_vehicule) params.set('type_vehicule', rdv.type_vehicule);
      const res = await fetch(`/api/centres/${rdv.centre_id}/creneaux?${params.toString()}`);
      const data = await res.json();
      setCreneauxModif(data.creneaux);
    } catch {
      setCreneauxModif([]);
    } finally {
      setChargementCreneaux(false);
    }
  }

  async function confirmerModification(creneauId) {
    if (!confirm('Confirmer le changement vers ce nouveau créneau ?')) return;
    setEnvoiModif(true);
    setErreur(null);
    try {
      const res = await fetch(`/api/rdv/${encodeURIComponent(rdv.reference)}/modifier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), nouveau_creneau_id: creneauId }),
      });
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); setEnvoiModif(false); return; }
      setMessage({ type: 'success', text: 'Votre rendez-vous a bien été modifié. Un nouvel email de confirmation vient de vous être envoyé.' });
      setRdv({ ...rdv, date: data.rdv.date, heure: data.rdv.heure });
      setModeModification(false);
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    } finally {
      setEnvoiModif(false);
    }
  }

  const mapsUrl = rdv
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${rdv.adresse}, ${rdv.ville}`)}`
    : '';

  return (
    <>
      <Header />

      <section className="hero">
        <div className="container">
          <div className="eyebrow">🔎 Espace client</div>
          <h1>Retrouvez votre rendez-vous</h1>
          <p className="lead">
            Renseignez votre référence de réservation (format CT-XXXXXX) et l'email utilisé lors de la prise de
            rendez-vous — vous pourrez consulter, modifier ou annuler votre créneau en quelques secondes.
          </p>

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

      <section className="container" style={{ padding: '32px 24px 64px', maxWidth: 620 }}>
        {erreur && <div className="message-banner error">{erreur}</div>}
        {message && <div className={`message-banner ${message.type}`}>{message.text}</div>}

        {rdv && (
          <div className="rdv-carte">
            <div className="rdv-carte-header">
              <div>
                <p className="eyebrow" style={{ marginBottom: 4 }}>Votre rendez-vous</p>
                <h2 style={{ margin: 0 }}>{rdv.centre_nom}</h2>
              </div>
              <span className={`badge ${rdv.statut === 'annule' ? 'reserve' : 'disponible'}`}>
                {rdv.statut === 'annule' ? 'Annulé' : 'Confirmé'}
              </span>
            </div>

            <div className="rdv-carte-heure">
              <span className="rdv-carte-date">
                {new Date(rdv.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <span className="rdv-carte-time">{rdv.heure}</span>
            </div>

            <p className="help-text" style={{ margin: '4px 0 2px' }}>
              {rdv.adresse}, {rdv.ville}
              {' · '}
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="maps-link">Voir sur Google Maps</a>
            </p>
            <p className="mono help-text">Référence : {rdv.reference} · Immatriculation : {rdv.immatriculation}</p>

            {rdv.statut !== 'annule' && (
              <div className="guide-card accent-danger" style={{ marginTop: 16 }}>
                ⚠️ Arrivez <strong>10 minutes avant l'heure</strong> — tout retard peut entraîner un refus de
                prise en charge par le centre.<br />
                📄 N'oubliez pas votre <strong>carte grise</strong> (certificat d'immatriculation) : le contrôle
                ne peut pas être réalisé sans ce document.
              </div>
            )}

            {rdv.statut !== 'annule' && !modeModification && (
              <div className="modal-actions" style={{ justifyContent: 'flex-start', marginTop: 18 }}>
                <button type="button" onClick={ouvrirModification}>Modifier mon RDV</button>
                <button type="button" className="btn-danger" onClick={annuler}>Supprimer mon RDV</button>
              </div>
            )}

            {modeModification && (
              <div style={{ marginTop: 20, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                <h3 style={{ marginBottom: 10 }}>Choisir un nouveau créneau</h3>
                <div className="day-picker">
                  {Array.from({ length: 14 }, (_, i) => todayISO(i)).map((d) => {
                    const date = new Date(d + 'T00:00:00');
                    return (
                      <div
                        key={d}
                        className={`day-chip ${d === dateModif ? 'selected' : ''}`}
                        onClick={() => chargerCreneauxModif(d)}
                      >
                        <span className="dow">{date.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                        <span className="num">{date.getDate()}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="slots-grid">
                  {chargementCreneaux ? (
                    <p className="help-text">Chargement…</p>
                  ) : !creneauxModif || creneauxModif.length === 0 ? (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>Aucun créneau disponible ce jour-là.</div>
                  ) : (
                    creneauxModif.map((c) => (
                      <button key={c.id} className="slot-btn" disabled={envoiModif} onClick={() => confirmerModification(c.id)}>
                        <span className="slot-heure">{c.heure}</span>
                      </button>
                    ))
                  )}
                </div>
                <button type="button" className="btn-secondary" onClick={() => setModeModification(false)}>Annuler la modification</button>
              </div>
            )}
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
