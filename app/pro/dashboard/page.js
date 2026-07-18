'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/Logo';
import { CarIcon, MotoIcon } from '../../components/VehiculeIcons';
import { TYPES_VEHICULES, parseTypes } from '@/lib/vehicules';

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
    heure_debut: '09:00', heure_fin: '12:00',
    intervalle_minutes: 30, duree_minutes: 30, prix: '', promo_pourcentage: '', types_vehicules: [],
  });
  const [comblerEnvoi, setComblerEnvoi] = useState(false);

  const [singleForm, setSingleForm] = useState({ date: todayISO(), heure: '09:00', prix: '', promo_pourcentage: '', types_vehicules: [] });
  const [singleEnvoi, setSingleEnvoi] = useState(false);

  const [typesVehiculesCentre, setTypesVehiculesCentre] = useState([]);
  const [typesVehiculesEnvoi, setTypesVehiculesEnvoi] = useState(false);

  const chargerPlanning = useCallback(async () => {
    if (!centre) return;
    try {
      const { creneaux } = await api(`/api/pro/creneaux?debut=${todayISO()}&jours=14&centre=${centre.id}`);
      setPlanning(creneaux);
    } catch (e) {
      if (e.status === 401) router.push('/pro/login');
    }
  }, [router, centre]);

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
    }
  }, [centre, chargerPlanning, chargerRdvs]);

  function toggleTypeVehiculeCentre(value) {
    setTypesVehiculesCentre((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
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
      const data = await api('/api/pro/creneaux/combler-vides', {
        method: 'POST',
        body: JSON.stringify({
          ...comblerForm,
          intervalle_minutes: Number(comblerForm.intervalle_minutes),
          duree_minutes: Number(comblerForm.duree_minutes),
          prix: Number(comblerForm.prix),
          promo_pourcentage: comblerForm.promo_pourcentage ? Number(comblerForm.promo_pourcentage) : null,
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
          <a href="#vehicules" className="active">Véhicules acceptés</a>
          <a href="#combler">Combler des horaires vides</a>
          <a href="#planning">Mon planning</a>
          <a href="#rdv">Mes rendez-vous</a>
          <Link href={`/pro/factures?centre=${centre.id}`}>Mes factures</Link>
          <Link href="/pro/centres">Mes centres</Link>
        </nav>
        <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <p style={{ fontSize: '0.85rem', color: '#cfe0d2', marginBottom: 10 }}>{controleur.nom}</p>
          <button className="btn-secondary" style={{ width: '100%', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }} onClick={logout}>
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="pro-main">
        <h1>{centre.nom}</h1>
        <p className="help-text">{centre.adresse}, {centre.code_postal} {centre.ville}</p>

        {message && (
          <div className={`message-banner ${message.type}`} style={{ marginTop: 16 }}>{message.text}</div>
        )}

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
                  {t.categorie === 'moto' ? <MotoIcon size={16} /> : <CarIcon size={16} />}
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
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {[{ label: '1 semaine', jours: 7 }, { label: '2 semaines', jours: 14 }, { label: '3 semaines', jours: 21 }].map((opt) => (
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
              <div className="form-row">
                <label htmlFor="heure_debut">Heure de début</label>
                <input id="heure_debut" type="time" required value={comblerForm.heure_debut}
                  onChange={(e) => setComblerForm({ ...comblerForm, heure_debut: e.target.value })} />
              </div>
              <div className="form-row">
                <label htmlFor="heure_fin">Heure de fin</label>
                <input id="heure_fin" type="time" required value={comblerForm.heure_fin}
                  onChange={(e) => setComblerForm({ ...comblerForm, heure_fin: e.target.value })} />
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
                        {t.categorie === 'moto' ? <MotoIcon size={16} /> : <CarIcon size={16} />}
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
                      {t.categorie === 'moto' ? <MotoIcon size={16} /> : <CarIcon size={16} />}
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
          <div className="card-header"><h2 style={{ margin: 0 }}>Mon planning (14 prochains jours)</h2></div>
          {planning === null ? (
            <p className="help-text">Chargement…</p>
          ) : planning.length === 0 ? (
            <div className="empty-state">Aucun créneau programmé. Utilisez le formulaire ci-dessus pour en ouvrir.</div>
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
                    <td>{c.statut !== 'reserve' && <button className="btn-danger" onClick={() => supprimerCreneau(c.id)}>Supprimer</button>}</td>
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
              <thead><tr><th>Date</th><th>Heure</th><th>Client</th><th>Téléphone</th><th>Immatriculation</th><th>Référence</th></tr></thead>
              <tbody>
                {rdvs.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{formatDate(r.date)}</td>
                    <td className="mono">{r.heure}</td>
                    <td>{r.client_nom}</td>
                    <td className="mono">{r.client_telephone}</td>
                    <td className="mono">{r.immatriculation}</td>
                    <td className="mono">{r.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </section>
      </main>
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
