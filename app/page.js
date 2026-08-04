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
  const [ville, setVille] = useState('');
  const [cp, setCp] = useState('');
  const [date, setDate] = useState('');
  const [vehicule, setVehicule] = useState('');
  const [typeVisite, setTypeVisite] = useState('normale');
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
        setErreurProche("Impossible d'accéder à votre position — vérifiez que la géolocalisation est autorisée pour ce site.");
        setRechercheProche(false);
      }
    );
  }

  return (
    <>
      <Header />

      <section className="hero">
        <div className="container">
          <div className="eyebrow">🚗 Réservation en ligne</div>
          <h1>Trouvez votre créneau de contrôle technique, à votre convenance, en toute simplicité</h1>
          <p className="lead">
            Créneau CT vous permet de réserver facilement votre contrôle technique, où et quand
            ça vous arrange — y compris les disponibilités de dernière minute près de chez vous.
          </p>

          <div className="contact-humain">
            <span className="contact-humain-label">Un RDV pour votre contrôle technique ? Une question ? Un vrai contact, toujours disponible :</span>
            <div className="contact-humain-boutons">
              <a href="tel:+33608129145" className="contact-btn">
                <PhoneIcon size={16} />
                06 08 12 91 45
              </a>
              <a href="sms:+33612345678" className="contact-btn">
                <SmsIcon size={16} />
                SMS
              </a>
              <a href="https://wa.me/33612345678" target="_blank" rel="noopener noreferrer" className="contact-btn contact-btn-whatsapp">
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
            <div className="field">
              <label htmlFor="ville">Ville</label>
              <input id="ville" type="text" value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Lille, Paris, Lyon..." />
            </div>
            <div className="field">
              <label htmlFor="cp">Code postal</label>
              <input id="cp" type="text" value={cp} onChange={(e) => setCp(e.target.value)} placeholder="59000" maxLength={5} />
            </div>
            <div className="field">
              <label htmlFor="date">Date souhaitée (optionnel)</label>
              <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="vehicule">Mon véhicule (optionnel)</label>
              <select id="vehicule" value={vehicule} onChange={(e) => setVehicule(e.target.value)}>
                <option value="">Tous véhicules</option>
                <optgroup label="Voiture">
                  {TYPES_VEHICULES.filter((t) => t.categorie === 'voiture').map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Moto/scooter">
                  {TYPES_VEHICULES.filter((t) => t.categorie === 'moto').map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="field" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400, fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                <input
                  type="checkbox"
                  checked={typeVisite === 'contre_visite'}
                  onChange={(e) => setTypeVisite(e.target.checked ? 'contre_visite' : 'normale')}
                />
                Je cherche une contre-visite
              </label>
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
              la main sur vos prix, vos disponibilités et vos remises — aucun engagement, aucun abonnement.
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
          <div className="eyebrow">📊 Le contrôle technique en France</div>
          <h2>Une obligation prise au sérieux, partout en France</h2>
          <div className="stats-public-grid">
            <div className="stat-public-card" style={{ borderTop: '3px solid var(--color-primary)' }}>
              <span className="stat-public-value" style={{ color: 'var(--color-primary)' }}>27,6 M</span>
              <span className="stat-public-label">🚗 contrôles techniques réalisés en 2025</span>
            </div>
            <div className="stat-public-card" style={{ borderTop: '3px solid var(--color-highlight)' }}>
              <span className="stat-public-value" style={{ color: 'var(--color-highlight)' }}>18,58 %</span>
              <span className="stat-public-label">⚠️ de véhicules recalés pour défaillance majeure — près d'1 sur 5</span>
            </div>
            <div className="stat-public-card" style={{ borderTop: '3px solid var(--color-success)' }}>
              <span className="stat-public-value" style={{ color: 'var(--color-success)' }}>6 700</span>
              <span className="stat-public-label">📍 centres de contrôle technique agréés en France</span>
            </div>
            <div className="stat-public-card" style={{ borderTop: '3px solid var(--color-accent)' }}>
              <span className="stat-public-value" style={{ color: 'var(--color-accent)' }}>13 329</span>
              <span className="stat-public-label">🔧 contrôleurs agréés sur tout le territoire</span>
            </div>
          </div>
          <p className="help-text" style={{ marginTop: 16 }}>
            Sources : bilans annuels de l'UTAC-OTC (Organisme Technique Central), 2022-2025.
          </p>
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
      className="centre-card"
      style={{ cursor: 'pointer', borderColor: couleur.degrade ? (couleur.bordure || couleur.texte) : couleur.fond }}
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
              : <>Pas de créneau ce jour-là — prochain disponible : {centre.prochain_creneau ? `${formatDateCourte(centre.prochain_creneau.date)} à ${centre.prochain_creneau.heure}` : 'aucun sous 7 jours'}</>}
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
