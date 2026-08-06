'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProSidebar from '../../components/ProSidebar';

function PremiumPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const centreParam = searchParams.get('centre');

  const [centre, setCentre] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  async function charger() {
    try {
      const res = await fetch(`/api/pro/me${centreParam ? `?centre=${centreParam}` : ''}`);
      if (res.status === 401) { router.push('/pro/login'); return; }
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); return; }
      setCentre(data.centre);
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    }
  }

  useEffect(() => { charger(); }, [centreParam]); // eslint-disable-line react-hooks/exhaustive-deps

  async function demanderActivation() {
    setEnvoi(true);
    setErreur(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/pro/premium/demander${centreParam ? `?centre=${centreParam}` : ''}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); return; }
      setMessage(data.message);
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    } finally {
      setEnvoi(false);
    }
  }

  async function arreterPremium() {
    if (!confirm(`Arrêter le statut Premium de ${centre.nom} ? Le badge disparaîtra immédiatement. Le mois en cours sera facturé au prorata des jours déjà actifs.`)) return;
    setEnvoi(true);
    setErreur(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/pro/premium/arreter${centreParam ? `?centre=${centreParam}` : ''}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); return; }
      setMessage(data.message);
      charger();
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="pro-shell">
      <ProSidebar centreId={centreParam} />

      <main className="pro-main">
        <h1>★ Premium</h1>
        <p className="help-text">
          Un centre en statut Premium apparaît en tête des résultats de recherche, avec un badge doré visible par
          les clients — plus de visibilité, plus de réservations.
        </p>

        {erreur && <div className="message-banner error" style={{ marginTop: 16 }}>{erreur}</div>}
        {message && <div className="message-banner success" style={{ marginTop: 16 }}>{message}</div>}

        {!centre ? (
          <p className="help-text">Chargement…</p>
        ) : centre.est_premium ? (
          <section className="card" style={{ marginTop: 16, maxWidth: 520, borderColor: 'var(--color-accent)' }}>
            <div className="card-header">
              <h2 style={{ margin: 0, color: 'var(--color-accent)' }}>★ {centre.nom} est Premium</h2>
            </div>
            <p>
              Actif depuis le {new Date(centre.premium_depuis).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </p>
            <table style={{ width: '100%', marginBottom: 16 }}>
              <tbody>
                <tr><td className="help-text">Tarif</td><td><strong>30 € / mois</strong></td></tr>
                <tr><td className="help-text">Facturation</td><td>Comme votre commission, à régler avant le 10 du mois suivant</td></tr>
                <tr><td className="help-text">Engagement</td><td>Aucun — arrêt possible à tout moment</td></tr>
              </tbody>
            </table>
            <button type="button" className="btn-danger" onClick={arreterPremium} disabled={envoi}>
              {envoi ? 'Arrêt en cours…' : 'Arrêter mon abonnement Premium'}
            </button>
            <p className="help-text" style={{ marginTop: 10 }}>
              Le mois de l'arrêt sera calculé au prorata du nombre de jours réellement actifs, comme celui de
              l'activation.
            </p>
          </section>
        ) : (
          <section className="card" style={{ marginTop: 16, maxWidth: 520 }}>
            <div className="card-header"><h2 style={{ margin: 0 }}>Passer {centre.nom} en Premium</h2></div>
            <table style={{ width: '100%', marginBottom: 16 }}>
              <tbody>
                <tr><td className="help-text">Tarif</td><td><strong>30 € / mois</strong></td></tr>
                <tr><td className="help-text">Premier mois</td><td>Calculé au prorata du nombre de jours restants</td></tr>
                <tr><td className="help-text">Facturation</td><td>Comme votre commission, à régler avant le 10 du mois suivant</td></tr>
                <tr><td className="help-text">Engagement</td><td>Aucun — arrêt possible à tout moment, depuis cette même page</td></tr>
              </tbody>
            </table>
            <p className="help-text" style={{ marginBottom: 12 }}>
              Si vous gérez plusieurs centres, ce choix ne concerne que <strong>{centre.nom}</strong> — les autres
              restent indépendants.
            </p>
            <button type="button" onClick={demanderActivation} disabled={envoi}>
              {envoi ? 'Envoi…' : 'Demander l\u2019activation'}
            </button>
            <p className="help-text" style={{ marginTop: 10 }}>
              Nous revenons vers vous rapidement pour convenir du règlement, puis activons votre statut Premium.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: 40 }}><p className="help-text">Chargement…</p></div>}>
      <PremiumPageInner />
    </Suspense>
  );
}
