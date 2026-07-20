'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/Logo';
import AlertePaiements from '../../components/AlertePaiements';

function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

const STATUTS = {
  active: { label: 'Active', classe: 'disponible' },
  a_venir: { label: 'À venir', classe: 'disponible' },
  terminee: { label: 'Terminée', classe: 'reserve' },
};

export default function AdminPromotionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [promotions, setPromotions] = useState(null);
  const [centres, setCentres] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [afficherForm, setAfficherForm] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [form, setForm] = useState({
    centre_id: '', nom: '', taux_semaine1: 30, taux_semaine2: 25, taux_semaine3: 20,
    date_debut: todayISO(), date_fin: todayISO(30),
  });

  async function charger() {
    try {
      const [promoRes, centresRes] = await Promise.all([
        fetch('/api/admin/promotions'),
        fetch('/api/admin/centres'),
      ]);
      if (promoRes.status === 401) { router.push('/admin/login'); return; }
      const promoJson = await promoRes.json();
      const centresJson = await centresRes.json();
      if (!promoRes.ok) { setErreur(promoJson.erreur); return; }
      setPromotions(promoJson.promotions);
      setCentres(centresJson.centres || []);
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    }
  }

  useEffect(() => { charger(); }, []);

  function appliquerPreset(preset) {
    if (preset === 'premier_mois_offert') {
      setForm({ ...form, nom: 'Premier mois offert', taux_semaine1: 0, taux_semaine2: 0, taux_semaine3: 0, date_fin: todayISO(30) });
    } else if (preset === 'reduction_lancement') {
      setForm({ ...form, nom: 'Taux réduits de lancement', taux_semaine1: 20, taux_semaine2: 15, taux_semaine3: 10, date_fin: todayISO(60) });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, centre_id: form.centre_id || null }),
      });
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); setEnvoi(false); return; }
      setAfficherForm(false);
      setForm({ centre_id: '', nom: '', taux_semaine1: 30, taux_semaine2: 25, taux_semaine3: 20, date_debut: todayISO(), date_fin: todayISO(30) });
      charger();
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    } finally {
      setEnvoi(false);
    }
  }

  async function supprimer(id) {
    if (!confirm('Supprimer cette promotion ?')) return;
    await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' });
    charger();
  }

  return (
    <div className="pro-shell">
      <aside className="pro-sidebar">
        <div className="brand"><Logo /> Espace admin</div>
        <nav>
          <Link href="/admin/dashboard" className={pathname === '/admin/dashboard' ? 'active' : ''}>Commissions</Link>
          <Link href="/admin/paiements" className={pathname.startsWith('/admin/paiements') ? 'active' : ''}>Paiements</Link>
          <Link href="/admin/promotions" className={pathname.startsWith('/admin/promotions') ? 'active' : ''}>Promotions</Link>
          <Link href="/admin/reserver" className={pathname.startsWith('/admin/reserver') ? 'active' : ''}>Réserver un RDV</Link>
          <Link href="/admin/factures" className={pathname.startsWith('/admin/factures') ? 'active' : ''}>Factures</Link>
          <Link href="/admin/centres" className={pathname.startsWith('/admin/centres') ? 'active' : ''}>Centres & utilisateurs</Link>
          <Link href="/admin/emails" className={pathname.startsWith('/admin/emails') ? 'active' : ''}>Modèles de mails</Link>
          <Link href="/admin/contacts" className={pathname.startsWith('/admin/contacts') ? 'active' : ''}>Contacts</Link>
        </nav>
      </aside>

      <main className="pro-main">
        <h1>Promotions</h1>
        <AlertePaiements />
        <p className="help-text">
          Remplacez temporairement les taux de commission par défaut (30% / 25% / 20%) pour un centre précis ou
          pour l'ensemble de la plateforme — utile pour offrir un premier mois, ou ajuster les taux pendant une
          période de lancement. Le centre concerné voit la promotion active dans son tableau de bord.
        </p>

        {erreur && <div className="message-banner error">{erreur}</div>}

        {!afficherForm ? (
          <button type="button" onClick={() => setAfficherForm(true)} style={{ marginBottom: 20 }}>
            + Nouvelle promotion
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="card">
            <div className="card-header"><h2 style={{ margin: 0 }}>Nouvelle promotion</h2></div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button type="button" className="btn-secondary" onClick={() => appliquerPreset('premier_mois_offert')}>
                Préremplir : 1er mois offert
              </button>
              <button type="button" className="btn-secondary" onClick={() => appliquerPreset('reduction_lancement')}>
                Préremplir : taux réduits de lancement
              </button>
            </div>

            <div className="grid-2">
              <div className="form-row" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="nom">Nom de la promotion</label>
                <input id="nom" type="text" required placeholder="ex: Premier mois offert" value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })} />
              </div>
              <div className="form-row" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="centre_id">Centre concerné</label>
                <select id="centre_id" value={form.centre_id} onChange={(e) => setForm({ ...form, centre_id: e.target.value })}>
                  <option value="">Tous les centres (promotion globale)</option>
                  {centres.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}{c.ville ? ` — ${c.ville}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="taux1">Taux 0-7 jours (%)</label>
                <input id="taux1" type="number" min="0" max="100" required value={form.taux_semaine1}
                  onChange={(e) => setForm({ ...form, taux_semaine1: e.target.value })} />
              </div>
              <div className="form-row">
                <label htmlFor="taux2">Taux 7-14 jours (%)</label>
                <input id="taux2" type="number" min="0" max="100" required value={form.taux_semaine2}
                  onChange={(e) => setForm({ ...form, taux_semaine2: e.target.value })} />
              </div>
              <div className="form-row">
                <label htmlFor="taux3">Taux au-delà de 14 jours (%)</label>
                <input id="taux3" type="number" min="0" max="100" required value={form.taux_semaine3}
                  onChange={(e) => setForm({ ...form, taux_semaine3: e.target.value })} />
              </div>
              <div className="form-row">
                <label htmlFor="date_debut">Date de début</label>
                <input id="date_debut" type="date" required value={form.date_debut}
                  onChange={(e) => setForm({ ...form, date_debut: e.target.value })} />
              </div>
              <div className="form-row">
                <label htmlFor="date_fin">Date de fin</label>
                <input id="date_fin" type="date" required value={form.date_fin}
                  onChange={(e) => setForm({ ...form, date_fin: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={envoi}>{envoi ? 'Création…' : 'Créer la promotion'}</button>
              <button type="button" className="btn-secondary" onClick={() => setAfficherForm(false)}>Annuler</button>
            </div>
          </form>
        )}

        {!promotions ? (
          <p className="help-text">Chargement…</p>
        ) : promotions.length === 0 ? (
          <div className="empty-state">Aucune promotion créée pour le moment.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Statut</th>
                  <th>Nom</th>
                  <th>Centre</th>
                  <th>Taux (0-7j / 7-14j / 14j+)</th>
                  <th>Période</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((p) => (
                  <tr key={p.id}>
                    <td><span className={`badge ${STATUTS[p.statut].classe}`}>{STATUTS[p.statut].label}</span></td>
                    <td>{p.nom}</td>
                    <td>{p.centre_nom || 'Tous les centres'}</td>
                    <td className="mono">{p.taux_semaine1}% / {p.taux_semaine2}% / {p.taux_semaine3}%</td>
                    <td className="mono">{p.date_debut} → {p.date_fin}</td>
                    <td><button type="button" className="btn-danger" onClick={() => supprimer(p.id)}>Supprimer</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
