'use client';

import { useEffect, useState, Suspense } from 'react';
import ProSidebar from '../../components/ProSidebar';
import { useRouter, useSearchParams } from 'next/navigation';

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function JoursFeriesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const centreIdParam = searchParams.get('centre');

  const [centre, setCentre] = useState(null);
  const [joursFeries, setJoursFeries] = useState(null);
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
    async function charger() {
      try {
        const res = await fetch(`/api/pro/jours-feries?centre=${centre.id}`);
        const data = await res.json();
        if (!res.ok) { setErreur(data.erreur); return; }
        setJoursFeries(data.jours_feries);
      } catch {
        setErreur('Erreur réseau. Réessayez.');
      }
    }
    charger();
  }, [centre]);

  async function toggle(jour) {
    const debloque = jour.bloque; // on demande l'inverse de l'état actuel
    setEnCours(jour.date);
    setMessage(null);
    try {
      const res = await fetch('/api/pro/jours-feries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centre_id: centre.id, date: jour.date, debloque }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage({ type: 'error', text: data.erreur }); return; }
      setMessage({ type: 'success', text: data.message });
      setJoursFeries(joursFeries.map((j) => (j.date === jour.date ? { ...j, bloque: !debloque } : j)));
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
        <h1>Jours fériés</h1>
        <p className="help-text">
          Les jours fériés officiels sont bloqués automatiquement sur votre planning, pour tout nouveau créneau
          ouvert (unique ou via « Combler des horaires vides »). Débloquez un jour ici si votre centre travaille
          ce jour-là.
        </p>

        <div className="guide-card" style={{ marginTop: 16 }}>
          Un jour débloqué le reste pour toutes vos futures ouvertures de créneaux, jusqu'à ce que vous le
          rebloquiez ici. Les rendez-vous déjà réservés ne sont jamais annulés ni modifiés, quel que soit le
          statut du jour.
        </div>

        {erreur && <div className="message-banner error" style={{ marginTop: 16 }}>{erreur}</div>}
        {message && <div className={`message-banner ${message.type}`} style={{ marginTop: 16 }}>{message.text}</div>}

        {!joursFeries ? (
          <p className="help-text" style={{ marginTop: 16 }}>Chargement…</p>
        ) : (
          <div className="table-scroll" style={{ marginTop: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Jour férié</th>
                  <th>Statut</th>
                  <th>RDV déjà réservés</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {joursFeries.map((j) => (
                  <tr key={j.date}>
                    <td className="mono" style={{ textTransform: 'capitalize' }}>{formatDate(j.date)}</td>
                    <td>{j.nom}</td>
                    <td>
                      <span className={`badge ${j.bloque ? 'reserve' : 'disponible'}`}>
                        {j.bloque ? 'Bloqué' : 'Débloqué'}
                      </span>
                    </td>
                    <td className="help-text">{j.nombre_rdv_deja_reserves > 0 ? j.nombre_rdv_deja_reserves : '—'}</td>
                    <td>
                      <button
                        type="button"
                        className={j.bloque ? 'btn-secondary' : 'btn-danger'}
                        onClick={() => toggle(j)}
                        disabled={enCours === j.date}
                      >
                        {j.bloque ? 'Débloquer ce jour' : 'Rebloquer ce jour'}
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

export default function JoursFeriesPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: 40 }}><p className="help-text">Chargement…</p></div>}>
      <JoursFeriesPageInner />
    </Suspense>
  );
}
