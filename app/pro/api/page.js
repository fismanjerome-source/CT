'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProSidebar from '../../components/ProSidebar';

function ApiPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const centreParam = searchParams.get('centre');

  const [cles, setCles] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [nouvelleCle, setNouvelleCle] = useState(null);
  const [nomNouvelleCle, setNomNouvelleCle] = useState('');

  async function charger() {
    try {
      const res = await fetch(`/api/pro/api-cles${centreParam ? `?centre=${centreParam}` : ''}`);
      if (res.status === 401) { router.push('/pro/login'); return; }
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); return; }
      setCles(data.cles);
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    }
  }

  useEffect(() => { charger(); }, [centreParam]); // eslint-disable-line react-hooks/exhaustive-deps

  async function genererCle(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const res = await fetch(`/api/pro/api-cles/generer${centreParam ? `?centre=${centreParam}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nomNouvelleCle }),
      });
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); return; }
      setNouvelleCle(data.cle);
      setNomNouvelleCle('');
      charger();
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    } finally {
      setEnvoi(false);
    }
  }

  async function revoquerCle(id) {
    if (!confirm('Révoquer cette clé ? Tout logiciel qui l\'utilise perdra immédiatement l\'accès.')) return;
    try {
      await fetch(`/api/pro/api-cles/${id}/revoquer${centreParam ? `?centre=${centreParam}` : ''}`, { method: 'POST' });
      charger();
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    }
  }

  return (
    <div className="pro-shell">
      <ProSidebar centreId={centreParam} />

      <main className="pro-main">
        <h1>Clés API</h1>
        <p className="help-text">
          Connectez votre propre logiciel de planning à Créneau CT — récupérez vos créneaux et vos rendez-vous par
          programmation, en lecture seule. Réservé aux centres à l'aise avec ce genre d'intégration technique ;
          pour un usage simple, la synchronisation d'agenda depuis le tableau de bord suffit généralement.
        </p>

        {erreur && <div className="message-banner error" style={{ marginTop: 16 }}>{erreur}</div>}

        {nouvelleCle && (
          <div className="message-banner success" style={{ marginTop: 16 }}>
            <strong>Clé créée avec succès !</strong> Copiez-la maintenant, elle ne sera plus jamais affichée en
            entier ensuite :
            <div className="mono" style={{ background: 'var(--color-bg)', padding: '10px 14px', borderRadius: 6, marginTop: 8, wordBreak: 'break-all' }}>
              {nouvelleCle}
            </div>
            <button type="button" className="btn-secondary" style={{ marginTop: 10 }} onClick={() => setNouvelleCle(null)}>
              J'ai bien noté ma clé
            </button>
          </div>
        )}

        <section className="card" style={{ marginTop: 16, maxWidth: 560 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>Générer une nouvelle clé</h2></div>
          <form onSubmit={genererCle}>
            <div className="form-row">
              <label htmlFor="nom_cle">Nom de la clé (pour vous y retrouver)</label>
              <input
                id="nom_cle" type="text" placeholder="ex : Logiciel de planning interne"
                value={nomNouvelleCle} onChange={(e) => setNomNouvelleCle(e.target.value)}
              />
            </div>
            <button type="submit" disabled={envoi}>{envoi ? 'Génération…' : 'Générer une clé'}</button>
          </form>
        </section>

        <section className="card" style={{ marginTop: 20, maxWidth: 560 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>Vos clés</h2></div>
          {!cles ? (
            <p className="help-text">Chargement…</p>
          ) : cles.length === 0 ? (
            <div className="empty-state">Aucune clé générée pour l'instant.</div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead><tr><th>Nom</th><th>Clé</th><th>Créée le</th><th>Dernière utilisation</th><th>Statut</th><th></th></tr></thead>
                <tbody>
                  {cles.map((c) => (
                    <tr key={c.id}>
                      <td>{c.nom}</td>
                      <td className="mono">{c.cle_masquee}</td>
                      <td className="help-text">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="help-text">{c.derniere_utilisation ? new Date(c.derniere_utilisation).toLocaleDateString('fr-FR') : 'Jamais utilisée'}</td>
                      <td>{c.actif ? <span className="badge disponible">Active</span> : <span className="badge reserve">Révoquée</span>}</td>
                      <td>
                        {!!c.actif && (
                          <button type="button" className="btn-danger" onClick={() => revoquerCle(c.id)}>Révoquer</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card" style={{ marginTop: 20, maxWidth: 560 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>Documentation rapide</h2></div>
          <p className="help-text">Deux points de lecture disponibles, en incluant votre clé dans l'en-tête de chaque requête :</p>
          <p className="mono" style={{ fontSize: '0.85rem' }}>Authorization: Bearer {'<votre_clé>'}</p>
          <ul style={{ paddingLeft: 20 }}>
            <li><span className="mono">GET https://creneauct.fr/api/v1/creneaux</span></li>
            <li><span className="mono">GET https://creneauct.fr/api/v1/rdv</span></li>
          </ul>
          <p className="help-text">
            Paramètres optionnels : <span className="mono">date_debut</span>, <span className="mono">date_fin</span> (YYYY-MM-DD),
            {' '}<span className="mono">statut</span>, <span className="mono">limite</span> (max 500).
          </p>
        </section>
      </main>
    </div>
  );
}

export default function ApiPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: 40 }}><p className="help-text">Chargement…</p></div>}>
      <ApiPageInner />
    </Suspense>
  );
}
