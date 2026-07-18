'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from './components/Logo';

function formatDateCourte(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function HomePage() {
  const [ville, setVille] = useState('');
  const [cp, setCp] = useState('');
  const [centres, setCentres] = useState(null); // null = chargement initial
  const [totalRdv, setTotalRdv] = useState(null);

  useEffect(() => {
    fetch('/api/stats').then((r) => r.json()).then((d) => setTotalRdv(d.total_rdv)).catch(() => {});
  }, []);

  const rechercher = useCallback(async (villeQ = '', cpQ = '') => {
    const params = new URLSearchParams();
    if (villeQ) params.set('ville', villeQ);
    if (cpQ) params.set('cp', cpQ);
    try {
      const res = await fetch(`/api/centres?${params.toString()}`);
      const data = await res.json();
      setCentres(data.centres);
    } catch {
      setCentres([]);
    }
  }, []);

  useEffect(() => { rechercher(); }, [rechercher]);

  function handleSubmit(e) {
    e.preventDefault();
    rechercher(ville.trim(), cp.trim());
  }

  return (
    <>
      <header className="site-header">
        <div className="container">
          <Link href="/" className="brand">
            <Logo />
            Créneau CT
          </Link>
          <nav>
            <Link href="/suivi">Suivre un RDV</Link>
            <Link href="/pro/login">Espace professionnel</Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <div className="eyebrow">Réservation en ligne</div>
          <h1>Trouvez votre créneau de contrôle technique, à votre convenance, en toute simplicité</h1>
          <p className="lead">
            Créneau CT vous permet de réserver facilement votre contrôle technique, où et quand
            ça vous arrange — y compris les disponibilités de dernière minute près de chez vous.
          </p>

          <form className="search-box" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="ville">Ville</label>
              <input id="ville" type="text" value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Paris, Montreuil..." />
            </div>
            <div className="field">
              <label htmlFor="cp">Code postal</label>
              <input id="cp" type="text" value={cp} onChange={(e) => setCp(e.target.value)} placeholder="75011" maxLength={5} />
            </div>
            <div className="field" style={{ flex: 0, alignSelf: 'flex-end' }}>
              <button type="submit">Rechercher</button>
            </div>
          </form>

          {totalRdv > 0 && (
            <p className="help-text" style={{ marginTop: 14 }}>
              <span className="mono" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                {totalRdv.toLocaleString('fr-FR')}
              </span>{' '}
              contrôle{totalRdv > 1 ? 's' : ''} technique{totalRdv > 1 ? 's' : ''} déjà réservé{totalRdv > 1 ? 's' : ''} via Créneau CT
            </p>
          )}
        </div>
      </section>

      <section className="results">
        <div className="container">
          {centres === null ? (
            <p className="help-text">Recherche en cours…</p>
          ) : (
            <>
              <div className="results-count">
                {centres.length} centre{centres.length > 1 ? 's' : ''} trouvé{centres.length > 1 ? 's' : ''}
              </div>
              {centres.length === 0 ? (
                <div className="empty-state">
                  <h3>Aucun centre trouvé</h3>
                  <p>Essayez une autre ville ou un autre code postal.</p>
                </div>
              ) : (
                centres.map((c) => <CentreCard key={c.id} centre={c} />)
              )}
            </>
          )}
        </div>
      </section>

      <footer className="site-footer">
        <div className="container">
          Plateforme indépendante de mise en relation pour rendez-vous de contrôle technique.
        </div>
      </footer>
    </>
  );
}

function CentreCard({ centre }) {
  const router = useRouter();
  const vide = centre.creneaux_disponibles_7j === 0;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${centre.adresse}, ${centre.code_postal} ${centre.ville}`
  )}`;

  return (
    <div
      className="centre-card"
      style={{ cursor: 'pointer' }}
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/centre/${centre.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/centre/${centre.id}`); }}
    >
      <div className="infos">
        <div className="centre-title-row">
          <h3 style={{ margin: 0 }}>{centre.nom}</h3>
          <span className={`enseigne-badge ${centre.enseigne ? '' : 'independant'}`}>
            {centre.enseigne || 'Centre indépendant'}
          </span>
        </div>
        <div className="adresse">
          {centre.adresse}, {centre.code_postal} {centre.ville}
          {' · '}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="maps-link" onClick={(e) => e.stopPropagation()}>
            Voir sur Google Maps
          </a>
        </div>
        {centre.telephone && <div className="tel">{centre.telephone}</div>}
        <p className="help-text" style={{ marginTop: 8 }}>
          {centre.prochain_creneau
            ? `Prochain créneau : ${formatDateCourte(centre.prochain_creneau.date)} à ${centre.prochain_creneau.heure}`
            : 'Aucun créneau dans les 7 prochains jours'}
        </p>
      </div>
      <div className={`stamp ${vide ? 'vide' : ''}`}>
        <span className="n">{centre.creneaux_disponibles_7j}</span>
        <span className="label">créneaux<br />sous 7 jours</span>
      </div>
    </div>
  );
}
