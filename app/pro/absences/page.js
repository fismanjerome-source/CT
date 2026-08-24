'use client';

import { useEffect, useState, Suspense } from 'react';
import ProSidebar from '../../components/ProSidebar';
import { useRouter, useSearchParams } from 'next/navigation';

function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function AbsencesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const centreIdParam = searchParams.get('centre');

  const [centre, setCentre] = useState(null);
  const [semaineOffset, setSemaineOffset] = useState(0);
  const [rdvs, setRdvs] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);
  const [enCours, setEnCours] = useState(null);

  useEffect(() => {
    async function chargerCentre() {
      try {
        const urlMe = centreIdParam ? `/api/pro/me?centre=${centreIdParam}` : '/api/pro/me';
        const res = await fetch(urlMe);
        if (res.status === 401) { router.push('/pro/login'); return; }
        const data = await res.json();
        if (!res.ok) { setErreur(data.erreur); return; }
        setCentre(data.centre);
      } catch {
        setErreur('Erreur réseau. Réessayez.');
      }
    }
    chargerCentre();
  }, [router, centreIdParam]);

  useEffect(() => {
    if (!centre) return;
    async function chargerSemaine() {
      try {
        const res = await fetch(`/api/pro/rdv-semaine?centre=${centre.id}&debut=${todayISO(semaineOffset * 7)}`);
        const data = await res.json();
        if (!res.ok) { setErreur(data.erreur); return; }
        setRdvs(data.rdvs);
      } catch {
        setErreur('Erreur réseau. Réessayez.');
      }
    }
    chargerSemaine();
  }, [centre, semaineOffset]);

  async function toggleAbsent(rdv) {
    const devientAbsent = rdv.statut !== 'absent';
    if (devientAbsent && !confirm(`Confirmez-vous que ${rdv.client_prenom} ${rdv.client_nom} ne s'est pas présenté(e) au rendez-vous de ${rdv.heure} ? La commission correspondante ne sera plus due.`)) {
      return;
    }
    setEnCours(rdv.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/pro/rdv/${rdv.id}/absent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ absent: devientAbsent }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage({ type: 'error', text: data.erreur }); return; }
      setMessage({ type: 'success', text: data.message });
      setRdvs(rdvs.map((r) => (r.id === rdv.id ? { ...r, statut: devientAbsent ? 'absent' : 'confirme' } : r)));
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau. Réessayez.' });
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="pro-shell">
      <ProSidebar centreId={centre?.id} />

      <main className="pro-main">
        <h1>Client absent</h1>
        <p className="help-text">
          Signalez ici un client qui ne s'est pas présenté à son rendez-vous — la commission correspondante ne
          sera pas due.
        </p>

        <div className="guide-card accent-danger" style={{ marginTop: 16 }}>
          ⚖️ Si vous signalez un client absent, il recevra <strong>automatiquement un email dans l'heure</strong>{' '}
          l'informant que son rendez-vous n'a pas été honoré. Chaque client reçoit par ailleurs un email après
          son rendez-vous lui demandant si tout s'est bien déroulé, et Créneau CT se réserve le droit de
          vérifier à tout moment auprès du client qu'un rendez-vous signalé absent ne s'est effectivement pas
          tenu. Merci de n'utiliser ce signalement qu'en cas d'absence réelle et constatée.
        </div>

        {erreur && <div className="message-banner error" style={{ marginTop: 16 }}>{erreur}</div>}
        {message && <div className={`message-banner ${message.type}`} style={{ marginTop: 16 }}>{message.text}</div>}

        <div className="semaine-pagination">
          <button type="button" className="btn-secondary" onClick={() => setSemaineOffset((s) => Math.max(0, s - 1))} disabled={semaineOffset === 0}>
            ← Précédente
          </button>
          <span className="semaine-label">
            Semaine du {formatDate(todayISO(semaineOffset * 7))} au {formatDate(todayISO(semaineOffset * 7 + 6))}
          </span>
          <button type="button" className="btn-secondary" onClick={() => setSemaineOffset((s) => s + 1)}>
            Suivante →
          </button>
        </div>

        {!rdvs ? (
          <p className="help-text" style={{ marginTop: 16 }}>Chargement…</p>
        ) : rdvs.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 16 }}>Aucun RDV cette semaine-là.</div>
        ) : (
          <div className="table-scroll" style={{ marginTop: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Prénom</th>
                  <th>Nom</th>
                  <th>Téléphone</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rdvs.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{formatDate(r.date)}</td>
                    <td className="mono">{r.heure}</td>
                    <td>{r.client_prenom || '—'}</td>
                    <td>{r.client_nom}</td>
                    <td className="mono">{r.client_telephone}</td>
                    <td>
                      <span className={`badge ${r.statut === 'absent' ? 'reserve' : 'disponible'}`}>
                        {r.statut === 'absent' ? 'Absent signalé' : 'Confirmé'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={r.statut === 'absent' ? 'btn-secondary' : 'btn-danger'}
                        onClick={() => toggleAbsent(r)}
                        disabled={enCours === r.id}
                      >
                        {r.statut === 'absent' ? 'Annuler le signalement' : 'Signaler absent'}
                      </button>
                    </td>
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

export default function AbsencesPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: 40 }}><p className="help-text">Chargement…</p></div>}>
      <AbsencesPageInner />
    </Suspense>
  );
}
