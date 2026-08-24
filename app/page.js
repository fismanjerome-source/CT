'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from './components/Header';
import Footer from './components/Footer';
import { IconeVehicule } from './components/VehiculeIcons';
import { TYPES_VEHICULES, parseTypes } from '@/lib/vehicules';
import { couleurEnseigne } from '@/lib/enseignes';
import { PhoneIcon, MailIcon, WhatsAppIcon, SmsIcon } from './components/ContactIcons';

function formatDateCourte(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatDateLongue(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function HomePage() {
  const router = useRouter();
  const [bandeauProVisible, setBandeauProVisible] = useState(true);
  const [ville, setVille] = useState('');
  const [cp, setCp] = useState('');
  const [date, setDate] = useState('');
  const [vehicule, setVehicule] = useState('');
  const [typeVisite, setTypeVisite] = useState('normale');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionVisible, setSuggestionVisible] = useState(false);
  const dateMin = new Date().toISOString().slice(0, 10);

  const chercherCommunes = useCallback(async (texte) => {
    if (texte.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(texte)}&fields=nom,codesPostaux&limit=6&boost=population`);
      if (!res.ok) return;
      const data = await res.json();
      const liste = data.flatMap((c) => c.codesPostaux.slice(0, 1).map((code) => ({ nom: c.nom, cp: code })));
      setSuggestions(liste.slice(0, 6));
      setSuggestionVisible(true);
    } catch { /* silencieux */ }
  }, []);
  const [centres, setCentres] = useState(null); // null = chargement initial
  const [totalRdv, setTotalRdv] = useState(null);

  const [rechercheProche, setRechercheProche] = useState(false);
  const [erreurProche, setErreurProche] = useState(null);
  const [resultatProche, setResultatProche] = useState(null);

  useEffect(() => {
    fetch('/api/stats').then((r) => r.json()).then((d) => setTotalRdv(d.total_rdv)).catch(() => {});
  }, []);

  const rechercher = useCallback(async (villeQ = '', cpQ = '', dateQ = '', vehiculeQ = '', typeVisiteQ = 'normale') => {
    const params = new URLSearchParams();
    if (villeQ) params.set('ville', villeQ);
    if (cpQ) params.set('cp', cpQ);
    if (dateQ) params.set('date', dateQ);
    if (vehiculeQ) params.set('vehicule', vehiculeQ);
    if (typeVisiteQ === 'contre_visite') params.set('type_visite', 'contre_visite');
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
    setResultatProche(null);
    rechercher(ville.trim(), cp.trim(), date, vehicule, typeVisite);
  }

  function trouverProche() {
    setErreurProche(null);
    setResultatProche(null);

    if (!navigator.geolocation) {
      setErreurProche("Votre navigateur ne permet pas la géolocalisation. Essayez une recherche par ville.");
      return;
    }

    setRechercheProche(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`/api/centres/proche?lat=${latitude}&lng=${longitude}`);
          const data = await res.json();
          if (!res.ok) {
            setErreurProche(data.erreur);
            return;
          }
          setResultatProche(data);
        } catch {
          setErreurProche('Erreur réseau. Réessayez.');
        } finally {
          setRechercheProche(false);
        }
      },
      () => {
        setErreurProche("Impossible d'accéder à votre position. Vérifiez que la géolocalisation est autorisée pour ce site.");
        setRechercheProche(false);
      }
    );
  }

  return (
    <>
      {bandeauProVisible && (
        <div className="bandeau-pro">
          <div className="container bandeau-pro-inner">
            <span className="bandeau-pro-texte">
              🔧 Vous êtes un centre de contrôle technique ? <strong>Inscription gratuite, sans abonnement.</strong>
            </span>
            <div className="bandeau-pro-actions">
              <Link href="/pro/register" className="bandeau-pro-lien">Créer mon compte</Link>
              <span>Une question ?</span>
              <a href="tel:+33608129145" className="bandeau-pro-lien">📞 06 08 12 91 45</a>
              <a href="mailto:contact@creneauct.fr" className="bandeau-pro-lien">✉️ contact@creneauct.fr</a>
            </div>
            <button
              type="button"
              className="bandeau-pro-close"
              onClick={() => setBandeauProVisible(false)}
              aria-label="Fermer ce message"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <Header />

      <section className="hero">
        <div className="container">
          <div className="eyebrow">🚗 Réservation en ligne</div>
          <h1>Trouvez votre créneau de contrôle technique, à votre convenance, en toute simplicité</h1>
          <p className="lead">
            Créneau CT vous permet de réserver facilement votre contrôle technique, où et quand
            ça vous arrange{' '}
            <span className="lead-aside">
              (y compris les disponibilités de{' '}
              <strong>dernière minute</strong> près de chez vous)
            </span>.
          </p>

          <div className="contact-humain">
            <span className="contact-humain-label">Un RDV pour votre contrôle technique ? Une question ? Un vrai contact, toujours disponible :</span>
            <div className="contact-humain-boutons">
              <a href="tel:+33608129145" className="contact-btn">
                <PhoneIcon size={16} />
                06 08 12 91 45
              </a>
              <a href="sms:+33608129145" className="contact-btn">
                <SmsIcon size={16} />
                SMS
              </a>
              <a href="https://wa.me/33608129145" target="_blank" rel="noopener noreferrer" className="contact-btn contact-btn-whatsapp">
                <WhatsAppIcon size={16} />
                WhatsApp
              </a>
              <a href="mailto:contact@creneauct.fr" className="contact-btn">
                <MailIcon size={16} />
                contact@creneauct.fr
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={trouverProche}
            disabled={rechercheProche}
            style={{ marginTop: 16, marginBottom: 8, background: 'var(--color-highlight)', borderColor: 'var(--color-highlight)' }}
          >
            {rechercheProche ? 'Recherche en cours…' : '📍 Prochain RDV disponible près de chez moi'}
          </button>

          {erreurProche && <div className="message-banner error" style={{ marginTop: 10, maxWidth: 480 }}>{erreurProche}</div>}

          {resultatProche && (
            <div className="card" style={{ marginTop: 14, maxWidth: 480, borderLeft: '3px solid var(--color-accent)' }}>
              <p className="eyebrow" style={{ marginBottom: 6 }}>Le plus proche avec un créneau libre</p>
              <h3 style={{ margin: '0 0 4px 0' }}>{resultatProche.centre.nom}</h3>
              <p className="help-text" style={{ margin: '0 0 8px 0' }}>
                {resultatProche.centre.adresse}, {resultatProche.centre.code_postal} {resultatProche.centre.ville}
                {' · '}<span className="mono">{resultatProche.centre.distance_km} km</span>
              </p>
              <p style={{ margin: '0 0 12px 0' }}>
                <strong>{formatDateLongue(resultatProche.creneau.date)}</strong> à <strong>{resultatProche.creneau.heure}</strong>
                {resultatProche.creneau.prix != null && (
                  <span className="mono" style={{ marginLeft: 8 }}>
                    {resultatProche.creneau.promo_pourcentage
                      ? `${(resultatProche.creneau.prix * (1 - resultatProche.creneau.promo_pourcentage / 100)).toFixed(2)}€ TTC`
                      : `${resultatProche.creneau.prix.toFixed(2)}€ TTC`}
                  </span>
                )}
              </p>
              <button type="button" onClick={() => router.push(`/centre/${resultatProche.centre.id}`)}>
                Voir ce créneau
              </button>
            </div>
          )}

          <form className="search-box" onSubmit={handleSubmit} style={{ marginTop: 20 }}>
            <div className="search-grid">

              {/* Ligne 1 : Ville + Date */}
              <div className="field search-ville-wrap">
                <label htmlFor="ville">Ville</label>
                <input
                  id="ville"
                  type="text"
                  value={ville}
                  autoComplete="off"
                  placeholder="Lille, Paris, Lyon…"
                  onChange={(e) => { setVille(e.target.value); chercherCommunes(e.target.value); }}
                  onBlur={() => setTimeout(() => setSuggestionVisible(false), 150)}
                  onFocus={() => suggestions.length > 0 && setSuggestionVisible(true)}
                />
                {suggestionVisible && suggestions.length > 0 && (
                  <ul className="search-suggestions">
                    {suggestions.map((s, i) => (
                      <li key={i} onMouseDown={() => { setVille(s.nom); setCp(s.cp); setSuggestionVisible(false); }}>
                        <span className="sug-nom">{s.nom}</span>
                        <span className="sug-cp">{s.cp}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="field">
                <label htmlFor="date">Date souhaitée <span className="label-opt">(optionnel)</span></label>
                <div className="date-input-wrap">
                  <input
                    id="date"
                    type="date"
                    value={date}
                    min={dateMin}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  {!date && <span className="date-placeholder">Dès que possible</span>}
                </div>
              </div>

              {/* Ligne 2 : Code postal + Véhicule */}
              <div className="field">
                <label htmlFor="cp">Code postal <span className="label-opt">(optionnel)</span></label>
                <input
                  id="cp"
                  type="text"
                  value={cp}
                  onChange={(e) => setCp(e.target.value)}
                  placeholder="59000"
                  maxLength={5}
                />
              </div>

              <div className="field">
                <label htmlFor="vehicule">Mon véhicule <span className="label-opt">(optionnel)</span></label>
                <select
                  id="vehicule"
                  value={vehicule}
                  onChange={(e) => setVehicule(e.target.value)}
                  style={{ color: vehicule ? 'var(--color-text)' : 'var(--color-text-muted)' }}
                >
                  <option value="">Tous véhicules</option>
                  <optgroup label="Voiture">
                    {TYPES_VEHICULES.filter((t) => t.categorie === 'voiture').map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Moto / sans permis">
                    {TYPES_VEHICULES.filter((t) => t.categorie === 'moto').map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Ligne 3 : contre-visite + bouton */}
            <div className="search-footer">
              <label className="search-checkbox">
                <input
                  type="checkbox"
                  checked={typeVisite === 'contre_visite'}
                  onChange={(e) => setTypeVisite(e.target.checked ? 'contre_visite' : 'normale')}
                />
                Je cherche une contre-visite
              </label>
              <button type="submit">Rechercher</button>
            </div>
          </form>

          <p className="help-text" style={{ marginTop: 10 }}>
            ✓ Gratuit, sans engagement · ✓ Aucune carte bancaire requise · ✓ Vous réglez le centre directement, sur place · ✓ Annulation libre à tout moment
          </p>

          {totalRdv > 0 && (
            <div className="rdv-counter">
              <span className="rdv-counter-nb">{totalRdv.toLocaleString('fr-FR')}</span>
              <span className="rdv-counter-label">contrôle{totalRdv > 1 ? 's' : ''} technique{totalRdv > 1 ? 's' : ''} réservé{totalRdv > 1 ? 's' : ''} via Créneau CT</span>
            </div>
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
                centres.map((c) => <CentreCard key={c.id} centre={c} dateRecherchee={date} typeVisite={typeVisite} />)
              )}
            </>
          )}
        </div>
      </section>

      <section className="pro-cta">
        <div className="container pro-cta-inner">
          <div>
            <p className="eyebrow" style={{ color: '#E8ECE6' }}>🔧 Vous êtes un centre de contrôle technique ?</p>
            <h2 style={{ color: '#fff', margin: '6px 0 8px 0' }}>Comblez vos créneaux vides, sans effort et sans abonnement</h2>
            <p style={{ color: '#cfe0d2', margin: 0, maxWidth: 520 }}>
              Créneau CT connecte votre planning à des automobilistes prêts à réserver dès aujourd'hui. Vous gardez
              la main sur vos prix, vos disponibilités et vos remises, sans engagement ni abonnement.
            </p>
          </div>
          <div className="pro-cta-boutons">
            <Link href="/pro/register" className="btn" style={{ background: '#fff', color: 'var(--color-primary)', borderColor: '#fff', whiteSpace: 'nowrap' }}>
              Créer mon compte centre
            </Link>
            <Link href="/contact" className="btn-secondary" style={{ borderColor: 'rgba(255,255,255,0.6)', color: '#fff', whiteSpace: 'nowrap' }}>
              Une question avant ? Contactez-nous
            </Link>
          </div>
        </div>
      </section>

      <section className="stats-public">
        <div className="container">
          <p className="stats-public-accroche">
            En France, <strong>27,6 millions de contrôles techniques</strong> sont réalisés chaque année, et trouver
            un créneau disponible reste souvent plus compliqué que prévu. Créneau CT est là pour ça.
          </p>
          <div className="stats-public-chiffres">
            <div className="stat-ligne">
              <span className="stat-val">6 700</span>
              <span className="stat-sep">centres agréés en France</span>
            </div>
            <div className="stat-sep-vert" />
            <div className="stat-ligne">
              <span className="stat-val">0 €</span>
              <span className="stat-sep">de frais pour le client</span>
            </div>
            <div className="stat-sep-vert" />
            <div className="stat-ligne">
              <span className="stat-val">2 min</span>
              <span className="stat-sep">pour réserver en ligne</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

function CentreCard({ centre, dateRecherchee, typeVisite }) {
  const router = useRouter();
  const hrefCentre = typeVisite === 'contre_visite' ? `/centre/${centre.id}?visite=contre_visite` : `/centre/${centre.id}`;
  const couleur = couleurEnseigne(centre.enseigne);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${centre.adresse}, ${centre.code_postal} ${centre.ville}`
  )}`;

  return (
    <div
      className={`centre-card ${centre.est_premium ? 'centre-card-premium' : ''}`}
      style={{ cursor: 'pointer', borderColor: centre.est_premium ? 'var(--color-accent)' : (couleur.degrade ? (couleur.bordure || couleur.texte) : couleur.fond) }}
      role="link"
      tabIndex={0}
      onClick={() => router.push(hrefCentre)}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(hrefCentre); }}
    >
      {centre.image_data && (
        <div className="centre-card-image">
          <img src={`data:${centre.image_mime};base64,${centre.image_data}`} alt={centre.nom} />
        </div>
      )}
      <div className="infos">
        <div className="centre-title-row">
          {centre.est_premium ? (
            <span className="premium-badge" title="Centre premium">
              ★ Premium
            </span>
          ) : null}
          {centre.est_demo ? (
            <span className="demo-badge" title="Centre de démonstration, à titre d'exemple">
              DÉMO
            </span>
          ) : null}
          <h3 style={{ margin: 0 }}>{centre.nom}</h3>
          <span
            className="enseigne-badge"
            style={
              couleur.degrade
                ? { background: couleur.degrade, color: couleur.texte, border: `1px solid ${couleur.bordure || 'transparent'}` }
                : { background: couleur.fond, color: couleur.texte, border: '1px solid transparent' }
            }
          >
            {centre.enseigne || 'Centre indépendant'}
          </span>
        </div>
        {centre.note_moyenne != null && (
          <div className="note-moyenne" style={{ marginBottom: 6 }}>
            <span style={{ color: 'var(--color-accent)' }}>★</span> {centre.note_moyenne} <span className="help-text">({centre.nombre_avis} avis)</span>
          </div>
        )}
        <div className="adresse">
          {centre.adresse}, {centre.code_postal} {centre.ville}
          {' · '}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="maps-link" onClick={(e) => e.stopPropagation()}>
            Voir sur Google Maps
          </a>
        </div>
        <a
          href="tel:+33608129145"
          className="tel-btn-creneau"
          onClick={(e) => e.stopPropagation()}
        >
          📞 Prendre RDV par téléphone
        </a>

        {dateRecherchee ? (
          <p className="help-text" style={{ marginTop: 8 }}>
            {centre.creneau_date_souhaitee
              ? <>✅ Créneau disponible le {formatDateCourte(dateRecherchee)} à <strong>{centre.creneau_date_souhaitee.heure}</strong></>
              : <>Pas de créneau ce jour-là, prochain disponible : {centre.prochain_creneau ? `${formatDateCourte(centre.prochain_creneau.date)} à ${centre.prochain_creneau.heure}` : 'aucun sous 7 jours'}</>}
          </p>
        ) : (
          <p className="help-text" style={{ marginTop: 8 }}>
            {centre.prochain_creneau
              ? `Prochain créneau : ${formatDateCourte(centre.prochain_creneau.date)} à ${centre.prochain_creneau.heure}`
              : 'Aucun créneau dans les 7 prochains jours'}
          </p>
        )}

        <div className="vehicule-badges">
          {TYPES_VEHICULES.filter((t) => parseTypes(centre.types_vehicules_acceptes).includes(t.value)).map((t) => (
            <span key={t.value} className="vehicule-badge" style={{ background: t.couleur }}>
              <IconeVehicule icone={t.icone} size={13} color="#fff" />
              {t.label}
            </span>
          ))}
        </div>
      </div>
      <div className="stamps-groupe">
        {[
          { n: centre.creneaux_2j, label: '2 jours' },
          { n: centre.creneaux_7j, label: '7 jours' },
          { n: centre.creneaux_14j, label: '14 jours' },
        ].map((s) => (
          <div key={s.label} className={`stamp ${s.n === 0 ? 'vide' : ''}`}>
            <span className="n">{s.n}</span>
            <span className="label">
              <span className="stamp-marque">Créneau CT</span>
              sous {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
