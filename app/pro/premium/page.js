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
          Un centre en statut Premium apparaît en tête des résultats de recherche, avec un icône doré ★ visible par
          les clients — plus de visibilité, plus de réservations. 30 € TTC par mois, sans engagement.
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
                <tr><td className="help-text">Tarif</td><td><strong style={{ color: 'var(--color-accent)' }}>30 € TTC / mois</strong></td></tr>
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
          <section className="card" style={{ marginTop: 16, maxWidth: 560 }}>
            <div className="card-header"><h2 style={{ margin: 0 }}>Passer {centre.nom} en Premium</h2></div>

            <h3 style={{ marginBottom: 8 }}>Les avantages</h3>
            <ul style={{ marginTop: 0, paddingLeft: 20 }}>
              <li>Votre centre apparaît <strong>en tête des résultats de recherche</strong>, avant les centres non-Premium</li>
              <li>Un <strong style={{ color: 'var(--color-accent)' }}>icône doré ★</strong> s'affiche à côté de votre nom, visible par tous les clients qui recherchent un centre</li>
              <li>Un léger encadré doré distingue votre fiche des autres sur la page de résultats</li>
              <li>Plus de visibilité, généralement plus de réservations</li>
            </ul>

            <table style={{ width: '100%', marginBottom: 16 }}>
              <tbody>
                <tr><td className="help-text">Tarif</td><td><strong style={{ color: 'var(--color-accent)' }}>30 € TTC / mois</strong></td></tr>
                <tr><td className="help-text">Premier mois</td><td>Calculé au prorata du nombre de jours restants</td></tr>
                <tr><td className="help-text">Facturation</td><td>Comme votre commission, à régler avant le 10 du mois suivant</td></tr>
                <tr><td className="help-text">Engagement</td><td>Aucun — arrêt possible à tout moment, depuis cette même page</td></tr>
              </tbody>
            </table>

            <h3 style={{ marginBottom: 8 }}>Un exemple concret</h3>
            <div className="table-scroll">
              <table style={{ marginBottom: 12 }}>
                <thead><tr><th>Situation</th><th>Jours facturés</th><th>Montant</th></tr></thead>
                <tbody>
                  <tr>
                    <td>Activation le 6 août (août compte 31 jours)</td>
                    <td className="help-text">26 jours sur 31</td>
                    <td className="mono">25,16 € TTC</td>
                  </tr>
                  <tr>
                    <td>Arrêt le 24 septembre (septembre compte 30 jours)</td>
                    <td className="help-text">24 jours sur 30</td>
                    <td className="mono">24,00 € TTC</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="help-text" style={{ marginBottom: 16 }}>
              Entre les deux (tout le mois de septembre s'il n'y avait pas eu d'arrêt), c'est le plein tarif de
              30 € TTC qui s'applique — seuls les mois d'activation et d'arrêt sont calculés au prorata.
            </p>

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
