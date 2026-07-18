'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/Logo';

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

export default function MesCentresPage() {
  const router = useRouter();
  const [centres, setCentres] = useState(null);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({ nom: '', adresse: '', code_postal: '', ville: '', telephone: '' });
  const [envoi, setEnvoi] = useState(false);
  const [afficherForm, setAfficherForm] = useState(false);

  async function charger() {
    try {
      const { centres } = await api('/api/pro/mes-centres');
      setCentres(centres);
    } catch (e) {
      if (e.status === 401) router.push('/pro/login');
    }
  }

  useEffect(() => { charger(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnvoi(true);
    setMessage(null);
    try {
      const { id } = await api('/api/pro/mes-centres', { method: 'POST', body: JSON.stringify(form) });
      setMessage({ type: 'success', text: 'Centre ajouté. Pensez à déclarer les types de véhicules acceptés depuis son tableau de bord.' });
      setForm({ nom: '', adresse: '', code_postal: '', ville: '', telephone: '' });
      setAfficherForm(false);
      charger();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="pro-shell">
      <aside className="pro-sidebar">
        <div className="brand"><Logo /> Espace pro</div>
        <nav>
          <Link href="/pro/dashboard">Tableau de bord</Link>
          <Link href="/pro/centres" className="active">Mes centres</Link>
        </nav>
      </aside>

      <main className="pro-main">
        <h1>Mes centres</h1>
        <p className="help-text">
          Gérez plusieurs centres depuis un seul compte : ajoutez-en un nouveau ici, puis basculez de l'un à
          l'autre depuis le tableau de bord.
        </p>

        {message && <div className={`message-banner ${message.type}`} style={{ marginTop: 16 }}>{message.text}</div>}

        {!centres ? (
          <p className="help-text" style={{ marginTop: 20 }}>Chargement…</p>
        ) : (
          <div style={{ marginTop: 20 }}>
            {centres.map((c) => (
              <Link key={c.id} href={`/pro/dashboard?centre=${c.id}`} className="facture-list-item">
                <div>
                  <strong>{c.nom}</strong>
                  <div className="help-text">{c.adresse}, {c.code_postal} {c.ville}</div>
                </div>
                <span className="help-text">Gérer →</span>
              </Link>
            ))}
          </div>
        )}

        <section className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <h2 style={{ margin: 0 }}>Ajouter un centre</h2>
            {!afficherForm && (
              <button type="button" className="btn-secondary" onClick={() => setAfficherForm(true)}>+ Nouveau centre</button>
            )}
          </div>

          {afficherForm && (
            <form onSubmit={handleSubmit} className="grid-2">
              <div className="form-row" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="nom">Nom du centre</label>
                <input id="nom" type="text" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
              </div>
              <div className="form-row" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="adresse">Adresse</label>
                <input id="adresse" type="text" required value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
              </div>
              <div className="form-row">
                <label htmlFor="code_postal">Code postal</label>
                <input id="code_postal" type="text" required maxLength={5} value={form.code_postal} onChange={(e) => setForm({ ...form, code_postal: e.target.value })} />
              </div>
              <div className="form-row">
                <label htmlFor="ville">Ville</label>
                <input id="ville" type="text" required value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
              </div>
              <div className="form-row" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="telephone">Téléphone (optionnel)</label>
                <input id="telephone" type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
              </div>
              <div className="form-row" style={{ gridColumn: '1 / -1', display: 'flex', gap: 10 }}>
                <button type="submit" disabled={envoi}>{envoi ? 'Ajout…' : 'Ajouter ce centre'}</button>
                <button type="button" className="btn-secondary" onClick={() => setAfficherForm(false)}>Annuler</button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
