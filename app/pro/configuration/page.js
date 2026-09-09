'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProSidebar from '../../components/ProSidebar';
import { IconeVehicule } from '../../components/VehiculeIcons';
import { TYPES_VEHICULES, parseTypes } from '@/lib/vehicules';

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

function ConfigurationPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const centreIdParam = searchParams.get('centre');

  const [centre, setCentre] = useState(null);
  const [message, setMessage] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageEnvoi, setImageEnvoi] = useState(false);
  const [imageErreur, setImageErreur] = useState(null);

  const [icalUrl, setIcalUrl] = useState('');
  const [agendaEnvoi, setAgendaEnvoi] = useState(false);
  const [agendaMessage, setAgendaMessage] = useState(null);

  const [typesVehicules, setTypesVehicules] = useState([]);
  const [typesInitial, setTypesInitial] = useState([]);
  const [typesVehiculesEnvoi, setTypesVehiculesEnvoi] = useState(false);

  useEffect(() => {
    async function charger() {
      try {
        const url = centreIdParam ? `/api/pro/me?centre=${centreIdParam}` : '/api/pro/me';
        const { centre } = await api(url);
        setCentre(centre);
        setIcalUrl(centre.ical_url || '');
        const types = parseTypes(centre.types_vehicules_acceptes);
        setTypesVehicules(types);
        setTypesInitial(types);
      } catch {
        router.push('/pro/login');
      }
    }
    charger();
  }, [router, centreIdParam]);

  function toggleTypeVehicule(value) {
    setTypesVehicules((prev) => {
      // "Voiture sans permis" appartient à la même catégorie réglementaire (L)
      // que la moto — un centre qui ne fait pas de moto ne peut pas non plus
      // faire de voiture sans permis.
      if (value === 'sans_permis' && !prev.includes('moto')) return prev;
      if (value === 'moto' && prev.includes('moto')) {
        return prev.filter((v) => v !== 'moto' && v !== 'sans_permis');
      }
      return prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
    });
  }

  // Indicateur de modification non enregistrée : comparé au dernier état
  // effectivement sauvegardé, pas à l'état chargé au montage seul, pour bien
  // redevenir "à jour" juste après un enregistrement réussi.
  const typesModifies = JSON.stringify([...typesVehicules].sort()) !== JSON.stringify([...typesInitial].sort());

  async function handleImageChange(e) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setImageErreur(null);

    if (!fichier.type.startsWith('image/')) {
      setImageErreur('Merci de choisir un fichier image (JPG, PNG, WebP...).');
      return;
    }

    try {
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
    } catch (e) {
      setAgendaMessage({ type: 'error', text: e.message });
    } finally {
      setAgendaEnvoi(false);
    }
  }

  async function handleSaveTypesVehicules() {
    setTypesVehiculesEnvoi(true);
    try {
      await api('/api/pro/centre', {
        method: 'PATCH',
        body: JSON.stringify({ types_vehicules_acceptes: typesVehicules, centre_id: centre.id }),
      });
      setMessage({ type: 'success', text: 'Types de véhicules mis à jour.' });
      setTypesInitial(typesVehicules);
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setTypesVehiculesEnvoi(false);
    }
  }

  if (!centre) {
    return (
      <div className="pro-shell">
        <div className="pro-sidebar" style={{ opacity: 0.5 }} />
        <main className="pro-main"><p className="help-text">Chargement…</p></main>
      </div>
    );
  }

  return (
    <div className="pro-shell">
      <ProSidebar centreId={centre.id} />

      <main className="pro-main">
        <h1>Configuration du centre</h1>
        <p className="help-text">
          Ce qui se règle une fois puis se retouche rarement : photo, véhicules acceptés, agenda externe. Pour
          gérer votre planning au quotidien, direction le <Link href={`/pro/dashboard?centre=${centre.id}`}>tableau de bord</Link>.
        </p>

        {message && <div className={`message-banner ${message.type}`} style={{ marginTop: 16 }}>{message.text}</div>}

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

        <section id="vehicules" className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>Types de véhicules acceptés</h2></div>
          <p className="help-text">
            Cochez ce que votre centre est équipé pour contrôler. Ça détermine les icônes affichées côté client, et
            les types que vous pourrez proposer lors de l'ouverture de créneaux.
          </p>
          <div className="type-vehicule-picker">
            {TYPES_VEHICULES.map((t) => {
              const coche = typesVehicules.includes(t.value);
              const desactive = t.value === 'sans_permis' && !typesVehicules.includes('moto');
              return (
                <button
                  key={t.value}
                  type="button"
                  className="type-vehicule-chip"
                  disabled={desactive}
                  title={desactive ? "Nécessite d'abord d'accepter les motos/scooters (même catégorie réglementaire)" : undefined}
                  style={desactive
                    ? { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', opacity: 0.5, cursor: 'not-allowed' }
                    : coche ? { borderColor: t.couleur, background: t.couleur, color: '#fff' } : { borderColor: t.couleur, color: t.couleur }}
                  onClick={() => toggleTypeVehicule(t.value)}
                >
                  <span className="chip-checkbox" style={{ border: `1.5px solid ${coche ? '#fff' : (desactive ? 'var(--color-text-muted)' : t.couleur)}`, background: coche ? '#fff' : 'transparent' }}>
                    {coche && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={t.couleur} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12l6 6L20 6" />
                      </svg>
                    )}
                  </span>
                  <IconeVehicule icone={t.icone} size={16} color={coche ? '#fff' : (desactive ? 'var(--color-text-muted)' : t.couleur)} />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
            <button type="button" onClick={handleSaveTypesVehicules} disabled={typesVehiculesEnvoi || !typesModifies}>
              {typesVehiculesEnvoi ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            {typesModifies && !typesVehiculesEnvoi && (
              <span className="help-text" style={{ color: 'var(--color-promo)', fontWeight: 600 }}>
                ● Modifications non enregistrées
              </span>
            )}
          </div>
        </section>

        <section id="agenda" className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>Bloquer mes créneaux selon mon agenda</h2></div>
          <p className="help-text">
            Collez ici le lien iCal privé de votre agenda (Google Calendar : Paramètres → Intégrer l'agenda →
            « Adresse secrète au format iCal ». Outlook : Paramètres → Calendrier → Partager → « Publier un
            calendrier »). La synchronisation bloque automatiquement vos créneaux Créneau CT qui entrent en
            conflit avec un événement de votre agenda — lecture seule, rien n'est jamais écrit dans votre
            calendrier.
          </p>
          <p className="help-text">
            Vous cherchez plutôt à voir vos RDV Créneau CT dans votre propre agenda ? C'est l'inverse, disponible
            dans <Link href={`/pro/api?centre=${centre.id}`}>Clés API</Link>.
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
      </main>
    </div>
  );
}

export default function ConfigurationPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: 40 }}><p className="help-text">Chargement…</p></div>}>
      <ConfigurationPageInner />
    </Suspense>
  );
}
