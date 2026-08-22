'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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

export default function CentrePageClient({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [centre, setCentre] = useState(null);
  const [avis, setAvis] = useState(null);
  const [dispoParJour, setDispoParJour] = useState({});
  const [dateSelectionnee, setDateSelectionnee] = useState(todayISO());
  const [typeVehicule, setTypeVehicule] = useState(null);
  const searchParams = useSearchParams();
  const [typeVisite, setTypeVisite] = useState(() => (searchParams.get('visite') === 'contre_visite' ? 'contre_visite' : 'normale'));
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
        const [centreRes, dispoRes, avisRes] = await Promise.all([
          fetch(`/api/centres/${id}`),
          fetch(`/api/centres/${id}/disponibilites?debut=${todayISO()}&jours=13`),
          fetch(`/api/centres/${id}/avis`),
        ]);
        if (!centreRes.ok) throw new Error('Centre introuvable');
        const centreData = await centreRes.json();
        const dispoData = await dispoRes.json();
        const avisData = avisRes.ok ? await avisRes.json() : null;
        if (annule) return;

        setCentre(centreData.centre);
        if (avisData) setAvis(avisData);

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
        const params = new URLSearchParams({ date: dateSelectionnee, type_visite: typeVisite });
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
  }, [id, dateSelectionnee, typeVehicule, typeVisite]);

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
                {centre.est_premium ? <span className="premium-badge" title="Centre premium">★ Premium</span> : null}
                {centre.est_demo ? <span className="demo-badge" title="Centre de démonstration, à titre d'exemple">DÉMO</span> : null}
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
              <a href="tel:+33608129145" className="tel-btn-creneau" style={{ marginTop: 10 }}>
                📞 Prendre RDV par téléphone
              </a>
            </>
          ) : (
            <p className="help-text">Chargement…</p>
          )}
        </div>
      </section>

      <section className="container">
        <h2 style={{ marginTop: 20, marginBottom: 10 }}>Type de visite</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className={typeVisite === 'normale' ? '' : 'btn-secondary'}
            onClick={() => setTypeVisite('normale')}
          >
            Contrôle technique
          </button>
          <button
            type="button"
            className={typeVisite === 'contre_visite' ? '' : 'btn-secondary'}
            onClick={() => setTypeVisite('contre_visite')}
          >
            Contre-visite
          </button>
        </div>
        <p className="help-text" style={{ marginBottom: 16 }}>
          {typeVisite === 'contre_visite'
            ? "Votre véhicule a déjà été contrôlé et présente des défauts à corriger ? Réservez une contre-visite, généralement plus courte et moins chère."
            : "Premier contrôle technique, ou contrôle périodique classique."}
        </p>

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
          {typeVehicule === null ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              👆 Choisissez d'abord votre type de véhicule ci-dessus pour voir les créneaux disponibles.
            </div>
          ) : chargementCreneaux ? (
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
                          <span className="prix-final">{c.prix_final.toFixed(2)}€ TTC</span>
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

      {avis && avis.total > 0 && (
        <section className="container" style={{ padding: '0 24px 40px' }}>
          <h2 style={{ marginBottom: 10 }}>
            Avis clients <span style={{ color: 'var(--color-accent)' }}>★ {avis.moyenne}</span>{' '}
            <span className="help-text">({avis.total} avis)</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {avis.avis.slice(0, 10).map((a, i) => (
              <div key={i} className="card" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ color: 'var(--color-accent)' }}>{'★'.repeat(a.note)}{'☆'.repeat(5 - a.note)}</span>
                  <span className="help-text">{new Date(a.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                </div>
                {a.commentaire && <p style={{ margin: 0 }}>{a.commentaire}</p>}
                {a.client_prenom && <p className="help-text" style={{ marginTop: 6, marginBottom: 0 }}>— {a.client_prenom}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

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
  const [cguAcceptees, setCguAcceptees] = useState(false);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [immatriculation, setImmatriculation] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);

  const dateLisible = new Date(dateSelectionnee + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const typeInfo = TYPES_VEHICULES.find((t) => t.value === typeVehicule);
  const typeLabel = typeInfo?.label || typeVehicule;
  const estAujourdhui = dateSelectionnee === todayISO();

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
          client_prenom: prenom.trim(),
          client_nom: nom.trim(),
          client_email: email.trim(),
          client_telephone: telephone.trim(),
          immatriculation: immatriculation.trim(),
          type_vehicule: typeVehicule,
          cgu_acceptees: cguAcceptees,
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
      {dateLisible} à {creneau.heure}
      {typeInfo && (
        <span className="vehicule-badge" style={{ background: typeInfo.couleur, marginLeft: 8, verticalAlign: 'middle' }}>
          <IconeVehicule icone={typeInfo.icone} size={13} color="#fff" />
          {typeInfo.label}
        </span>
      )}
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

          {estAujourdhui && (
            <div className="message-banner error" style={{ fontWeight: 700, textAlign: 'center' }}>
              ⏰ ATTENTION : ce créneau est <strong>AUJOURD'HUI</strong> à {creneau.heure} !
            </div>
          )}

          <div className="card" style={{ marginTop: 4 }}>
            <p style={{ margin: '0 0 8px 0' }}><span className="help-text">Prénom</span><br /><strong>{prenom}</strong></p>
            <p style={{ margin: '0 0 8px 0' }}><span className="help-text">Nom</span><br /><strong>{nom}</strong></p>
            <p style={{ margin: '0 0 8px 0' }}><span className="help-text">Email</span><br /><strong>{email}</strong></p>
            <p style={{ margin: '0 0 8px 0' }}><span className="help-text">Téléphone</span><br /><strong>{telephone}</strong></p>
            <p style={{ margin: 0 }}><span className="help-text">Immatriculation</span><br /><strong>{immatriculation.toUpperCase()}</strong></p>
          </div>

          {typeInfo && (
            <div className="guide-card" style={{ borderLeftColor: typeInfo.couleur, marginTop: 14 }}>
              <p style={{ margin: 0 }}>
                Vous réservez bien un contrôle technique pour :{' '}
                <span className="vehicule-badge" style={{ background: typeInfo.couleur }}>
                  <IconeVehicule icone={typeInfo.icone} size={13} color="#fff" />
                  {typeInfo.label}
                </span>
              </p>
              <p className="help-text" style={{ marginTop: 8, marginBottom: 0 }}>
                Certains centres ne contrôlent pas toutes les catégories de véhicules — vérifiez bien avant de
                valider pour éviter un déplacement inutile.
              </p>
            </div>
          )}

          <div className="message-banner success" style={{ marginTop: 14 }}>
            📧 Vous allez recevoir un email de confirmation à <strong>{email}</strong>. Vérifiez bien que cette
            adresse est correcte avant de valider.
          </div>

          {erreur && <div className="message-banner error">{erreur}</div>}

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 14, fontSize: '0.88rem' }}>
            <input
              type="checkbox"
              checked={cguAcceptees}
              onChange={(e) => setCguAcceptees(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <span>
              J'ai lu et j'accepte les{' '}
              <Link href="/cgu" target="_blank" rel="noopener noreferrer">Conditions Générales d'Utilisation (CGU)</Link> de Créneau CT.
            </span>
          </label>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => { setEtape('formulaire'); setCguAcceptees(false); }} disabled={envoi}>
              ← Modifier
            </button>
            <button type="button" onClick={handleConfirmerDefinitivement} disabled={envoi || !cguAcceptees}>
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
          <div className="grid-2">
            <div className="form-row">
              <label htmlFor="client_prenom">Prénom</label>
              <input id="client_prenom" type="text" required value={prenom} onChange={(e) => setPrenom(e.target.value)} autoComplete="given-name" />
            </div>
            <div className="form-row">
              <label htmlFor="client_nom">Nom</label>
              <input id="client_nom" type="text" required value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="family-name" />
            </div>
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
