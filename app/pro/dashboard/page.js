'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '../../components/Logo';

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

export default function DashboardPage() {
  const router = useRouter();
  const [controleur, setControleur] = useState(null);
  const [centre, setCentre] = useState(null);
  const [message, setMessage] = useState(null);
  const [planning, setPlanning] = useState(null);
  const [rdvs, setRdvs] = useState(null);

  const [comblerForm, setComblerForm] = useState({
    date_debut: todayISO(), date_fin: todayISO(6),
    heure_debut: '09:00', heure_fin: '12:00',
    intervalle_minutes: 30, duree_minutes: 30, promo_pourcentage: '',
  });
  const [comblerEnvoi, setComblerEnvoi] = useState(false);

  const [singleForm, setSingleForm] = useState({ date: todayISO(), heure: '09:00', promo_pourcentage: '' });
  const [singleEnvoi, setSingleEnvoi] = useState(false);

  const chargerPlanning = useCallback(async () => {
    try {
      const { creneaux } = await api(`/api/pro/creneaux?debut=${todayISO()}&jours=14`);
      setPlanning(creneaux);
    } catch (e) {
      if (e.status === 401) router.push('/pro/login');
    }
  }, [router]);

  const chargerRdvs = useCallback(async () => {
    try {
      const { rdvs } = await api('/api/pro/rdv');
      setRdvs(rdvs);
    } catch (e) {
      if (e.status === 401) router.push('/pro/login');
    }
  }, [router]);

  useEffect(() => {
    async function init() {
      try {
        const { controleur, centre } = await api('/api/pro/me');
        setControleur(controleur);
        setCentre(centre);
        chargerPlanning();
        chargerRdvs();
      } catch (e) {
        router.push('/pro/login');
      }
    }
    init();
  }, [router, chargerPlanning, chargerRdvs]);

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
          promo_pourcentage: comblerForm.promo_pourcentage ? Number(comblerForm.promo_pourcentage) : null,
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
          promo_pourcentage: singleForm.promo_pourcentage ? Number(singleForm.promo_pourcentage) : null,
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
        <nav>
          <a href="#combler" className="active">Combler des horaires vides</a>
          <a href="#planning">Mon planning</a>
          <a href="#rdv">Mes rendez-vous</a>
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

        <section id="combler" className="card" style={{ marginTop: 24 }}>
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
            </div>
            <div className="form-row">
              <label htmlFor="combler_promo">Promotion sur ces créneaux (optionnel, en %)</label>
              <input id="combler_promo" type="number" min="1" max="90" placeholder="ex: 20" value={comblerForm.promo_pourcentage}
                onChange={(e) => setComblerForm({ ...comblerForm, promo_pourcentage: e.target.value })} />
            </div>
            <p className="help-text">Les créneaux existants ne sont jamais dupliqués ni écrasés — seuls les horaires encore vides sont ouverts.</p>
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
              <label htmlFor="s_promo">Promotion (optionnel, en %)</label>
              <input id="s_promo" type="number" min="1" max="90" placeholder="ex: 20" value={singleForm.promo_pourcentage}
                onChange={(e) => setSingleForm({ ...singleForm, promo_pourcentage: e.target.value })} />
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
            <table>
              <thead><tr><th>Date</th><th>Heure</th><th>Statut</th><th>Promo</th><th>Client</th><th></th></tr></thead>
              <tbody>
                {planning.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{formatDate(c.date)}</td>
                    <td className="mono">{c.heure}</td>
                    <td><span className={`badge ${c.statut === 'disponible' ? 'disponible' : 'reserve'}`}>{c.statut === 'disponible' ? 'Disponible' : 'Réservé'}</span></td>
                    <td>{c.promo_pourcentage ? <span className="promo-badge-inline">-{c.promo_pourcentage}%</span> : '—'}</td>
                    <td>{c.client_nom ? `${c.client_nom} — ${c.immatriculation}` : '—'}</td>
                    <td>{c.statut === 'disponible' && <button className="btn-danger" onClick={() => supprimerCreneau(c.id)}>Supprimer</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section id="rdv" className="card">
          <div className="card-header"><h2 style={{ margin: 0 }}>Mes rendez-vous confirmés</h2></div>
          {rdvs === null ? (
            <p className="help-text">Chargement…</p>
          ) : rdvs.length === 0 ? (
            <div className="empty-state">Aucun rendez-vous confirmé pour le moment.</div>
          ) : (
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
          )}
        </section>
      </main>
    </div>
  );
}
