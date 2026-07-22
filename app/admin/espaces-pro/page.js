'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '../../components/AdminSidebar';
import AlertePaiements from '../../components/AlertePaiements';
import { IconeVehicule } from '../../components/VehiculeIcons';
import { TYPES_VEHICULES } from '@/lib/vehicules';

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatMois(mois) {
  const [annee, m] = mois.split('-');
  return new Date(Number(annee), Number(m) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export default function EspacesProPage() {
  const router = useRouter();
  const [centres, setCentres] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [centreId, setCentreId] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [chargementApercu, setChargementApercu] = useState(false);

  useEffect(() => {
    async function charger() {
      try {
        const res = await fetch('/api/admin/centres');
        if (res.status === 401) { router.push('/admin/login'); return; }
        const data = await res.json();
        if (!res.ok) { setErreur(data.erreur); return; }
        setCentres(data.centres);
      } catch {
        setErreur('Erreur réseau. Réessayez.');
      }
    }
    charger();
  }, [router]);

  const centresFiltres = centres?.filter((c) => {
    const q = recherche.trim().toLowerCase();
    if (!q) return true;
    return c.nom.toLowerCase().includes(q) || c.ville.toLowerCase().includes(q);
  });

  async function ouvrirCentre(id) {
    if (centreId === id) { setCentreId(null); setApercu(null); return; }
    setCentreId(id);
    setApercu(null);
    setChargementApercu(true);
    try {
      const res = await fetch(`/api/admin/centres/${id}/apercu`);
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); return; }
      setApercu(data);
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    } finally {
      setChargementApercu(false);
    }
  }

  return (
    <div className="pro-shell">
      <AdminSidebar />

      <main className="pro-main">
        <h1>Espaces professionnels</h1>
        <AlertePaiements />
        <p className="help-text">
          Consultez en lecture seule ce que chaque centre voit dans son propre tableau de bord — utile pour
          vérifier qu'il n'y a pas de souci (agenda non configuré, aucun créneau ouvert, image manquante...)
          sans avoir besoin de ses identifiants.
        </p>

        {erreur && <div className="message-banner error" style={{ marginTop: 16 }}>{erreur}</div>}

        <div className="form-row" style={{ maxWidth: 420, marginTop: 16 }}>
          <label htmlFor="recherche">Rechercher un centre (nom ou ville)</label>
          <input id="recherche" type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        </div>

        {!centres ? (
          <p className="help-text" style={{ marginTop: 20 }}>Chargement…</p>
        ) : (
          <div style={{ marginTop: 16 }}>
            {centresFiltres.map((c) => (
              <div key={c.id} className="card" style={{ marginBottom: 10 }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => ouvrirCentre(c.id)}
                >
                  <div>
                    <strong>{c.nom}</strong>
                    <span className="help-text" style={{ marginLeft: 8 }}>{c.enseigne || 'Indépendant'} · {c.ville}</span>
                  </div>
                  <button type="button" className="btn-secondary">
                    {centreId === c.id ? 'Masquer' : 'Voir son espace'}
                  </button>
                </div>

                {centreId === c.id && (
                  <div style={{ marginTop: 18, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                    {chargementApercu ? (
                      <p className="help-text">Chargement…</p>
                    ) : apercu ? (
                      <>
                        <div className="grid-2" style={{ marginBottom: 16 }}>
                          <div>
                            <p className="eyebrow" style={{ marginBottom: 4 }}>Gérant</p>
                            <p style={{ margin: 0 }}>{apercu.centre.gerant_nom || '—'}</p>
                            <p className="help-text mono" style={{ margin: 0 }}>{apercu.centre.gerant_email || '—'}</p>
                          </div>
                          <div>
                            <p className="eyebrow" style={{ marginBottom: 4 }}>Configuration</p>
                            <p style={{ margin: 0 }}>
                              {apercu.centre.a_une_image ? '✅ Image ajoutée' : '⚠️ Aucune image'}
                              {' · '}
                              {apercu.centre.a_un_agenda ? '✅ Agenda relié' : '⚠️ Aucun agenda relié'}
                            </p>
                          </div>
                        </div>

                        <p className="eyebrow" style={{ marginBottom: 6 }}>Véhicules acceptés</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                          {apercu.centre.types_vehicules_acceptes.length === 0 ? (
                            <span className="help-text">Aucun véhicule renseigné</span>
                          ) : (
                            TYPES_VEHICULES.filter((t) => apercu.centre.types_vehicules_acceptes.includes(t.value)).map((t) => (
                              <span key={t.value} className="vehicule-badge" style={{ background: t.couleur }}>
                                <IconeVehicule icone={t.icone} size={12} color="#fff" />
                                {t.label}
                              </span>
                            ))
                          )}
                        </div>

                        <p className="eyebrow" style={{ marginBottom: 6 }}>Planning (à partir d'aujourd'hui)</p>
                        <p style={{ marginTop: 0, marginBottom: 16 }}>
                          <span className="mono">{apercu.compteurs.disponibles}</span> disponible(s) ·{' '}
                          <span className="mono">{apercu.compteurs.reserves}</span> réservé(s) ·{' '}
                          <span className="mono">{apercu.compteurs.bloques}</span> bloqué(s)
                        </p>

                        <p className="eyebrow" style={{ marginBottom: 6 }}>Prochains rendez-vous</p>
                        {apercu.prochains_rdv.length === 0 ? (
                          <div className="empty-state" style={{ marginBottom: 16 }}>Aucun rendez-vous à venir.</div>
                        ) : (
                          <div className="table-scroll" style={{ marginBottom: 16 }}>
                            <table>
                              <thead><tr><th>Date</th><th>Heure</th><th>Client</th><th>Statut</th></tr></thead>
                              <tbody>
                                {apercu.prochains_rdv.map((r) => (
                                  <tr key={r.reference}>
                                    <td className="mono">{formatDate(r.date)}</td>
                                    <td className="mono">{r.heure}</td>
                                    <td>{r.client_prenom} {r.client_nom}</td>
                                    <td><span className={`badge ${r.statut === 'absent' ? 'reserve' : 'disponible'}`}>{r.statut === 'absent' ? 'Absent' : 'Confirmé'}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        <p className="eyebrow" style={{ marginBottom: 6 }}>Factures récentes</p>
                        {apercu.factures.length === 0 ? (
                          <div className="empty-state">Aucune facture pour le moment.</div>
                        ) : (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {apercu.factures.map((f) => (
                              <span key={f.mois} className={`badge ${f.statut === 'paye' ? 'disponible' : 'reserve'}`}>
                                {formatMois(f.mois)} — {f.statut === 'paye' ? 'Payée' : 'Non payée'}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
