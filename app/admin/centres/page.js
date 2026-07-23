'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/Logo';
import AlertePaiements from '../../components/AlertePaiements';
import { TYPES_VEHICULES, parseTypes } from '@/lib/vehicules';

export default function AdminCentresPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [centres, setCentres] = useState(null);
  const [stats, setStats] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [reinitEnCours, setReinitEnCours] = useState(null);
  const [reinitResultat, setReinitResultat] = useState(null);
  const [icalInputs, setIcalInputs] = useState({});
  const [statutParCentre, setStatutParCentre] = useState({}); // { [id]: { enCours, message, type } }

  async function charger() {
    try {
      const [centresRes, statsRes] = await Promise.all([
        fetch('/api/admin/centres'),
        fetch('/api/admin/stats'),
      ]);
      if (centresRes.status === 401) { router.push('/admin/login'); return; }
      const centresJson = await centresRes.json();
      const statsJson = await statsRes.json();
      if (!centresRes.ok) { setErreur(centresJson.erreur); return; }
      setCentres(centresJson.centres);
      setStats(statsJson);
      setIcalInputs(Object.fromEntries(centresJson.centres.map((c) => [c.id, c.ical_url || ''])));
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    }
  }

  async function reinitialiserMotDePasse(gerantId) {
    if (!confirm('Générer un nouveau mot de passe temporaire pour ce compte ? L\'ancien ne fonctionnera plus.')) return;
    setReinitEnCours(gerantId);
    setReinitResultat(null);
    try {
      const res = await fetch(`/api/admin/controleurs/${gerantId}/reinitialiser-mdp`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); return; }
      setReinitResultat(data);
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    } finally {
      setReinitEnCours(null);
    }
  }

  useEffect(() => { charger(); }, []);

  function setStatut(id, patch) {
    setStatutParCentre((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function enregistrerLien(id) {
    setStatut(id, { enCours: true, message: null });
    try {
      const res = await fetch(`/api/admin/centres/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ical_url: icalInputs[id] }),
      });
      const data = await res.json();
      if (!res.ok) { setStatut(id, { enCours: false, message: data.erreur, type: 'error' }); return; }
      setStatut(id, { enCours: false, message: 'Lien enregistré.', type: 'success' });
      charger();
    } catch {
      setStatut(id, { enCours: false, message: 'Erreur réseau.', type: 'error' });
    }
  }

  async function synchroniser(id) {
    setStatut(id, { enCours: true, message: null });
    try {
      const res = await fetch(`/api/admin/centres/${id}/sync-agenda`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setStatut(id, { enCours: false, message: data.erreur, type: 'error' }); return; }
      setStatut(id, { enCours: false, message: data.message, type: 'success' });
      charger();
    } catch {
      setStatut(id, { enCours: false, message: 'Erreur réseau.', type: 'error' });
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <div className="pro-shell">
      <AdminSidebar />

      <main className="pro-main">
        <h1>Centres & utilisateurs</h1>
        <AlertePaiements />
        <p className="help-text">Tous les centres inscrits sur la plateforme, avec les coordonnées de leur gérant.</p>

        <div className="message-banner" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', marginTop: 12 }}>
          📱 <strong>À rappeler aux centres si besoin :</strong> leur espace professionnel fonctionne aussi bien
          depuis un smartphone ou une tablette que depuis un ordinateur — aucune application à installer, il leur
          suffit d'ouvrir creneauct.fr/pro/login dans leur navigateur habituel, où qu'ils soient.
        </div>

        {erreur && <div className="message-banner error" style={{ marginTop: 16 }}>{erreur}</div>}

        {reinitResultat && (
          <div className="message-banner success" style={{ marginTop: 16 }}>
            Nouveau mot de passe pour <strong>{reinitResultat.email}</strong> :{' '}
            <span className="mono" style={{ fontWeight: 700, fontSize: '1.05rem' }}>{reinitResultat.nouveau_mot_de_passe}</span>
            <br />Communiquez-le au gérant maintenant — il ne sera plus jamais affiché après avoir quitté cette page.
          </div>
        )}

        {stats && (
          <div className="stats-grid" style={{ marginTop: 20 }}>
            <div className="stat-card">
              <span className="stat-value">{stats.nombre_centres}</span>
              <span className="stat-label">Centres inscrits</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.nombre_comptes}</span>
              <span className="stat-label">Comptes gérants</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.creneaux_disponibles}</span>
              <span className="stat-label">Créneaux disponibles</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.creneaux_reserves}</span>
              <span className="stat-label">Créneaux réservés</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.rdv_confirmes}</span>
              <span className="stat-label">RDV confirmés (total)</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.contacts_nouveaux}</span>
              <span className="stat-label">Demandes de contact non traitées</span>
            </div>
          </div>
        )}

        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <h2 style={{ margin: 0 }}>Détail par centre</h2>
          </div>
          {!centres ? (
            <p className="help-text">Chargement…</p>
          ) : centres.length === 0 ? (
            <div className="empty-state">Aucun centre pour le moment.</div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Centre</th>
                    <th>Ville</th>
                    <th>Gérant</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Véhicules acceptés</th>
                    <th>Créneaux dispo.</th>
                    <th>Réservés</th>
                    <th>Bloqués (agenda)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {centres.map((c) => (
                    <tr key={c.id}>
                      <td>{c.nom}{c.enseigne ? ` (${c.enseigne})` : ''}</td>
                      <td>{c.ville}</td>
                      <td>{c.gerant_nom || '—'}</td>
                      <td className="mono">{c.gerant_email || '—'}</td>
                      <td className="mono">{c.gerant_telephone || '—'}</td>
                      <td className="help-text">
                        {parseTypes(c.types_vehicules_acceptes).map((v) => TYPES_VEHICULES.find((t) => t.value === v)?.label).join(', ') || 'Non renseigné'}
                      </td>
                      <td className="mono">{c.creneaux_disponibles}</td>
                      <td className="mono">{c.creneaux_reserves}</td>
                      <td className="mono">{c.creneaux_bloques}</td>
                      <td>
                        {c.gerant_id && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ whiteSpace: 'nowrap' }}
                            onClick={() => reinitialiserMotDePasse(c.gerant_id)}
                            disabled={reinitEnCours === c.gerant_id}
                          >
                            {reinitEnCours === c.gerant_id ? '…' : 'Réinitialiser mdp'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 style={{ margin: 0 }}>Agendas externes</h2>
          </div>
          <p className="help-text">
            Collez ici le lien iCal privé transmis par chaque centre (Google Calendar : Paramètres → Intégrer
            l'agenda → « Adresse secrète au format iCal ». Outlook : Paramètres → Calendrier → Partager →
            « Publier un calendrier »). La synchronisation bloque automatiquement les créneaux Créneau CT qui
            entrent en conflit avec un événement de leur agenda — lecture seule, rien n'est jamais écrit dans
            leur calendrier.
          </p>
          <p className="help-text">
            Chaque centre peut aussi renseigner et synchroniser son propre lien directement depuis son tableau
            de bord (section « Mon agenda externe ») — vous n'avez donc plus besoin de le faire vous-même pour
            chaque centre, sauf en cas de besoin ponctuel.
          </p>

          {!centres ? (
            <p className="help-text">Chargement…</p>
          ) : (
            centres.map((c) => {
              const s = statutParCentre[c.id] || {};
              return (
                <div key={c.id} style={{ borderTop: '1px solid var(--color-border)', padding: '16px 0' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>{c.nom}</p>
                  {s.message && <div className={`message-banner ${s.type}`} style={{ marginBottom: 10 }}>{s.message}</div>}
                  <div className="grid-2">
                    <div className="form-row" style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor={`ical-${c.id}`}>Lien iCal privé</label>
                      <input
                        id={`ical-${c.id}`}
                        type="url"
                        placeholder="https://calendar.google.com/calendar/ical/.../private-xxxx/basic.ics"
                        value={icalInputs[c.id] || ''}
                        onChange={(e) => setIcalInputs({ ...icalInputs, [c.id]: e.target.value })}
                      />
                    </div>
                    <div className="form-row" style={{ gridColumn: '1 / -1', display: 'flex', gap: 10 }}>
                      <button type="button" className="btn-secondary" onClick={() => enregistrerLien(c.id)} disabled={s.enCours}>
                        Enregistrer le lien
                      </button>
                      <button type="button" onClick={() => synchroniser(c.id)} disabled={s.enCours || !c.ical_url}>
                        {s.enCours ? 'Synchronisation…' : 'Synchroniser maintenant'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
