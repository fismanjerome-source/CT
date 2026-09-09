'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProSidebar from '../../components/ProSidebar';
import { IconeVehicule } from '../../components/VehiculeIcons';
import { SquelletteLigne, SquelletteCarte, SquelletteTableau } from '../../components/Squelette';
import ChevronIcon from '../../components/ChevronIcon';
import { TYPES_VEHICULES, parseTypes } from '@/lib/vehicules';
import { couleurEnseigne } from '@/lib/enseignes';

function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function minutesVersHeure(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}h${m}`;
}

// Regroupe une liste de créneaux (même jour, même type de visite) en plages
// horaires continues, pour afficher "8h-11h, 14h-17h" plutôt qu'une liste de
// 30 minutes en 30 minutes — deux créneaux sont dans la même plage si le
// second commence avant ou au moment où le premier se termine.
function calculerPlages(creneaux) {
  const tries = [...creneaux].sort((a, b) => a.heure.localeCompare(b.heure));
  const plages = [];
  for (const c of tries) {
    const [h, m] = c.heure.split(':').map(Number);
    const debut = h * 60 + m;
    const fin = debut + (c.duree_minutes || 30);
    const derniere = plages[plages.length - 1];
    if (derniere && debut <= derniere.finMinutes) {
      derniere.finMinutes = Math.max(derniere.finMinutes, fin);
    } else {
      plages.push({ debutMinutes: debut, finMinutes: fin });
    }
  }
  return plages.map((p) => `${minutesVersHeure(p.debutMinutes)}-${minutesVersHeure(p.finMinutes)}`);
}

// Regroupe par jour puis par type de visite, pour le résumé "Horaires déjà
// ouverts" au-dessus des actions groupées.
function regrouperHorairesOuverts(creneaux) {
  const parJour = {};
  for (const c of creneaux) {
    if (!parJour[c.date]) parJour[c.date] = { normale: [], contre_visite: [] };
    parJour[c.date][c.type_visite === 'contre_visite' ? 'contre_visite' : 'normale'].push(c);
  }
  return Object.keys(parJour).sort().map((date) => ({
    date,
    normale: calculerPlages(parJour[date].normale),
    contre_visite: calculerPlages(parJour[date].contre_visite),
  }));
}

async function api(path, options = {}) {
  const res = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.erreur || 'Erreur inconnue');
    err.status = res.status;
    throw err;
  }
  return data;
}

// Chevron d'accordéon, même marquage que .faq-item (voir globals.css) : la
// rotation vient de la règle CSS `.faq-item[open] .faq-chevron`, purement
// déclarative, aucune logique React nécessaire.
function ChevronAccordeon() {
  return (
    <svg className="faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DashboardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const centreActifId = searchParams.get('centre');

  const [controleur, setControleur] = useState(null);
  const [centre, setCentre] = useState(null);
  const [mesCentres, setMesCentres] = useState([]);
  const [message, setMessage] = useState(null);
  const [planning, setPlanning] = useState(null);
  const [rdvs, setRdvs] = useState(null);

  const [comblerForm, setComblerForm] = useState({
    date_debut: todayISO(), date_fin: todayISO(6),
    journeeContinue: false,
    heure_debut_matin: '09:00', heure_fin_matin: '12:00',
    heure_debut_apresmidi: '14:00', heure_fin_apresmidi: '18:00',
    heure_debut_continue: '09:00', heure_fin_continue: '18:00',
    intervalle_minutes: 30, duree_minutes: 30, type_visite: 'normale',
    prix_normale: '', prix_contre_visite: '',
    promo_pourcentage_normale: '', promo_pourcentage_contre_visite: '',
    types_vehicules: [],
  });
  const [comblerEnvoi, setComblerEnvoi] = useState(false);
  const [comblerResultat, setComblerResultat] = useState(null);
  const [horairesOuverts, setHorairesOuverts] = useState(null);
  const [porteeOuverture, setPorteeOuverture] = useState(null);
  const [promoPeriodeForm, setPromoPeriodeForm] = useState({ date_debut: todayISO(), date_fin: todayISO(7), promo_pourcentage: '' });
  const [promoPeriodeEnvoi, setPromoPeriodeEnvoi] = useState(false);
  const [promoPeriodeResultat, setPromoPeriodeResultat] = useState(null);
  const [prixPeriodeForm, setPrixPeriodeForm] = useState({ date_debut: todayISO(), date_fin: todayISO(7), prix: '', type_visite: '' });
  const [prixPeriodeEnvoi, setPrixPeriodeEnvoi] = useState(false);
  const [prixPeriodeResultat, setPrixPeriodeResultat] = useState(null);
  const [supprimerPeriodeForm, setSupprimerPeriodeForm] = useState({ date_debut: todayISO(), date_fin: todayISO(7), type_visite: '' });
  const [supprimerPeriodeEnvoi, setSupprimerPeriodeEnvoi] = useState(false);
  const [supprimerPeriodeResultat, setSupprimerPeriodeResultat] = useState(null);

  const [singleForm, setSingleForm] = useState({
    date: todayISO(), heure: '09:00', duree_minutes: 30, type_visite: 'normale',
    prix_normale: '', prix_contre_visite: '',
    promo_pourcentage_normale: '', promo_pourcentage_contre_visite: '',
    types_vehicules: [],
  });
  const [singleEnvoi, setSingleEnvoi] = useState(false);
  const [singleResultat, setSingleResultat] = useState(null);

  const [typesVehiculesCentre, setTypesVehiculesCentre] = useState([]);
  const [statutPaiement, setStatutPaiement] = useState(null);
  const [promotionActive, setPromotionActive] = useState(null);
  const [creneauReservation, setCreneauReservation] = useState(null); // créneau en cours de réservation manuelle
  const [formReservation, setFormReservation] = useState({ prenom: '', nom: '', email: '', telephone: '', immatriculation: '', type_vehicule: '' });
  const [reservationEnvoi, setReservationEnvoi] = useState(false);
  const [reservationErreur, setReservationErreur] = useState(null);
  const [editionCentre, setEditionCentre] = useState(false);
  const [centreForm, setCentreForm] = useState(null);
  const [centreEnvoi, setCentreEnvoi] = useState(false);
  const [centreErreur, setCentreErreur] = useState(null);
  const [semaineOffset, setSemaineOffset] = useState(0);

  const chargerPlanning = useCallback(async () => {
    if (!centre) return;
    try {
      const { creneaux } = await api(`/api/pro/creneaux?debut=${todayISO(semaineOffset * 7)}&jours=7&centre=${centre.id}`);
      setPlanning(creneaux);
    } catch (e) {
      if (e.status === 401) router.push('/pro/login');
    }
  }, [router, centre, semaineOffset]);

  const chargerRdvs = useCallback(async () => {
    if (!centre) return;
    try {
      const { rdvs } = await api(`/api/pro/rdv?centre=${centre.id}`);
      setRdvs(rdvs);
    } catch (e) {
      if (e.status === 401) router.push('/pro/login');
    }
  }, [router, centre]);

  // Horaires déjà ouverts sur la période choisie dans "Combler des horaires
  // vides" — se recharge à chaque changement de dates, pour qu'on voie tout
  // de suite ce qui existe déjà (et notamment si un type de visite est
  // resté vide) avant d'en ouvrir de nouveaux.
  useEffect(() => {
    let annule = false;
    async function charger() {
      if (!centre || !comblerForm.date_debut || !comblerForm.date_fin) return;
      const jours = Math.max(0, Math.round(
        (new Date(comblerForm.date_fin + 'T00:00:00') - new Date(comblerForm.date_debut + 'T00:00:00')) / 86400000
      ));
      try {
        const { creneaux } = await api(`/api/pro/creneaux?debut=${comblerForm.date_debut}&jours=${jours}&centre=${centre.id}`);
        if (!annule) setHorairesOuverts(regrouperHorairesOuverts(creneaux));
      } catch {
        if (!annule) setHorairesOuverts(null);
      }
    }
    charger();
    return () => { annule = true; };
  }, [centre, comblerForm.date_debut, comblerForm.date_fin, comblerResultat, supprimerPeriodeResultat]);

  // Jusqu'où le planning est-il déjà ouvert, indépendamment des dates
  // actuellement saisies dans le formulaire ci-dessous (qui reviennent à une
  // semaine par défaut à chaque chargement) — pour qu'on voie tout de suite
  // "ouvert jusqu'au 24 novembre" même sans avoir touché aux champs Du/Au.
  useEffect(() => {
    let annule = false;
    async function charger() {
      if (!centre) return;
      try {
        const { portee } = await api(`/api/pro/creneaux/portee?centre=${centre.id}`);
        if (!annule) setPorteeOuverture(portee);
      } catch {
        if (!annule) setPorteeOuverture(null);
      }
    }
    charger();
    return () => { annule = true; };
  }, [centre, comblerResultat, supprimerPeriodeResultat]);

  useEffect(() => {
    async function init() {
      try {
        const url = centreActifId ? `/api/pro/me?centre=${centreActifId}` : '/api/pro/me';
        const { controleur, centre, mesCentres } = await api(url);
        setControleur(controleur);
        setCentre(centre);
        setMesCentres(mesCentres || []);
        setTypesVehiculesCentre(parseTypes(centre.types_vehicules_acceptes));
      } catch (e) {
        router.push('/pro/login');
      }
    }
    init();
  }, [router, centreActifId]);

  useEffect(() => {
    if (centre) {
      chargerPlanning();
      chargerRdvs();
      api(`/api/pro/statut-paiement?centre=${centre.id}`).then(setStatutPaiement).catch(() => {});
      api(`/api/pro/promotion-active?centre=${centre.id}`).then((d) => setPromotionActive(d.promotion)).catch(() => {});
    }
  }, [centre, chargerPlanning, chargerRdvs]);

  function ouvrirReservationManuelle(creneau) {
    setCreneauReservation(creneau);
    setFormReservation({ prenom: '', nom: '', email: '', telephone: '', immatriculation: '', type_vehicule: typesVehiculesCentre[0] || '' });
    setReservationErreur(null);
  }

  async function handleReservationManuelle(e) {
    e.preventDefault();
    setReservationEnvoi(true);
    setReservationErreur(null);
    try {
      const res = await fetch('/api/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creneau_id: creneauReservation.id,
          client_prenom: formReservation.prenom.trim(),
          client_nom: formReservation.nom.trim(),
          client_email: formReservation.email.trim(),
          client_telephone: formReservation.telephone.trim(),
          immatriculation: formReservation.immatriculation.trim(),
          type_vehicule: formReservation.type_vehicule,
          // /api/rdv exige ce champ (case à cocher côté réservation publique) ;
          // ici c'est le centre qui saisit le RDV lui-même (client au téléphone
          // ou au comptoir), il n'y a donc pas de case à faire cocher — sans ce
          // champ, TOUTE réservation manuelle depuis le tableau de bord échouait
          // avec une erreur 400.
          cgu_acceptees: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setReservationErreur(data.erreur); setReservationEnvoi(false); return; }
      setMessage({ type: 'success', text: `Rendez-vous enregistré pour ${formReservation.prenom} ${formReservation.nom} — référence ${data.rdv.reference}.` });
      setCreneauReservation(null);
      chargerPlanning();
    } catch {
      setReservationErreur('Erreur réseau. Réessayez.');
    } finally {
      setReservationEnvoi(false);
    }
  }

  function ouvrirEditionCentre() {
    setCentreForm({
      nom: centre.nom, adresse: centre.adresse, code_postal: centre.code_postal,
      ville: centre.ville, telephone: centre.telephone || '',
    });
    setCentreErreur(null);
    setEditionCentre(true);
  }

  async function handleSaveCentre(e) {
    e.preventDefault();
    setCentreEnvoi(true);
    setCentreErreur(null);
    try {
      await api('/api/pro/centre', {
        method: 'PATCH',
        body: JSON.stringify({ ...centreForm, centre_id: centre.id }),
      });
      setEditionCentre(false);
      setMessage({ type: 'success', text: 'Informations du centre mises à jour.' });
      const { centre: centreMisAJour } = await api(`/api/pro/me?centre=${centre.id}`);
      setCentre(centreMisAJour);
    } catch (e) {
      setCentreErreur(e.message);
    } finally {
      setCentreEnvoi(false);
    }
  }

  async function handleComblerSubmit(e) {
    e.preventDefault();
    setComblerEnvoi(true);
    setComblerResultat(null);
    try {
      const plages = comblerForm.journeeContinue
        ? [{ heure_debut: comblerForm.heure_debut_continue, heure_fin: comblerForm.heure_fin_continue }]
        : [
            { heure_debut: comblerForm.heure_debut_matin, heure_fin: comblerForm.heure_fin_matin },
            { heure_debut: comblerForm.heure_debut_apresmidi, heure_fin: comblerForm.heure_fin_apresmidi },
          ];
      const estContreVisite = comblerForm.type_visite === 'contre_visite';
      const prix = estContreVisite ? comblerForm.prix_contre_visite : comblerForm.prix_normale;
      const promo = estContreVisite ? comblerForm.promo_pourcentage_contre_visite : comblerForm.promo_pourcentage_normale;
      const data = await api('/api/pro/creneaux/combler-vides', {
        method: 'POST',
        body: JSON.stringify({
          date_debut: comblerForm.date_debut,
          date_fin: comblerForm.date_fin,
          plages,
          intervalle_minutes: Number(comblerForm.intervalle_minutes),
          duree_minutes: Number(comblerForm.duree_minutes),
          type_visite: comblerForm.type_visite,
          prix: Number(prix),
          promo_pourcentage: promo ? Number(promo) : null,
          types_vehicules: comblerForm.types_vehicules,
          centre_id: centre.id,
        }),
      });
      setMessage({ type: 'success', text: data.message });
      setComblerResultat({ type: 'success', text: `${data.nombre_crees > 0 ? '✅' : 'ℹ️'} ${data.message}` });
      chargerPlanning();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
      setComblerResultat({ type: 'error', text: e.message });
    } finally {
      setComblerEnvoi(false);
    }
  }

  async function handleAppliquerPromoSubmit(e) {
    e.preventDefault();
    setPromoPeriodeEnvoi(true);
    setPromoPeriodeResultat(null);
    try {
      const data = await api('/api/pro/creneaux/appliquer-promo', {
        method: 'POST',
        body: JSON.stringify({
          centre_id: centre.id,
          date_debut: promoPeriodeForm.date_debut,
          date_fin: promoPeriodeForm.date_fin,
          promo_pourcentage: promoPeriodeForm.promo_pourcentage ? Number(promoPeriodeForm.promo_pourcentage) : null,
        }),
      });
      setMessage({ type: 'success', text: data.message });
      setPromoPeriodeResultat({ type: 'success', text: `✅ ${data.message}` });
      chargerPlanning();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
      setPromoPeriodeResultat({ type: 'error', text: e.message });
    } finally {
      setPromoPeriodeEnvoi(false);
    }
  }

  async function handlePrixPeriodeSubmit(e) {
    e.preventDefault();
    setPrixPeriodeEnvoi(true);
    setPrixPeriodeResultat(null);
    try {
      const data = await api('/api/pro/creneaux/appliquer-prix', {
        method: 'POST',
        body: JSON.stringify({
          centre_id: centre.id,
          date_debut: prixPeriodeForm.date_debut,
          date_fin: prixPeriodeForm.date_fin,
          prix: prixPeriodeForm.prix,
          type_visite: prixPeriodeForm.type_visite || null,
        }),
      });
      setMessage({ type: 'success', text: data.message });
      setPrixPeriodeResultat({ type: 'success', text: `✅ ${data.message}` });
      chargerPlanning();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
      setPrixPeriodeResultat({ type: 'error', text: e.message });
    } finally {
      setPrixPeriodeEnvoi(false);
    }
  }

  async function handleSupprimerPeriodeSubmit(e) {
    e.preventDefault();
    const libelleType = supprimerPeriodeForm.type_visite === 'contre_visite'
      ? 'contre-visite'
      : supprimerPeriodeForm.type_visite === 'normale'
        ? 'visite normale'
        : 'tous types confondus';
    if (!confirm(`Supprimer tous les créneaux ENCORE DISPONIBLES (${libelleType}) du ${supprimerPeriodeForm.date_debut} au ${supprimerPeriodeForm.date_fin} ? Les créneaux déjà réservés ne seront jamais touchés. Cette action est irréversible.`)) {
      return;
    }
    setSupprimerPeriodeEnvoi(true);
    setSupprimerPeriodeResultat(null);
    try {
      const data = await api('/api/pro/creneaux/supprimer-periode', {
        method: 'POST',
        body: JSON.stringify({
          centre_id: centre.id,
          date_debut: supprimerPeriodeForm.date_debut,
          date_fin: supprimerPeriodeForm.date_fin,
          type_visite: supprimerPeriodeForm.type_visite || null,
        }),
      });
      setMessage({ type: 'success', text: data.message });
      setSupprimerPeriodeResultat({ type: 'success', text: `✅ ${data.message}` });
      chargerPlanning();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
      setSupprimerPeriodeResultat({ type: 'error', text: e.message });
    } finally {
      setSupprimerPeriodeEnvoi(false);
    }
  }

  async function handleSingleSubmit(e) {
    e.preventDefault();
    setSingleEnvoi(true);
    setSingleResultat(null);
    try {
      const estContreVisite = singleForm.type_visite === 'contre_visite';
      const prix = estContreVisite ? singleForm.prix_contre_visite : singleForm.prix_normale;
      const promo = estContreVisite ? singleForm.promo_pourcentage_contre_visite : singleForm.promo_pourcentage_normale;
      const data = await api('/api/pro/creneaux', {
        method: 'POST',
        body: JSON.stringify({
          date: singleForm.date,
          heure: singleForm.heure,
          duree_minutes: singleForm.duree_minutes,
          type_visite: singleForm.type_visite,
          types_vehicules: singleForm.types_vehicules,
          prix: Number(prix),
          promo_pourcentage: promo ? Number(promo) : null,
          centre_id: centre.id,
        }),
      });
      setMessage({ type: 'success', text: 'Créneau ajouté.' });
      setSingleResultat(data.bloque_ferie
        ? { type: 'success', text: `Créneau du ${singleForm.date} à ${singleForm.heure} ajouté, mais affiché « Bloqué » : cette date est un jour férié. Débloquez-la depuis l'onglet « Jours fériés » si votre centre y travaille.` }
        : { type: 'success', text: `✅ Créneau du ${singleForm.date} à ${singleForm.heure} ajouté (${estContreVisite ? 'contre-visite' : 'visite normale'}).` });
      chargerPlanning();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
      setSingleResultat({ type: 'error', text: e.message });
    } finally {
      setSingleEnvoi(false);
    }
  }

  async function supprimerCreneau(id) {
    if (!confirm('Supprimer ce créneau ?')) return;
    try {
      await api(`/api/pro/creneaux/${id}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: 'Créneau supprimé.' });
      chargerPlanning();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
  }

  async function modifierPromoCreneau(creneau) {
    const saisie = prompt(
      `Remise pour le créneau du ${new Date(creneau.date + 'T00:00:00').toLocaleDateString('fr-FR')} à ${creneau.heure} (en %, vide pour retirer la remise) :`,
      creneau.promo_pourcentage || ''
    );
    if (saisie === null) return; // annulé
    try {
      await api(`/api/pro/creneaux/${creneau.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ promo_pourcentage: saisie.trim() === '' ? null : Number(saisie) }),
      });
      setMessage({ type: 'success', text: 'Créneau mis à jour.' });
      chargerPlanning();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
  }

  if (!controleur || !centre) {
    return (
      <div className="pro-shell">
        <div className="pro-sidebar" style={{ opacity: 0.5 }} />
        <main className="pro-main">
          <SquelletteLigne largeur="220px" hauteur={30} style={{ marginBottom: 20 }} />
          <SquelletteCarte lignes={4} />
        </main>
      </div>
    );
  }

  return (
    <div className="pro-shell">
      <ProSidebar
        centreId={centre.id}
        premium={!!centre.est_premium}
        footerNote={controleur.nom}
        centreSwitcher={mesCentres.length > 1 ? {
          centres: mesCentres,
          valeur: centre.id,
          onChange: (id) => router.push(`/pro/dashboard?centre=${id}`),
        } : null}
      />

      <main className="pro-main">
        {(() => {
          const couleur = couleurEnseigne(centre.enseigne);
          const styleBouton = couleur.degrade
            ? { background: couleur.degrade, color: couleur.texte, border: `1px solid ${couleur.bordure || 'transparent'}` }
            : { background: couleur.fond, color: couleur.texte, border: '1px solid transparent' };
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0 }}>{centre.nom}</h1>
              {!editionCentre && (
                <button type="button" style={{ ...styleBouton, borderRadius: 20, padding: '6px 14px', fontSize: '0.8rem' }} onClick={ouvrirEditionCentre}>
                  Modifier
                </button>
              )}
            </div>
          );
        })()}

        {editionCentre ? (
          <form onSubmit={handleSaveCentre} className="card" style={{ marginTop: 12, maxWidth: 480 }}>
            {centreErreur && <div className="message-banner error">{centreErreur}</div>}
            <div className="form-row">
              <label htmlFor="centre_nom">Nom du centre</label>
              <input id="centre_nom" type="text" required value={centreForm.nom}
                onChange={(e) => setCentreForm({ ...centreForm, nom: e.target.value })} />
            </div>
            <div className="form-row">
              <label htmlFor="centre_adresse">Adresse</label>
              <input id="centre_adresse" type="text" required value={centreForm.adresse}
                onChange={(e) => setCentreForm({ ...centreForm, adresse: e.target.value })} />
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label htmlFor="centre_cp">Code postal</label>
                <input id="centre_cp" type="text" required maxLength={5} value={centreForm.code_postal}
                  onChange={(e) => setCentreForm({ ...centreForm, code_postal: e.target.value })} />
              </div>
              <div className="form-row">
                <label htmlFor="centre_ville">Ville</label>
                <input id="centre_ville" type="text" required value={centreForm.ville}
                  onChange={(e) => setCentreForm({ ...centreForm, ville: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="centre_telephone">Téléphone</label>
              <input id="centre_telephone" type="tel" value={centreForm.telephone}
                onChange={(e) => setCentreForm({ ...centreForm, telephone: e.target.value })} />
            </div>
            <p className="help-text">La position sur la carte (Google Maps, « près de chez moi ») sera automatiquement mise à jour.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={centreEnvoi}>{centreEnvoi ? 'Enregistrement…' : 'Enregistrer'}</button>
              <button type="button" className="btn-secondary" onClick={() => setEditionCentre(false)}>Annuler</button>
            </div>
          </form>
        ) : (
          <p className="help-text">{centre.adresse}, {centre.code_postal} {centre.ville}</p>
        )}

        {statutPaiement && (
          <div className={`paiements-banner ${statutPaiement.bloque ? 'alerte' : 'ok'}`} style={{ marginTop: 16 }}>
            <div>
              {statutPaiement.bloque ? (
                <>
                  <strong>Ouverture de créneaux bloquée</strong> — commission en retard de paiement
                  {statutPaiement.retards.map((r) => (
                    <span key={r.mois} className="mono" style={{ display: 'block', marginTop: 4 }}>
                      {r.montant.toFixed(2)} € dus depuis le {new Date(r.date_limite).toLocaleDateString('fr-FR')}
                    </span>
                  ))}
                  <span className="help-text" style={{ display: 'block', marginTop: 6 }}>
                    Contactez-nous depuis l'onglet « Contact Créneau CT » pour régulariser.
                  </span>
                </>
              ) : statutPaiement.mois_en_cours.montant > 0 ? (
                <>
                  <strong>{statutPaiement.mois_en_cours.montant.toFixed(2)} €</strong> dus ce mois-ci
                  {statutPaiement.mois_en_cours.montant_premium > 0 && (
                    <span className="help-text" style={{ display: 'block', color: 'inherit', opacity: 0.85 }}>
                      (dont {statutPaiement.mois_en_cours.montant_premium.toFixed(2)} € de forfait Premium)
                    </span>
                  )}
                  {' '}— à régler avant le 10 du mois suivant.
                </>
              ) : (
                <strong>Aucune commission due pour le moment.</strong>
              )}
            </div>
            <p className="help-text" style={{ marginTop: 8, marginBottom: 0 }}>
              💶 Rappel : la prise de rendez-vous via Créneau CT n'entraîne aucun paiement en ligne — le client
              vous règle directement le prix affiché par vos soins après son contrôle technique.
            </p>
          </div>
        )}

        {promotionActive && (
          <div className="paiements-banner ok" style={{ marginTop: 16, borderColor: 'var(--color-accent)', background: 'var(--color-promo-bg)', color: 'var(--color-promo)' }}>
            <div>
              🎉 <strong>Promotion en cours : {promotionActive.nom}</strong>
              <span className="mono" style={{ display: 'block', marginTop: 4 }}>
                Taux réduits : {promotionActive.taux_semaine1}% / {promotionActive.taux_semaine2}% / {promotionActive.taux_semaine3}%
                (au lieu de 25% / 20% / 15%)
              </span>
              <span className="help-text" style={{ display: 'block', marginTop: 4, color: 'inherit', opacity: 0.8 }}>
                Valable jusqu'au {new Date(promotionActive.date_fin).toLocaleDateString('fr-FR')}.
              </span>
            </div>
          </div>
        )}

        <div className="paiements-banner ok" style={{ marginTop: 16, borderColor: 'var(--color-accent)' }}>
          {centre.est_premium ? (
            <div>
              <strong style={{ color: 'var(--color-accent)' }}>★ {centre.nom} est en statut Premium</strong>
              <p className="help-text" style={{ margin: '4px 0 0' }}>
                Ce centre apparaît en tête des résultats de recherche, avec un badge doré visible par les clients.
                Forfait de <strong style={{ color: 'var(--color-accent)' }}>30 € TTC/mois</strong>, facturé comme votre commission.
              </p>
              <Link href={`/pro/premium?centre=${centre.id}`} style={{ display: 'inline-block', marginTop: 8 }}>
                Voir le détail ou arrêter l'abonnement
              </Link>
            </div>
          ) : (
            <div>
              <strong>★ Passez ce centre en Premium</strong>
              <p className="help-text" style={{ margin: '4px 0 0' }}>
                Pour <strong style={{ color: 'var(--color-accent)' }}>30 € TTC/mois</strong>, {centre.nom} apparaît en tête des résultats de recherche avec un icône doré
                visible, pour plus de visibilité et plus de réservations.
              </p>
              <Link href={`/pro/premium?centre=${centre.id}`} style={{ display: 'inline-block', marginTop: 8 }}>
                Voir les détails et demander l'activation
              </Link>
            </div>
          )}
        </div>

        {message && (
          <div className={`message-banner ${message.type}`} style={{ marginTop: 16 }}>{message.text}</div>
        )}

        <section id="planning" className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>Mon planning</h2></div>

          <div className="semaine-pagination">
            <button type="button" className="btn-secondary pagination-btn" onClick={() => setSemaineOffset((s) => Math.max(0, s - 1))} disabled={semaineOffset === 0}>
              <ChevronIcon direction="left" /> Précédente
            </button>
            <span className="semaine-label">
              Semaine du {new Date(todayISO(semaineOffset * 7) + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              {' '}au {new Date(todayISO(semaineOffset * 7 + 6) + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
            <button type="button" className="btn-secondary pagination-btn" onClick={() => setSemaineOffset((s) => s + 1)}>
              Suivante <ChevronIcon direction="right" />
            </button>
            <label className="planning-aller-a-date">
              Aller à une date
              <input
                type="date"
                min={todayISO()}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const jours = Math.round((new Date(e.target.value + 'T00:00:00') - new Date(todayISO() + 'T00:00:00')) / 86400000);
                  setSemaineOffset(Math.max(0, Math.floor(jours / 7)));
                }}
              />
            </label>
          </div>
          <div className="semaine-numeros">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`semaine-numero ${semaineOffset === n ? 'active' : ''}`}
                onClick={() => setSemaineOffset(n)}
              >
                {n + 1}
              </button>
            ))}
          </div>

          {planning === null ? (
            <SquelletteTableau lignes={6} colonnes={9} />
          ) : planning.length === 0 ? (
            <div className="empty-state">Aucun créneau programmé cette semaine-là. Ajoutez-en un ci-dessous, ou ouvrez plusieurs créneaux d'un coup depuis « Actions groupées sur une période ».</div>
          ) : (
            <div className="table-scroll">
            <table>
              <thead><tr><th>Date &amp; heure</th><th>Statut</th><th>Véhicules</th><th>Promo</th><th>Prix client TTC</th><th>Commission CT</th><th>Net pour vous</th><th>Client</th><th>Actions</th></tr></thead>
              <tbody>
                {planning.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">
                      {formatDate(c.date)} {c.heure}
                      {c.type_visite === 'contre_visite' && (
                        <span className="promo-badge-inline" style={{ marginLeft: 6, color: 'var(--color-primary)', background: 'transparent', borderColor: 'var(--color-primary)' }}>
                          Contre-visite
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${c.statut === 'disponible' ? 'disponible' : 'reserve'}`}>
                        {c.statut === 'disponible' ? 'Dispo' : c.statut === 'bloque' ? 'Bloqué' : 'Réservé'}
                      </span>
                    </td>
                    <td className="help-text">{c.types_vehicules ? parseTypes(c.types_vehicules).map((v) => TYPES_VEHICULES.find((t) => t.value === v)?.label).join(', ') : 'Tous'}</td>
                    <td>{c.promo_pourcentage ? <span className="promo-badge-inline">-{c.promo_pourcentage}%</span> : '—'}</td>
                    <td className="mono">
                      {c.prix != null ? (
                        c.promo_pourcentage ? (
                          <>
                            <s className="help-text" style={{ marginRight: 6 }}>{c.prix.toFixed(2)} €</s>
                            <span style={{ color: 'var(--color-promo)', fontWeight: 700 }}>
                              {(c.prix * (1 - c.promo_pourcentage / 100)).toFixed(2)} €
                            </span>
                          </>
                        ) : (
                          `${c.prix.toFixed(2)} €`
                        )
                      ) : '—'}
                    </td>
                    <td className="mono">
                      {c.commission_montant_estime != null ? (
                        c.promo_pourcentage && c.prix != null && c.commission_taux_estime != null ? (
                          <>
                            <s className="help-text" style={{ marginRight: 6 }}>
                              {(c.prix * c.commission_taux_estime / 100).toFixed(2)} €
                            </s>
                            <span style={{ color: 'var(--color-promo)', opacity: 0.85, fontWeight: 700 }}>
                              {c.commission_montant_estime.toFixed(2)} €
                            </span>
                          </>
                        ) : (
                          `${c.commission_montant_estime.toFixed(2)} €`
                        )
                      ) : '—'}
                    </td>
                    {/* #8A6416 : même doré foncé que le badge "Réservé" — le doré clair de
                        var(--color-accent) manque de contraste en texte sur fond blanc. */}
                    <td className="mono" style={{ color: '#8A6416', fontWeight: 700 }}>
                      {(() => {
                        if (c.prix == null || c.commission_montant_estime == null) return '—';
                        const prixEffectif = c.promo_pourcentage ? c.prix * (1 - c.promo_pourcentage / 100) : c.prix;
                        return `${(prixEffectif - c.commission_montant_estime).toFixed(2)} €`;
                      })()}
                    </td>
                    <td>{c.client_nom ? `${c.client_nom} · ${c.immatriculation}` : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 110 }}>
                        {c.statut === 'disponible' && (
                          <button type="button" style={{ padding: '4px 8px', fontSize: '0.76rem' }} onClick={() => ouvrirReservationManuelle(c)}>Prendre RDV</button>
                        )}
                        {c.statut !== 'reserve' && c.prix != null && (
                          <button type="button" className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.76rem' }} onClick={() => modifierPromoCreneau(c)}>
                            {c.promo_pourcentage ? 'Modifier promo' : '+ Promo'}
                          </button>
                        )}
                        {c.statut !== 'reserve' && (
                          <button className="btn-danger" style={{ padding: '4px 8px', fontSize: '0.76rem' }} onClick={() => supprimerCreneau(c.id)}>Supprimer</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </section>

        <section className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>Ajouter un créneau ponctuel</h2></div>
          <form className="grid-2" onSubmit={handleSingleSubmit}>
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label>Type de visite</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className={singleForm.type_visite === 'normale' ? '' : 'btn-secondary'}
                  onClick={() => setSingleForm({ ...singleForm, type_visite: 'normale', duree_minutes: 30 })}
                >
                  Visite normale
                </button>
                <button
                  type="button"
                  className={singleForm.type_visite === 'contre_visite' ? '' : 'btn-secondary'}
                  onClick={() => setSingleForm({ ...singleForm, type_visite: 'contre_visite', duree_minutes: 15 })}
                >
                  Contre-visite
                </button>
              </div>
              <p className="help-text">
                Une contre-visite est généralement plus courte et moins chère qu'un contrôle complet — libre à vous
                de fixer la durée et le prix qui vous conviennent.
              </p>
            </div>
            <div className="form-row">
              <label htmlFor="s_duree">Durée (minutes)</label>
              <input id="s_duree" type="number" min="5" max="120" step="5" required value={singleForm.duree_minutes}
                onChange={(e) => setSingleForm({ ...singleForm, duree_minutes: Number(e.target.value) })} />
            </div>
            <div className="form-row">
              <label htmlFor="s_date">Date</label>
              <input id="s_date" type="date" required value={singleForm.date}
                onChange={(e) => setSingleForm({ ...singleForm, date: e.target.value })} />
            </div>
            <div className="form-row">
              <label htmlFor="s_heure">Heure</label>
              <input id="s_heure" type="time" required value={singleForm.heure}
                onChange={(e) => setSingleForm({ ...singleForm, heure: e.target.value })} />
            </div>
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="s_prix">
                {singleForm.type_visite === 'contre_visite' ? 'Prix de la contre-visite (€ TTC, 0 si gratuite)' : 'Prix du contrôle technique (€ TTC)'}
              </label>
              <input
                id="s_prix" type="number" min="0" step="0.01" required placeholder="ex: 78"
                value={singleForm.type_visite === 'contre_visite' ? singleForm.prix_contre_visite : singleForm.prix_normale}
                onChange={(e) => setSingleForm({
                  ...singleForm,
                  [singleForm.type_visite === 'contre_visite' ? 'prix_contre_visite' : 'prix_normale']: e.target.value,
                })}
              />
              <p className="help-text" style={{ margin: '4px 0 0' }}>
                Prix propre à ce type de visite — changer de type ci-dessus ne modifie pas l'autre prix.
              </p>
            </div>
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="s_promo">Remise client (optionnel, en %)</label>
              <input
                id="s_promo" type="number" min="1" max="90" placeholder="Aucune remise si vide"
                value={singleForm.type_visite === 'contre_visite' ? singleForm.promo_pourcentage_contre_visite : singleForm.promo_pourcentage_normale}
                onChange={(e) => setSingleForm({
                  ...singleForm,
                  [singleForm.type_visite === 'contre_visite' ? 'promo_pourcentage_contre_visite' : 'promo_pourcentage_normale']: e.target.value,
                })}
              />
            </div>
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label>Réserver ce créneau à certains véhicules (optionnel)</label>
              <div className="type-vehicule-picker">
                {TYPES_VEHICULES.filter((t) => typesVehiculesCentre.includes(t.value)).map((t) => {
                  const coche = singleForm.types_vehicules.includes(t.value);
                  return (
                    <button
                      key={t.value}
                      type="button"
                      className="type-vehicule-chip"
                      style={coche ? { borderColor: t.couleur, background: t.couleur, color: '#fff' } : { borderColor: t.couleur, color: t.couleur }}
                      onClick={() => setSingleForm({
                        ...singleForm,
                        types_vehicules: coche
                          ? singleForm.types_vehicules.filter((v) => v !== t.value)
                          : [...singleForm.types_vehicules, t.value],
                      })}
                    >
                      <IconeVehicule icone={t.icone} size={16} color={coche ? '#fff' : t.couleur} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <p className="help-text">Rien de coché = ouvert à tous les véhicules acceptés par votre centre.</p>
            </div>
            <div className="form-row" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button type="submit" disabled={singleEnvoi}>{singleEnvoi ? 'Ajout en cours…' : 'Ajouter ce créneau'}</button>
              {singleEnvoi && <span className="help-text">⏳ Votre demande a bien été reçue, ne cliquez pas plusieurs fois.</span>}
              {!singleEnvoi && singleResultat && (
                <span className="help-text" style={{ color: singleResultat.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
                  {singleResultat.text}
                </span>
              )}
            </div>
          </form>
        </section>

        <section id="rdv" className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>Mes rendez-vous confirmés</h2></div>
          {rdvs === null ? (
            <p className="help-text">Chargement…</p>
          ) : rdvs.length === 0 ? (
            <div className="empty-state">Aucun rendez-vous confirmé pour le moment.</div>
          ) : (
            <div className="table-scroll">
            <table>
              <thead><tr><th>Date</th><th>Heure</th><th>Client</th><th>Véhicule</th><th>Téléphone</th><th>Immatriculation</th><th>Référence</th></tr></thead>
              <tbody>
                {rdvs.map((r) => {
                  const typeInfo = TYPES_VEHICULES.find((t) => t.value === r.type_vehicule);
                  return (
                    <tr key={r.id}>
                      <td className="mono">{formatDate(r.date)}</td>
                      <td className="mono">{r.heure}</td>
                      <td>{r.client_prenom ? `${r.client_prenom} ${r.client_nom}` : r.client_nom}</td>
                      <td>
                        {typeInfo ? (
                          <span className="vehicule-badge" style={{ background: typeInfo.couleur }}>
                            <IconeVehicule icone={typeInfo.icone} size={12} color="#fff" />
                            {typeInfo.label}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="mono">{r.client_telephone}</td>
                      <td className="mono">{r.immatriculation}</td>
                      <td className="mono">{r.reference}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </section>

        <section className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>Actions groupées sur une période</h2></div>
          <p className="help-text">
            Ouvrir, tarifer, remiser ou fermer plusieurs créneaux d'un coup sur une période donnée — dépliez
            l'outil dont vous avez besoin.
          </p>

          <div className="portee-ouverture">
            {porteeOuverture === null ? (
              <p className="help-text" style={{ margin: 0 }}>Vérification de ce qui est déjà ouvert…</p>
            ) : (
              <>
                <p style={{ margin: 0 }}>
                  Visite normale :{' '}
                  {porteeOuverture.normale
                    ? <>ouverte jusqu'au <strong>{formatDate(porteeOuverture.normale.derniere_date)}</strong> ({porteeOuverture.normale.nombre} créneau(x) à venir)</>
                    : <span className="help-text">aucun créneau ouvert pour l'instant</span>}
                </p>
                <p style={{ margin: '4px 0 0' }}>
                  Contre-visite :{' '}
                  {porteeOuverture.contre_visite
                    ? <>ouverte jusqu'au <strong>{formatDate(porteeOuverture.contre_visite.derniere_date)}</strong> ({porteeOuverture.contre_visite.nombre} créneau(x) à venir)</>
                    : <span className="help-text">aucun créneau ouvert pour l'instant</span>}
                </p>
              </>
            )}
          </div>

          <div className="horaires-ouverts">
            <p className="horaires-ouverts-titre">
              Horaires déjà ouverts du {formatDate(comblerForm.date_debut)} au {formatDate(comblerForm.date_fin)}
            </p>
            {horairesOuverts === null ? (
              <p className="help-text">Chargement…</p>
            ) : horairesOuverts.length === 0 ? (
              <p className="help-text">Rien d'ouvert sur cette période pour l'instant.</p>
            ) : (
              <>
                <div className="horaires-ouverts-liste">
                  {horairesOuverts.slice(0, 14).map((j) => (
                    <div key={j.date} className="horaires-ouverts-jour">
                      <span className="horaires-ouverts-date">{formatDate(j.date)}</span>
                      <span className="horaires-ouverts-type">
                        Visite normale : {j.normale.length > 0 ? j.normale.join(', ') : '—'}
                      </span>
                      <span className="horaires-ouverts-type">
                        Contre-visite : {j.contre_visite.length > 0 ? j.contre_visite.join(', ') : '—'}
                      </span>
                    </div>
                  ))}
                </div>
                {horairesOuverts.length > 14 && (
                  <p className="help-text">+ {horairesOuverts.length - 14} autre(s) jour(s) sur cette période.</p>
                )}
              </>
            )}
          </div>

          <div className="faq-liste" style={{ maxWidth: 'none', marginTop: 16 }}>
            <details className="faq-item">
              <summary className="faq-question"><span>Combler des horaires vides</span><ChevronAccordeon /></summary>
              <div style={{ padding: '0 20px 20px' }}>
                <p className="help-text">
                  Ouvrez d'un coup tous les créneaux libres sur une plage horaire, pour plusieurs jours —
                  idéal pour publier rapidement les trous de votre planning.
                </p>
                <form onSubmit={handleComblerSubmit}>
                  <div className="grid-2">
                    <div className="form-row">
                      <label htmlFor="date_debut">Du</label>
                      <input id="date_debut" type="date" required value={comblerForm.date_debut}
                        onChange={(e) => setComblerForm({ ...comblerForm, date_debut: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <label htmlFor="date_fin">Au</label>
                      <input id="date_fin" type="date" required value={comblerForm.date_fin}
                        onChange={(e) => setComblerForm({ ...comblerForm, date_fin: e.target.value })} />
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        {[
                          { label: '1 semaine', jours: 7 },
                          { label: '2 semaines', jours: 14 },
                          { label: '3 semaines', jours: 21 },
                          { label: '1 mois', jours: 30 },
                          { label: '2 mois', jours: 60 },
                          { label: '3 mois', jours: 90 },
                          { label: '6 mois', jours: 182 },
                          { label: 'Durée illimitée', jours: 730 },
                        ].map((opt) => (
                          <button
                            key={opt.jours}
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                            onClick={() => {
                              // "Durée illimitée" (et tout préréglage trop large) plantait
                              // avec "trop de créneaux en une seule fois" : un bouton
                              // fixait toujours +730 jours sans tenir compte du nombre de
                              // créneaux/jour réellement configuré (créneaux/jour × jours
                              // dépasse vite la limite de sécurité de 3000 par envoi).
                              // On calcule ici la durée max réellement faisable avec la
                              // config actuelle, et on ne dépasse jamais ce plafond.
                              const plagesActuelles = comblerForm.journeeContinue
                                ? [[comblerForm.heure_debut_continue, comblerForm.heure_fin_continue]]
                                : [[comblerForm.heure_debut_matin, comblerForm.heure_fin_matin], [comblerForm.heure_debut_apresmidi, comblerForm.heure_fin_apresmidi]];
                              const intervalle = Number(comblerForm.intervalle_minutes) || 30;
                              const slotsParJour = plagesActuelles.reduce((total, [d, f]) => {
                                const [hD, mD] = d.split(':').map(Number);
                                const [hF, mF] = f.split(':').map(Number);
                                const minutes = (hF * 60 + mF) - (hD * 60 + mD);
                                return total + (minutes > 0 ? Math.ceil(minutes / intervalle) : 0);
                              }, 0) || 1;
                              // 6 jours ouvrés sur 7 par défaut (pas de sélecteur de jours
                              // ici) ; marge de sécurité à 2800 (limite serveur : 3000).
                              const joursMaxSurs = Math.max(7, Math.floor((2800 / slotsParJour) * (7 / 6)));
                              const debut = comblerForm.date_debut ? new Date(comblerForm.date_debut + 'T00:00:00') : new Date();
                              debut.setDate(debut.getDate() + Math.min(opt.jours, joursMaxSurs));
                              setComblerForm({ ...comblerForm, date_fin: debut.toISOString().slice(0, 10) });
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-row" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <span className={`chip-checkbox ${comblerForm.journeeContinue ? 'coche' : ''}`} style={{ border: `1.5px solid var(--color-primary)`, background: comblerForm.journeeContinue ? 'var(--color-primary)' : 'transparent' }}>
                          {comblerForm.journeeContinue && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 12l6 6L20 6" />
                            </svg>
                          )}
                        </span>
                        <input
                          type="checkbox"
                          checked={comblerForm.journeeContinue}
                          onChange={(e) => setComblerForm({ ...comblerForm, journeeContinue: e.target.checked })}
                          style={{ display: 'none' }}
                        />
                        Journée continue (pas de pause déjeuner)
                      </label>
                    </div>

                    {comblerForm.journeeContinue ? (
                      <>
                        <div className="form-row">
                          <label htmlFor="heure_debut_continue">Heure de début</label>
                          <input id="heure_debut_continue" type="time" required value={comblerForm.heure_debut_continue}
                            onChange={(e) => setComblerForm({ ...comblerForm, heure_debut_continue: e.target.value })} />
                        </div>
                        <div className="form-row">
                          <label htmlFor="heure_fin_continue">Heure de fin</label>
                          <input id="heure_fin_continue" type="time" required value={comblerForm.heure_fin_continue}
                            onChange={(e) => setComblerForm({ ...comblerForm, heure_fin_continue: e.target.value })} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="form-row">
                          <label htmlFor="heure_debut_matin">Heure de début matin</label>
                          <input id="heure_debut_matin" type="time" required value={comblerForm.heure_debut_matin}
                            onChange={(e) => setComblerForm({ ...comblerForm, heure_debut_matin: e.target.value })} />
                        </div>
                        <div className="form-row">
                          <label htmlFor="heure_fin_matin">Heure de fin matin</label>
                          <input id="heure_fin_matin" type="time" required value={comblerForm.heure_fin_matin}
                            onChange={(e) => setComblerForm({ ...comblerForm, heure_fin_matin: e.target.value })} />
                        </div>
                        <div className="form-row">
                          <label htmlFor="heure_debut_apresmidi">Heure de début après-midi</label>
                          <input id="heure_debut_apresmidi" type="time" required value={comblerForm.heure_debut_apresmidi}
                            onChange={(e) => setComblerForm({ ...comblerForm, heure_debut_apresmidi: e.target.value })} />
                        </div>
                        <div className="form-row">
                          <label htmlFor="heure_fin_apresmidi">Heure de fin après-midi</label>
                          <input id="heure_fin_apresmidi" type="time" required value={comblerForm.heure_fin_apresmidi}
                            onChange={(e) => setComblerForm({ ...comblerForm, heure_fin_apresmidi: e.target.value })} />
                        </div>
                      </>
                    )}

                    <div className="form-row" style={{ gridColumn: '1 / -1' }}>
                      <label>Type de visite</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className={comblerForm.type_visite === 'normale' ? '' : 'btn-secondary'}
                          onClick={() => setComblerForm({ ...comblerForm, type_visite: 'normale', duree_minutes: 30 })}
                        >
                          Visite normale
                        </button>
                        <button
                          type="button"
                          className={comblerForm.type_visite === 'contre_visite' ? '' : 'btn-secondary'}
                          onClick={() => setComblerForm({ ...comblerForm, type_visite: 'contre_visite', duree_minutes: 15 })}
                        >
                          Contre-visite
                        </button>
                      </div>
                      <p className="help-text" style={{ margin: '6px 0 0' }}>
                        Impossible d'ouvrir une visite normale et une contre-visite au même horaire : un centre n'a qu'un
                        seul créneau par horaire, tous types confondus. Les deux types peuvent être ouverts en parallèle,
                        mais sur des horaires différents (ex : contre-visite à la pause déjeuner ou en fin de journée) —
                        voir le résumé ci-dessus pour ce qui est déjà pris.
                      </p>
                    </div>
                    <div className="form-row">
                      <label htmlFor="intervalle">Intervalle entre créneaux (min)</label>
                      <select id="intervalle" value={comblerForm.intervalle_minutes}
                        onChange={(e) => setComblerForm({ ...comblerForm, intervalle_minutes: e.target.value })}>
                        <option value="15">15</option>
                        <option value="30">30</option>
                        <option value="45">45</option>
                        <option value="60">60</option>
                      </select>
                    </div>
                    <div className="form-row">
                      <label htmlFor="duree">Durée d'une visite (minutes, libre)</label>
                      <input id="duree" type="number" min="5" max="120" step="5" required value={comblerForm.duree_minutes}
                        onChange={(e) => setComblerForm({ ...comblerForm, duree_minutes: Number(e.target.value) })} />
                    </div>
                    <div className="form-row">
                      <label htmlFor="combler_prix">
                        {comblerForm.type_visite === 'contre_visite' ? 'Prix de la contre-visite (€ TTC, 0 si gratuite)' : 'Prix du contrôle technique (€ TTC)'}
                      </label>
                      <input
                        id="combler_prix" type="number" min="0" step="0.01" required placeholder="ex: 78"
                        value={comblerForm.type_visite === 'contre_visite' ? comblerForm.prix_contre_visite : comblerForm.prix_normale}
                        onChange={(e) => setComblerForm({
                          ...comblerForm,
                          [comblerForm.type_visite === 'contre_visite' ? 'prix_contre_visite' : 'prix_normale']: e.target.value,
                        })}
                      />
                      <p className="help-text" style={{ margin: '4px 0 0' }}>
                        Prix propre à ce type de visite — changer de type ci-dessus ne modifie pas l'autre prix.
                      </p>
                    </div>
                    <div className="form-row">
                      <label htmlFor="combler_promo">Remise client (optionnel, en %)</label>
                      <input
                        id="combler_promo" type="number" min="1" max="90" placeholder="Aucune remise si vide"
                        value={comblerForm.type_visite === 'contre_visite' ? comblerForm.promo_pourcentage_contre_visite : comblerForm.promo_pourcentage_normale}
                        onChange={(e) => setComblerForm({
                          ...comblerForm,
                          [comblerForm.type_visite === 'contre_visite' ? 'promo_pourcentage_contre_visite' : 'promo_pourcentage_normale']: e.target.value,
                        })}
                      />
                    </div>
                    <div className="form-row" style={{ gridColumn: '1 / -1' }}>
                      <label>Réserver ce lot à certains véhicules (optionnel)</label>
                      <div className="type-vehicule-picker">
                        {TYPES_VEHICULES.filter((t) => typesVehiculesCentre.includes(t.value)).map((t) => {
                          const coche = comblerForm.types_vehicules.includes(t.value);
                          return (
                            <button
                              key={t.value}
                              type="button"
                              className="type-vehicule-chip"
                              style={coche ? { borderColor: t.couleur, background: t.couleur, color: '#fff' } : { borderColor: t.couleur, color: t.couleur }}
                              onClick={() => setComblerForm({
                                ...comblerForm,
                                types_vehicules: coche
                                  ? comblerForm.types_vehicules.filter((v) => v !== t.value)
                                  : [...comblerForm.types_vehicules, t.value],
                              })}
                            >
                              <span className="chip-checkbox" style={{ border: `1.5px solid ${coche ? '#fff' : t.couleur}`, background: coche ? '#fff' : 'transparent' }}>
                                {coche && (
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={t.couleur} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 12l6 6L20 6" />
                                  </svg>
                                )}
                              </span>
                              <IconeVehicule icone={t.icone} size={16} color={coche ? '#fff' : t.couleur} />
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                      <p className="help-text">Rien de coché = ouvert à tous les véhicules acceptés par votre centre.</p>
                    </div>
                  </div>
                  <p className="help-text">
                    Les créneaux existants ne sont jamais dupliqués ni écrasés — seuls les horaires encore vides sont ouverts.
                    La remise est entièrement à votre choix : si vous la laissez vide, le client paie le prix plein.
                  </p>
                  <p className="help-text">
                    Pour rappel (information interne, jamais affichée au client) : la commission Créneau CT est calculée
                    automatiquement sur le prix payé par le client, selon le délai de réservation (25% sous 7 jours, 20%
                    entre 7 et 14 jours, 15% au-delà) — vous la retrouverez dans le tableau ci-dessous.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <button type="submit" disabled={comblerEnvoi}>{comblerEnvoi ? 'Ouverture en cours…' : 'Ouvrir les créneaux'}</button>
                    {comblerEnvoi && <span className="help-text">⏳ Votre demande a bien été reçue, ne cliquez pas plusieurs fois.</span>}
                    {!comblerEnvoi && comblerResultat && (
                      <span className="help-text" style={{ color: comblerResultat.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
                        {comblerResultat.text}
                      </span>
                    )}
                  </div>
                </form>
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-question"><span>Appliquer une promotion sur une période</span><ChevronAccordeon /></summary>
              <div style={{ padding: '0 20px 20px' }}>
                <p className="help-text">
                  Contrairement à « Combler des horaires vides » (qui crée de nouveaux créneaux), cet outil modifie
                  directement les créneaux disponibles déjà ouverts. Vous pouvez l'utiliser plusieurs fois de suite avec
                  des périodes et des taux différents — par exemple 20 % sur la semaine du 3 au 9, puis 25 % sur celle
                  du 10 au 16, chaque période reste indépendante.
                </p>
                <form onSubmit={handleAppliquerPromoSubmit}>
                  <div className="grid-2">
                    <div className="form-row">
                      <label htmlFor="promo_date_debut">Du</label>
                      <input id="promo_date_debut" type="date" required value={promoPeriodeForm.date_debut}
                        onChange={(e) => setPromoPeriodeForm({ ...promoPeriodeForm, date_debut: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <label htmlFor="promo_date_fin">Au</label>
                      <input id="promo_date_fin" type="date" required value={promoPeriodeForm.date_fin}
                        onChange={(e) => setPromoPeriodeForm({ ...promoPeriodeForm, date_fin: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <label htmlFor="promo_periode_pourcentage">Remise à appliquer (%, vide pour la retirer)</label>
                      <input id="promo_periode_pourcentage" type="number" min="1" max="90" placeholder="ex: 20"
                        value={promoPeriodeForm.promo_pourcentage}
                        onChange={(e) => setPromoPeriodeForm({ ...promoPeriodeForm, promo_pourcentage: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <button type="submit" disabled={promoPeriodeEnvoi}>
                      {promoPeriodeEnvoi ? 'Application en cours…' : 'Appliquer à cette période'}
                    </button>
                    {promoPeriodeEnvoi && <span className="help-text">⏳ Votre demande a bien été reçue, ne cliquez pas plusieurs fois.</span>}
                    {!promoPeriodeEnvoi && promoPeriodeResultat && (
                      <span className="help-text" style={{ color: promoPeriodeResultat.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
                        {promoPeriodeResultat.text}
                      </span>
                    )}
                  </div>
                </form>
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-question"><span>Modifier le prix sur une période</span><ChevronAccordeon /></summary>
              <div style={{ padding: '0 20px 20px' }}>
                <p className="help-text">
                  Change le prix des créneaux <strong>encore disponibles</strong> d'une période déjà ouverte (jamais un
                  créneau déjà réservé, qui garde son prix). C'est l'outil à utiliser pour corriger un prix — rouvrir la
                  même période avec « Combler des horaires vides » ne change rien au prix déjà en place, puisque cet
                  outil ne touche jamais un créneau existant (pour ne jamais créer de doublon).
                </p>
                <form onSubmit={handlePrixPeriodeSubmit}>
                  <div className="grid-2">
                    <div className="form-row">
                      <label htmlFor="prix_date_debut">Du</label>
                      <input id="prix_date_debut" type="date" required value={prixPeriodeForm.date_debut}
                        onChange={(e) => setPrixPeriodeForm({ ...prixPeriodeForm, date_debut: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <label htmlFor="prix_date_fin">Au</label>
                      <input id="prix_date_fin" type="date" required value={prixPeriodeForm.date_fin}
                        onChange={(e) => setPrixPeriodeForm({ ...prixPeriodeForm, date_fin: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <label htmlFor="prix_periode_montant">Nouveau prix (€ TTC)</label>
                      <input id="prix_periode_montant" type="number" min="0" step="0.01" required placeholder="ex: 80"
                        value={prixPeriodeForm.prix}
                        onChange={(e) => setPrixPeriodeForm({ ...prixPeriodeForm, prix: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <label htmlFor="prix_periode_type">Type de visite</label>
                      <select id="prix_periode_type" value={prixPeriodeForm.type_visite}
                        onChange={(e) => setPrixPeriodeForm({ ...prixPeriodeForm, type_visite: e.target.value })}>
                        <option value="">Tous types confondus</option>
                        <option value="normale">Visite normale uniquement</option>
                        <option value="contre_visite">Contre-visite uniquement</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <button type="submit" disabled={prixPeriodeEnvoi}>
                      {prixPeriodeEnvoi ? 'Modification en cours…' : 'Modifier le prix de cette période'}
                    </button>
                    {prixPeriodeEnvoi && <span className="help-text">⏳ Votre demande a bien été reçue, ne cliquez pas plusieurs fois.</span>}
                    {!prixPeriodeEnvoi && prixPeriodeResultat && (
                      <span className="help-text" style={{ color: prixPeriodeResultat.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
                        {prixPeriodeResultat.text}
                      </span>
                    )}
                  </div>
                </form>
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-question"><span>Supprimer des créneaux sur une période</span><ChevronAccordeon /></summary>
              <div style={{ padding: '0 20px 20px' }}>
                <p className="help-text">
                  Supprime en une fois tous les créneaux <strong>encore disponibles</strong> (jamais un créneau déjà
                  réservé) sur la période choisie — utile par exemple si un lot a été ouvert avec le mauvais type de
                  visite ou le mauvais prix via « Combler des horaires vides », pour repartir de zéro sans tout supprimer
                  un par un.
                </p>
                <form onSubmit={handleSupprimerPeriodeSubmit}>
                  <div className="grid-2">
                    <div className="form-row">
                      <label htmlFor="suppr_date_debut">Du</label>
                      <input id="suppr_date_debut" type="date" required value={supprimerPeriodeForm.date_debut}
                        onChange={(e) => setSupprimerPeriodeForm({ ...supprimerPeriodeForm, date_debut: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <label htmlFor="suppr_date_fin">Au</label>
                      <input id="suppr_date_fin" type="date" required value={supprimerPeriodeForm.date_fin}
                        onChange={(e) => setSupprimerPeriodeForm({ ...supprimerPeriodeForm, date_fin: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <label htmlFor="suppr_type_visite">Type de visite à supprimer</label>
                      <select id="suppr_type_visite" value={supprimerPeriodeForm.type_visite}
                        onChange={(e) => setSupprimerPeriodeForm({ ...supprimerPeriodeForm, type_visite: e.target.value })}>
                        <option value="">Tous types confondus</option>
                        <option value="normale">Visite normale uniquement</option>
                        <option value="contre_visite">Contre-visite uniquement</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <button type="submit" className="btn-secondary" disabled={supprimerPeriodeEnvoi} style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
                      {supprimerPeriodeEnvoi ? 'Suppression en cours…' : 'Supprimer les créneaux disponibles de cette période'}
                    </button>
                    {supprimerPeriodeEnvoi && <span className="help-text">⏳ Votre demande a bien été reçue, ne cliquez pas plusieurs fois.</span>}
                    {!supprimerPeriodeEnvoi && supprimerPeriodeResultat && (
                      <span className="help-text" style={{ color: supprimerPeriodeResultat.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
                        {supprimerPeriodeResultat.text}
                      </span>
                    )}
                  </div>
                </form>
              </div>
            </details>
          </div>
        </section>
      </main>

      {creneauReservation && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setCreneauReservation(null)}>
          <div className="modal">
            <h2>Prendre un rendez-vous</h2>
            <div className="modal-recap">
              <strong>{centre.nom}</strong><br />
              {new Date(creneauReservation.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {creneauReservation.heure}
              {creneauReservation.prix != null && (
                <div style={{ marginTop: 6, fontWeight: 700 }}>{creneauReservation.prix.toFixed(2)}€ TTC</div>
              )}
            </div>
            <form onSubmit={handleReservationManuelle}>
              <div className="grid-2">
                <div className="form-row">
                  <label htmlFor="resa_prenom">Prénom du client</label>
                  <input id="resa_prenom" type="text" required value={formReservation.prenom}
                    onChange={(e) => setFormReservation({ ...formReservation, prenom: e.target.value })} />
                </div>
                <div className="form-row">
                  <label htmlFor="resa_nom">Nom du client</label>
                  <input id="resa_nom" type="text" required value={formReservation.nom}
                    onChange={(e) => setFormReservation({ ...formReservation, nom: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="resa_email">Email du client</label>
                <input id="resa_email" type="email" required value={formReservation.email}
                  onChange={(e) => setFormReservation({ ...formReservation, email: e.target.value })} />
              </div>
              <div className="form-row">
                <label htmlFor="resa_telephone">Téléphone du client</label>
                <input id="resa_telephone" type="tel" required value={formReservation.telephone}
                  onChange={(e) => setFormReservation({ ...formReservation, telephone: e.target.value })} />
              </div>
              <div className="form-row">
                <label htmlFor="resa_immat">Immatriculation</label>
                <input id="resa_immat" type="text" required placeholder="AA-123-BB" style={{ textTransform: 'uppercase' }}
                  value={formReservation.immatriculation}
                  onChange={(e) => setFormReservation({ ...formReservation, immatriculation: e.target.value })} />
              </div>
              <div className="form-row">
                <label htmlFor="resa_type">Type de véhicule</label>
                <select id="resa_type" required value={formReservation.type_vehicule}
                  onChange={(e) => setFormReservation({ ...formReservation, type_vehicule: e.target.value })}>
                  <option value="">Sélectionner…</option>
                  {TYPES_VEHICULES.filter((t) => typesVehiculesCentre.includes(t.value)).map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              {reservationErreur && <div className="message-banner error">{reservationErreur}</div>}
              <p className="help-text">
                Le client recevra automatiquement un email de confirmation avec le fichier calendrier, exactement
                comme pour une réservation en ligne.
              </p>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setCreneauReservation(null)}>Annuler</button>
                <button type="submit" disabled={reservationEnvoi}>{reservationEnvoi ? 'Enregistrement…' : 'Confirmer le rendez-vous'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: 40 }}><p className="help-text">Chargement…</p></div>}>
      <DashboardPageInner />
    </Suspense>
  );
}
