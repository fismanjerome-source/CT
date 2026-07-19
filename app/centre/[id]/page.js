'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import { IconeVehicule } from '../../components/VehiculeIcons';
import { TYPES_VEHICULES, parseTypes } from '@/lib/vehicules';
import { couleurEnseigne } from '@/lib/enseignes';

function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default function CentrePage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [centre, setCentre] = useState(null);
  const [dispoParJour, setDispoParJour] = useState({});
  const [dateSelectionnee, setDateSelectionnee] = useState(todayISO());
  const [typeVehicule, setTypeVehicule] = useState(null);
  const [creneaux, setCreneaux] = useState(null);
  const [chargementCreneaux, setChargementCreneaux] = useState(true);
  const [modalCreneau, setModalCreneau] = useState(null); // { heure } | null
  const [confirmation, setConfirmation] = useState(null);
  const [erreurChargement, setErreurChargement] = useState(false);

  // Chargement initial : centre + disponibilités des 14 prochains jours
  useEffect(() => {
    let annule = false;
    async function charger() {
      try {
        const [centreRes, dispoRes] = await Promise.all([
          fetch(`/api/centres/${id}`),
          fetch(`/api/centres/${id}/disponibilites?debut=${todayISO()}&jours=13`),
        ]);
        if (!centreRes.ok) throw new Error('Centre introuvable');
        const centreData = await centreRes.json();
        const dispoData = await dispoRes.json();
        if (annule) return;

        setCentre(centreData.centre);
        const typesAcceptes = parseTypes(centreData.centre.types_vehicules_acceptes);
        setTypeVehicule(typesAcceptes[0] || null);

        const map = Object.fromEntries(dispoData.disponibilites.map((d) => [d.date, d.n]));
        setDispoParJour(map);

        const premierJourDispo = Array.from({ length: 14 }, (_, i) => todayISO(i)).find((d) => map[d] > 0);
        setDateSelectionnee(premierJourDispo || todayISO());
      } catch {
        if (!annule) setErreurChargement(true);
      }
    }
    charger();
    return () => { annule = true; };
  }, [id]);

  // Chargement des créneaux à chaque changement de date ou de type de véhicule
  useEffect(() => {
    let annule = false;
    async function chargerCreneaux() {
      setChargementCreneaux(true);
      try {
        const params = new URLSearchParams({ date: dateSelectionnee });
        if (typeVehicule) params.set('type_vehicule', typeVehicule);
        const res = await fetch(`/api/centres/${id}/creneaux?${params.toString()}`);
        const data = await res.json();
        if (!annule) setCreneaux(data.creneaux);
      } catch {
        if (!annule) setCreneaux([]);
      } finally {
        if (!annule) setChargementCreneaux(false);
      }
    }
    if (dateSelectionnee && typeVehicule !== null) chargerCreneaux();
    return () => { annule = true; };
  }, [id, dateSelectionnee, typeVehicule]);

  function rafraichirApresReservation() {
    const params = new URLSearchParams({ date: dateSelectionnee });
    if (typeVehicule) params.set('type_vehicule', typeVehicule);
    fetch(`/api/centres/${id}/creneaux?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setCreneaux(d.creneaux));
  }

  if (erreurChargement) {
    return (
      <div className="container" style={{ padding: 40 }}>
        <div className="message-banner error">Impossible de charger ce centre.</div>
        <Link href="/" className="back-link">← Retour à la recherche</Link>
      </div>
    );
  }

  const typesAcceptesCentre = centre ? parseTypes(centre.types_vehicules_acceptes) : [];

  return (
    <>
      <Header />

      <section className="centre-header">
        <div className="container">
          <Link href="/" className="back-link">← Retour à la recherche</Link>
          {centre ? (
            <>
              {centre.image_data && (
                <div className="centre-page-image">
                  <img src={`data:${centre.image_mime};base64,${centre.image_data}`} alt={centre.nom} />
                </div>
              )}
              <div className="centre-title-row">
                <h1 style={{ margin: 0 }}>{centre.nom}</h1>
                <span
                  className="enseigne-badge"
                  style={
                    couleurEnseigne(centre.enseigne).degrade
                      ? { background: couleurEnseigne(centre.enseigne).degrade, color: couleurEnseigne(centre.enseigne).texte, border: `1px solid ${couleurEnseigne(centre.enseigne).bordure || 'transparent'}` }
                      : { background: couleurEnseigne(centre.enseigne).fond, color: couleurEnseigne(centre.enseigne).texte, border: '1px solid transparent' }
                  }
                >
                  {centre.enseigne || 'Centre indépendant'}
                </span>
              </div>
              <p className="help-text">
                {centre.adresse}, {centre.code_postal} {centre.ville}
                {centre.telephone ? ` · ${centre.telephone}` : ''}
                {' · '}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${centre.adresse}, ${centre.code_postal} ${centre.ville}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="maps-link"
                >
                  Voir sur Google Maps
                </a>
              </p>
            </>
          ) : (
            <p className="help-text">Chargement…</p>
          )}
        </div>
      </section>

      <section className="container">
        {typesAcceptesCentre.length > 0 && (
          <>
            <h2 style={{ marginTop: 20, marginBottom: 10 }}>Votre véhicule</h2>
            <div className="type-vehicule-picker">
              {TYPES_VEHICULES.filter((t) => typesAcceptesCentre.includes(t.value)).map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`type-vehicule-chip ${typeVehicule === t.value ? 'selected' : ''}`}
                  style={typeVehicule === t.value ? { borderColor: t.couleur, background: t.couleur, color: '#fff' } : { borderColor: t.couleur, color: t.couleur }}
                  onClick={() => setTypeVehicule(t.value)}
                >
                  <IconeVehicule icone={t.icone} size={16} color={typeVehicule === t.value ? '#fff' : t.couleur} />
                  {t.label}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="day-picker">
          {Array.from({ length: 14 }, (_, i) => todayISO(i)).map((dateStr) => {
            const d = new Date(dateStr + 'T00:00:00');
            const n = dispoParJour[dateStr] || 0;
            return (
              <div
                key={dateStr}
                className={`day-chip ${dateStr === dateSelectionnee ? 'selected' : ''}`}
                onClick={() => setDateSelectionnee(dateStr)}
              >
                <span className="dow">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                <span className="num">{d.getDate()}</span>
                <span className={`count ${n === 0 ? 'zero' : ''}`}>{n === 0 ? '—' : `${n} libre${n > 1 ? 's' : ''}`}</span>
              </div>
            );
          })}
        </div>
        <p className="help-text" style={{ marginTop: -4, marginBottom: 10 }}>
          Le nombre de créneaux par jour ci-dessus inclut tous types de véhicules confondus — le détail ci-dessous est filtré selon votre sélection.
        </p>

        <h2 style={{ marginTop: 20 }}>
          Créneaux du {new Date(dateSelectionnee + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>

        <div className="slots-grid">
          {chargementCreneaux ? (
            <p className="help-text">Chargement des créneaux…</p>
          ) : !creneaux || creneaux.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              Aucun créneau disponible ce jour-là pour ce type de véhicule. Essayez une autre date ou un autre véhicule.
            </div>
          ) : (
            creneaux.map((c) => {
              const aPromo = c.promo_pourcentage && c.prix != null;
              return (
                <button key={c.id} className={`slot-btn ${aPromo ? 'promo' : ''}`} onClick={() => setModalCreneau(c)}>
                  {aPromo ? <span className="promo-flag">-{c.promo_pourcentage}%</span> : null}
                  <span className="slot-heure">{c.heure}</span>
                  {c.prix != null && (
                    <span className="slot-prix">
                      {aPromo ? (
                        <>
                          <s className="prix-barre">{c.prix.toFixed(2)}€</s>{' '}
                          <span className="prix-final">{c.prix_final.toFixed(2)}€</span>
                        </>
                      ) : (
                        <span>{c.prix.toFixed(2)}€ TTC</span>
                      )}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </section>

      <Footer />

      {modalCreneau && centre && (
        <ReservationModal
          centre={centre}
          creneau={modalCreneau}
          dateSelectionnee={dateSelectionnee}
          typeVehicule={typeVehicule}
          onClose={() => setModalCreneau(null)}
          onSuccess={(rdv) => {
            setModalCreneau(null);
            setConfirmation(rdv);
            rafraichirApresReservation();
          }}
        />
      )}

      {confirmation && (
        <ConfirmationModal rdv={confirmation} onClose={() => router.push('/')} />
      )}
    </>
  );
}

function ReservationModal({ centre, creneau, dateSelectionnee, typeVehicule, onClose, onSuccess }) {
  const [etape, setEtape] = useState('formulaire'); // 'formulaire' | 'recapitulatif'
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [immatriculation, setImmatriculation] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);

  const dateLisible = new Date(dateSelectionnee + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const typeLabel = TYPES_VEHICULES.find((t) => t.value === typeVehicule)?.label || typeVehicule;

  function handlePasserAuRecap(e) {
    e.preventDefault();
    setErreur(null);
    setEtape('recapitulatif');
  }

  async function handleConfirmerDefinitivement() {
    setEnvoi(true);
    setErreur(null);
    try {
      const res = await fetch('/api/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creneau_id: creneau.id,
          client_nom: nom.trim(),
          client_email: email.trim(),
          client_telephone: telephone.trim(),
          immatriculation: immatriculation.trim(),
          type_vehicule: typeVehicule,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.erreur);
        setEnvoi(false);
        setEtape('formulaire');
        return;
      }
      onSuccess(data.rdv);
    } catch {
      setErreur('Erreur réseau. Réessayez.');
      setEnvoi(false);
      setEtape('formulaire');
    }
  }

  const recapCreneau = (
    <div className="modal-recap">
      <strong>{centre.nom}</strong><br />
      {dateLisible} à {creneau.heure} · {typeLabel}
      {creneau.prix != null && (
        <div style={{ marginTop: 6 }}>
          {creneau.promo_pourcentage ? (
            <>
              <span className="promo-badge-inline" style={{ marginRight: 8 }}>-{creneau.promo_pourcentage}%</span>
              <s className="prix-barre">{creneau.prix.toFixed(2)}€</s>{' '}
              <span className="prix-final" style={{ fontWeight: 700 }}>{creneau.prix_final.toFixed(2)}€ TTC</span>
            </>
          ) : (
            <span style={{ fontWeight: 700 }}>{creneau.prix.toFixed(2)}€ TTC</span>
          )}
        </div>
      )}
    </div>
  );

  if (etape === 'recapitulatif') {
    return (
      <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <h2>Vérifiez vos informations</h2>
          {recapCreneau}

          <div className="card" style={{ marginTop: 4 }}>
            <p style={{ margin: '0 0 8px 0' }}><span className="help-text">Nom</span><br /><strong>{nom}</strong></p>
            <p style={{ margin: '0 0 8px 0' }}><span className="help-text">Email</span><br /><strong>{email}</strong></p>
            <p style={{ margin: '0 0 8px 0' }}><span className="help-text">Téléphone</span><br /><strong>{telephone}</strong></p>
            <p style={{ margin: 0 }}><span className="help-text">Immatriculation</span><br /><strong>{immatriculation.toUpperCase()}</strong></p>
          </div>

          <div className="message-banner success" style={{ marginTop: 14 }}>
            📧 Vous allez recevoir un email de confirmation à <strong>{email}</strong>. Vérifiez bien que cette
            adresse est correcte avant de valider.
          </div>

          {erreur && <div className="message-banner error">{erreur}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setEtape('formulaire')} disabled={envoi}>
              ← Modifier
            </button>
            <button type="button" onClick={handleConfirmerDefinitivement} disabled={envoi}>
              {envoi ? 'Réservation en cours…' : 'Confirmer définitivement'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Réserver ce créneau</h2>
        {recapCreneau}
        <form onSubmit={handlePasserAuRecap}>
          <div className="form-row">
            <label htmlFor="client_nom">Nom complet</label>
            <input id="client_nom" type="text" required value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="name" />
          </div>
          <div className="form-row">
            <label htmlFor="client_email">Email</label>
            <input id="client_email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="form-row">
            <label htmlFor="client_telephone">Téléphone</label>
            <input id="client_telephone" type="tel" required value={telephone} onChange={(e) => setTelephone(e.target.value)} autoComplete="tel" />
          </div>
          <div className="form-row">
            <label htmlFor="immatriculation">Immatriculation du véhicule</label>
            <input
              id="immatriculation" type="text" required placeholder="AA-123-BB"
              style={{ textTransform: 'uppercase' }}
              value={immatriculation} onChange={(e) => setImmatriculation(e.target.value)}
            />
          </div>
          {erreur && <div className="message-banner error">{erreur}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit">Continuer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmationModal({ rdv, onClose }) {
  const d = new Date(rdv.date + 'T00:00:00');
  return (
    <div className="overlay">
      <div className="modal">
        <div className="confirmation-box">
          <h2 style={{ color: 'var(--color-success)' }}>Rendez-vous confirmé</h2>
          <p>
            {rdv.centre.nom}<br />
            {d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {rdv.heure}
          </p>
          <div className="ref">{rdv.reference}</div>
          <p className="help-text">Conservez cette référence pour consulter ou annuler votre rendez-vous depuis la page « Suivre un RDV ».</p>
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>Retour à l'accueil</button>
        </div>
      </div>
    </div>
  );
}
