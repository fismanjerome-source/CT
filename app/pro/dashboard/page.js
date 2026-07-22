'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/Logo';
import Horloge from '../../components/Horloge';
import { IconeVehicule } from '../../components/VehiculeIcons';
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
    intervalle_minutes: 30, duree_minutes: 30, prix: '', promo_pourcentage: '', types_vehicules: [],
  });
  const [comblerEnvoi, setComblerEnvoi] = useState(false);

  const [singleForm, setSingleForm] = useState({ date: todayISO(), heure: '09:00', prix: '', promo_pourcentage: '', types_vehicules: [] });
  const [singleEnvoi, setSingleEnvoi] = useState(false);

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
  const [icalUrl, setIcalUrl] = useState('');
  const [agendaEnvoi, setAgendaEnvoi] = useState(false);
  const [agendaMessage, setAgendaMessage] = useState(null);
  const [typesVehiculesEnvoi, setTypesVehiculesEnvoi] = useState(false);
  const [semaineOffset, setSemaineOffset] = useState(0);
  const [imagePreview, setImagePreview] = useState(null); // { data, mime } en attente d'enregistrement
  const [imageEnvoi, setImageEnvoi] = useState(false);
  const [imageErreur, setImageErreur] = useState(null);

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

  useEffect(() => {
    async function init() {
      try {
        const url = centreActifId ? `/api/pro/me?centre=${centreActifId}` : '/api/pro/me';
        const { controleur, centre, mesCentres } = await api(url);
        setControleur(controleur);
        setCentre(centre);
        setMesCentres(mesCentres || []);
        setTypesVehiculesCentre(parseTypes(centre.types_vehicules_acceptes));
        setIcalUrl(centre.ical_url || '');
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

  function toggleTypeVehiculeCentre(value) {
    setTypesVehiculesCentre((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function redimensionnerImage(fichier, dimensionMax = 1200, qualite = 0.82) {
    return new Promise((resolve, reject) => {
      const lecteur = new FileReader();
      lecteur.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > height && width > dimensionMax) {
            height = Math.round((height * dimensionMax) / width);
            width = dimensionMax;
          } else if (height > dimensionMax) {
            width = Math.round((width * dimensionMax) / height);
            height = dimensionMax;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', qualite));
        };
        img.onerror = () => reject(new Error("Impossible de lire cette image."));
        img.src = e.target.result;
      };
      lecteur.onerror = () => reject(new Error('Erreur de lecture du fichier.'));
      lecteur.readAsDataURL(fichier);
    });
  }

  async function handleImageChange(e) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setImageErreur(null);

    if (!fichier.type.startsWith('image/')) {
      setImageErreur('Merci de choisir un fichier image (JPG, PNG, WebP...).');
      return;
    }

    try {
      // Redimensionnée et compressée automatiquement — n'importe quelle
      // photo (même une photo brute de téléphone) est acceptée, le fichier
      // final envoyé au serveur reste toujours léger.
      const dataUrl = await redimensionnerImage(fichier);
      const [entete, donnees] = dataUrl.split(',');
      const mime = entete.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
      setImagePreview({ data: donnees, mime, apercu: dataUrl });
    } catch {
      setImageErreur("Impossible de traiter cette image. Essayez-en une autre.");
    }
  }

  async function handleSaveImage() {
    if (!imagePreview) return;
    setImageEnvoi(true);
    setImageErreur(null);
    try {
      await api('/api/pro/centre', {
        method: 'PATCH',
        body: JSON.stringify({ image_data: imagePreview.data, image_mime: imagePreview.mime, centre_id: centre.id }),
      });
      setMessage({ type: 'success', text: 'Image du centre mise à jour.' });
      setImagePreview(null);
      const { centre: centreMisAJour } = await api(`/api/pro/me?centre=${centre.id}`);
      setCentre(centreMisAJour);
    } catch (e) {
      setImageErreur(e.message);
    } finally {
      setImageEnvoi(false);
    }
  }

  async function handleRemoveImage() {
    setImageEnvoi(true);
    try {
      await api('/api/pro/centre', {
        method: 'PATCH',
        body: JSON.stringify({ image_data: null, image_mime: null, centre_id: centre.id }),
      });
      setMessage({ type: 'success', text: 'Image retirée.' });
      setImagePreview(null);
      const { centre: centreMisAJour } = await api(`/api/pro/me?centre=${centre.id}`);
      setCentre(centreMisAJour);
    } catch (e) {
      setImageErreur(e.message);
    } finally {
      setImageEnvoi(false);
    }
  }

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

  async function handleSaveAgenda() {
    setAgendaEnvoi(true);
    setAgendaMessage(null);
    try {
      await api('/api/pro/centre', {
        method: 'PATCH',
        body: JSON.stringify({ ical_url: icalUrl, centre_id: centre.id }),
      });
      setAgendaMessage({ type: 'success', text: 'Lien agenda enregistré.' });
    } catch (e) {
      setAgendaMessage({ type: 'error', text: e.message });
    } finally {
      setAgendaEnvoi(false);
    }
  }

  async function handleSyncAgenda() {
    setAgendaEnvoi(true);
    setAgendaMessage(null);
    try {
      const data = await api('/api/pro/centre/sync-agenda', {
        method: 'POST',
        body: JSON.stringify({ centre_id: centre.id }),
      });
      setAgendaMessage({ type: 'success', text: data.message });
      chargerPlanning();
    } catch (e) {
      setAgendaMessage({ type: 'error', text: e.message });
    } finally {
      setAgendaEnvoi(false);
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

  async function handleSaveTypesVehicules() {
    setTypesVehiculesEnvoi(true);
    try {
      await api('/api/pro/centre', {
        method: 'PATCH',
        body: JSON.stringify({ types_vehicules_acceptes: typesVehiculesCentre, centre_id: centre.id }),
      });
      setMessage({ type: 'success', text: 'Types de véhicules mis à jour.' });
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setTypesVehiculesEnvoi(false);
    }
  }

  async function handleComblerSubmit(e) {
    e.preventDefault();
    setComblerEnvoi(true);
    try {
      const plages = comblerForm.journeeContinue
        ? [{ heure_debut: comblerForm.heure_debut_continue, heure_fin: comblerForm.heure_fin_continue }]
        : [
            { heure_debut: comblerForm.heure_debut_matin, heure_fin: comblerForm.heure_fin_matin },
            { heure_debut: comblerForm.heure_debut_apresmidi, heure_fin: comblerForm.heure_fin_apresmidi },
          ];
      const data = await api('/api/pro/creneaux/combler-vides', {
        method: 'POST',
        body: JSON.stringify({
          date_debut: comblerForm.date_debut,
          date_fin: comblerForm.date_fin,
          plages,
          intervalle_minutes: Number(comblerForm.intervalle_minutes),
          duree_minutes: Number(comblerForm.duree_minutes),
          prix: Number(comblerForm.prix),
          promo_pourcentage: comblerForm.promo_pourcentage ? Number(comblerForm.promo_pourcentage) : null,
          types_vehicules: comblerForm.types_vehicules,
          centre_id: centre.id,
        }),
      });
      setMessage({ type: 'success', text: data.message });
      chargerPlanning();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setComblerEnvoi(false);
    }
  }

  async function handleSingleSubmit(e) {
    e.preventDefault();
    setSingleEnvoi(true);
    try {
      await api('/api/pro/creneaux', {
        method: 'POST',
        body: JSON.stringify({
          ...singleForm,
          prix: Number(singleForm.prix),
          promo_pourcentage: singleForm.promo_pourcentage ? Number(singleForm.promo_pourcentage) : null,
          centre_id: centre.id,
        }),
      });
      setMessage({ type: 'success', text: 'Créneau ajouté.' });
      chargerPlanning();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
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

  async function logout() {
    await api('/api/pro/logout', { method: 'POST' });
    router.push('/pro/login');
  }

  if (!controleur || !centre) {
    return <div className="container" style={{ padding: 40 }}><p className="help-text">Chargement…</p></div>;
  }

  return (
    <div className="pro-shell">
      <aside className="pro-sidebar">
        <div className="brand"><Logo /> Espace pro</div>
        <Horloge />

        {mesCentres.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: '0.72rem', color: '#cfe0d2', display: 'block', marginBottom: 4 }}>Centre géré</label>
            <select
              value={centre.id}
              onChange={(e) => router.push(`/pro/dashboard?centre=${e.target.value}`)}
              style={{ width: '100%' }}
            >
              {mesCentres.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
        )}

        <nav>
          <a href="#image" className="active">🖼️ Image du centre</a>
          <a href="#agenda">📅 Mon agenda externe</a>
          <a href="#vehicules">🚗 Véhicules acceptés</a>
          <a href="#combler">🗓️ Combler des horaires vides</a>
          <a href="#planning">📆 Mon planning</a>
          <a href="#rdv">✅ Mes rendez-vous</a>
          <Link href="/pro/clients">🚗 Mes RDV clients</Link>
          <Link href="/pro/absences">🚫 Client absent</Link>
          <Link href={`/pro/factures?centre=${centre.id}`}>🧾 Mes factures</Link>
          <Link href="/pro/centres">🏢 Mes centres</Link>
          <Link href="/pro/parametres">⚙️ Paramètres</Link>
          <Link href="/pro/contact">💬 Contact Créneau CT</Link>
        </nav>
        <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <p style={{ fontSize: '0.85rem', color: '#cfe0d2', marginBottom: 10 }}>{controleur.nom}</p>
          <button className="btn-secondary" style={{ width: '100%', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }} onClick={logout}>
            Se déconnecter
          </button>
        </div>
      </aside>

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
                  <strong>{statutPaiement.mois_en_cours.montant.toFixed(2)} €</strong> de commission générés ce
                  mois-ci — à régler avant le 10 du mois suivant.
                </>
              ) : (
                <strong>Aucune commission due pour le moment.</strong>
              )}
            </div>
          </div>
        )}

        {promotionActive && (
          <div className="paiements-banner ok" style={{ marginTop: 16, borderColor: 'var(--color-accent)', background: 'var(--color-promo-bg)', color: 'var(--color-promo)' }}>
            <div>
              🎉 <strong>Promotion en cours : {promotionActive.nom}</strong>
              <span className="mono" style={{ display: 'block', marginTop: 4 }}>
                Taux réduits : {promotionActive.taux_semaine1}% / {promotionActive.taux_semaine2}% / {promotionActive.taux_semaine3}%
                (au lieu de 30% / 25% / 20%)
              </span>
              <span className="help-text" style={{ display: 'block', marginTop: 4, color: 'inherit', opacity: 0.8 }}>
                Valable jusqu'au {new Date(promotionActive.date_fin).toLocaleDateString('fr-FR')}.
              </span>
            </div>
          </div>
        )}

        {message && (
          <div className={`message-banner ${message.type}`} style={{ marginTop: 16 }}>{message.text}</div>
        )}

        <section id="image" className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>Image de mon centre</h2></div>
          <p className="help-text">
            Une photo de votre centre ou le logo de votre enseigne — elle sera mise en avant sur la page d'accueil
            et partout où votre centre apparaît. Choisissez la photo que vous voulez (JPG, PNG, WebP...), y compris
            directement depuis votre téléphone : elle est automatiquement redimensionnée et optimisée à l'envoi,
            aucune limite de taille à surveiller de votre côté.
          </p>

          {imageErreur && <div className="message-banner error">{imageErreur}</div>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div className="centre-image-apercu">
              {imagePreview ? (
                <img src={imagePreview.apercu} alt="Aperçu" />
              ) : centre.image_data ? (
                <img src={`data:${centre.image_mime};base64,${centre.image_data}`} alt={centre.nom} />
              ) : (
                <span className="help-text" style={{ fontSize: '0.72rem', textAlign: 'center' }}>Aucune image</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              <div style={{ display: 'flex', gap: 8 }}>
                {imagePreview && (
                  <button type="button" onClick={handleSaveImage} disabled={imageEnvoi}>
                    {imageEnvoi ? 'Enregistrement…' : 'Enregistrer cette image'}
                  </button>
                )}
                {(centre.image_data || imagePreview) && (
                  <button type="button" className="btn-danger" onClick={handleRemoveImage} disabled={imageEnvoi}>
                    Retirer l'image
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="agenda" className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>Mon agenda externe</h2></div>
          <p className="help-text">
            Collez ici le lien iCal privé de votre agenda (Google Calendar : Paramètres → Intégrer l'agenda →
            « Adresse secrète au format iCal ». Outlook : Paramètres → Calendrier → Partager → « Publier un
            calendrier »). La synchronisation bloque automatiquement vos créneaux Créneau CT qui entrent en
            conflit avec un événement de votre agenda — lecture seule, rien n'est jamais écrit dans votre
            calendrier.
          </p>

          {agendaMessage && <div className={`message-banner ${agendaMessage.type}`}>{agendaMessage.text}</div>}

          <div className="form-row">
            <label htmlFor="ical_url">Lien iCal privé</label>
            <input
              id="ical_url"
              type="url"
              placeholder="https://calendar.google.com/calendar/ical/.../private-xxxx/basic.ics"
              value={icalUrl}
              onChange={(e) => setIcalUrl(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-secondary" onClick={handleSaveAgenda} disabled={agendaEnvoi}>
              Enregistrer le lien
            </button>
            <button type="button" onClick={handleSyncAgenda} disabled={agendaEnvoi || !centre.ical_url}>
              {agendaEnvoi ? 'Synchronisation…' : 'Synchroniser maintenant'}
            </button>
          </div>
          <p className="help-text" style={{ marginTop: 10 }}>
            ✅ Une fois ce lien enregistré, votre agenda est mis à jour automatiquement à intervalles réguliers
            (toutes les 15 minutes) — aucun risque qu'un créneau déjà pris de votre côté soit proposé en
            double sur Créneau CT.
          </p>
          <p className="help-text">
            Une question sur la sécurité de ce lien ? <Link href="/securite" target="_blank">Consultez notre page dédiée</Link>.
          </p>
        </section>

        <section id="vehicules" className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>Types de véhicules acceptés</h2></div>
          <p className="help-text">
            Cochez ce que votre centre est équipé pour contrôler. Ça détermine les icônes affichées côté client, et
            les types que vous pourrez proposer lors de l'ouverture de créneaux.
          </p>
          <div className="type-vehicule-picker">
            {TYPES_VEHICULES.map((t) => {
              const coche = typesVehiculesCentre.includes(t.value);
              return (
                <button
                  key={t.value}
                  type="button"
                  className="type-vehicule-chip"
                  style={coche ? { borderColor: t.couleur, background: t.couleur, color: '#fff' } : { borderColor: t.couleur, color: t.couleur }}
                  onClick={() => toggleTypeVehiculeCentre(t.value)}
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
          <button type="button" onClick={handleSaveTypesVehicules} disabled={typesVehiculesEnvoi} style={{ marginTop: 14 }}>
            {typesVehiculesEnvoi ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </section>

        <section id="combler" className="card">
          <div className="card-header"><h2 style={{ margin: 0 }}>Combler des horaires vides</h2></div>
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
                  ].map((opt) => (
                    <button
                      key={opt.jours}
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                      onClick={() => {
                        const debut = comblerForm.date_debut ? new Date(comblerForm.date_debut + 'T00:00:00') : new Date();
                        debut.setDate(debut.getDate() + opt.jours);
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
                <label htmlFor="duree">Durée d'un contrôle (min)</label>
                <select id="duree" value={comblerForm.duree_minutes}
                  onChange={(e) => setComblerForm({ ...comblerForm, duree_minutes: e.target.value })}>
                  <option value="30">30</option>
                  <option value="45">45</option>
                  <option value="60">60</option>
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="combler_prix">Prix du contrôle technique (€)</label>
                <input id="combler_prix" type="number" min="1" step="0.01" required placeholder="ex: 78" value={comblerForm.prix}
                  onChange={(e) => setComblerForm({ ...comblerForm, prix: e.target.value })} />
              </div>
              <div className="form-row">
                <label htmlFor="combler_promo">Remise client (optionnel, en %)</label>
                <input id="combler_promo" type="number" min="1" max="90" placeholder="Aucune remise si vide" value={comblerForm.promo_pourcentage}
                  onChange={(e) => setComblerForm({ ...comblerForm, promo_pourcentage: e.target.value })} />
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
              automatiquement sur le prix payé par le client, selon le délai de réservation (30% sous 7 jours, 25%
              entre 7 et 14 jours, 20% au-delà) — vous la retrouverez dans le tableau ci-dessous.
            </p>
            <button type="submit" disabled={comblerEnvoi}>{comblerEnvoi ? 'Ouverture…' : 'Ouvrir les créneaux'}</button>
          </form>
        </section>

        <section className="card">
          <div className="card-header"><h2 style={{ margin: 0 }}>Ajouter un créneau ponctuel</h2></div>
          <form className="grid-2" onSubmit={handleSingleSubmit}>
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
              <label htmlFor="s_prix">Prix du contrôle technique (€)</label>
              <input id="s_prix" type="number" min="1" step="0.01" required placeholder="ex: 78" value={singleForm.prix}
                onChange={(e) => setSingleForm({ ...singleForm, prix: e.target.value })} />
            </div>
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="s_promo">Remise client (optionnel, en %)</label>
              <input id="s_promo" type="number" min="1" max="90" placeholder="Aucune remise si vide" value={singleForm.promo_pourcentage}
                onChange={(e) => setSingleForm({ ...singleForm, promo_pourcentage: e.target.value })} />
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
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" disabled={singleEnvoi}>{singleEnvoi ? 'Ajout…' : 'Ajouter ce créneau'}</button>
            </div>
          </form>
        </section>

        <section id="planning" className="card">
          <div className="card-header"><h2 style={{ margin: 0 }}>Mon planning</h2></div>

          <div className="semaine-pagination">
            <button type="button" className="btn-secondary" onClick={() => setSemaineOffset((s) => Math.max(0, s - 1))} disabled={semaineOffset === 0}>
              ← Précédente
            </button>
            <span className="semaine-label">
              Semaine du {new Date(todayISO(semaineOffset * 7) + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              {' '}au {new Date(todayISO(semaineOffset * 7 + 6) + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
            <button type="button" className="btn-secondary" onClick={() => setSemaineOffset((s) => s + 1)}>
              Suivante →
            </button>
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
            <p className="help-text">Chargement…</p>
          ) : planning.length === 0 ? (
            <div className="empty-state">Aucun créneau programmé cette semaine-là. Utilisez le formulaire ci-dessus pour en ouvrir.</div>
          ) : (
            <div className="table-scroll">
            <table>
              <thead><tr><th>Date</th><th>Heure</th><th>Statut</th><th>Véhicules</th><th>Promo</th><th>Prix client</th><th>Commission CT</th><th>Prix après commission</th><th>Client</th><th></th></tr></thead>
              <tbody>
                {planning.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{formatDate(c.date)}</td>
                    <td className="mono">{c.heure}</td>
                    <td>
                      <span className={`badge ${c.statut === 'disponible' ? 'disponible' : 'reserve'}`}>
                        {c.statut === 'disponible' ? 'Disponible' : c.statut === 'bloque' ? 'Bloqué (agenda)' : 'Réservé'}
                      </span>
                    </td>
                    <td className="help-text">{c.types_vehicules ? parseTypes(c.types_vehicules).map((v) => TYPES_VEHICULES.find((t) => t.value === v)?.label).join(', ') : 'Tous'}</td>
                    <td>{c.promo_pourcentage ? <span className="promo-badge-inline">-{c.promo_pourcentage}%</span> : '—'}</td>
                    <td className="mono">{c.prix != null ? `${c.prix.toFixed(2)} €` : '—'}</td>
                    <td className="mono">{c.commission_montant_estime != null ? `${c.commission_montant_estime.toFixed(2)} €` : '—'}</td>
                    <td className="mono" style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                      {c.prix != null && c.commission_montant_estime != null ? `${(c.prix - c.commission_montant_estime).toFixed(2)} €` : '—'}
                    </td>
                    <td>{c.client_nom ? `${c.client_nom} — ${c.immatriculation}` : '—'}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      {c.statut === 'disponible' && (
                        <button type="button" onClick={() => ouvrirReservationManuelle(c)}>Prendre un RDV</button>
                      )}
                      {c.statut !== 'reserve' && <button className="btn-danger" onClick={() => supprimerCreneau(c.id)}>Supprimer</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </section>

        <section id="rdv" className="card">
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
