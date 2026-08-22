'use client';

import ProSidebar from '../../components/ProSidebar';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const OFFRES = [
  { nom: 'Standard', duree: '3 semaines', prix: '99 € HT' },
  { nom: 'CT en Folie', duree: '1 mois et demi', prix: '149 € HT' },
  { nom: 'CT en Folie ++', duree: '3 mois', prix: '249 € HT' },
  { nom: 'Urgence', duree: '2 mois, publication sous 2h', prix: '199 € HT' },
  { nom: 'CT en Folie Itinérant', duree: '2 mois (poste itinérant)', prix: '179 € HT' },
  { nom: 'CT en Folie Pro', duree: '6 mois, jusqu\u2019à 3 postes', prix: '349 € HT' },
];

function RecrutementInner() {
  const searchParams = useSearchParams();
  const centreId = searchParams.get('centre');

  return (
    <div className="pro-shell">
      <ProSidebar centreId={centreId} />

      <main className="pro-main">
        <h1>Recrutement</h1>
        <p className="help-text">
          En partenariat avec <strong>CT en Folie</strong>, l'agence de recrutement spécialisée dans le contrôle
          technique automobile, moto et poids lourd.
        </p>

        <section className="card" style={{ marginTop: 16, maxWidth: 640, borderColor: 'var(--color-accent)' }}>
          <div className="card-header"><h2 style={{ margin: 0, color: 'var(--color-accent)' }}>★ Votre avantage centre partenaire</h2></div>
          <p>
            En tant qu'utilisateur de Créneau CT, vous bénéficiez de <strong>10 % de réduction</strong> sur toutes
            les offres de recrutement CT en Folie (diffusion d'annonces, accès CVthèque, formules Pro...).
          </p>
          <p className="help-text" style={{ marginBottom: 0 }}>
            <strong>Pour en bénéficier</strong>, envoyez une demande à{' '}
            <a href="mailto:contact@ct-en-folie.com">contact@ct-en-folie.com</a>, ou via{' '}
            <Link href="/pro/contact">la page Contact de votre espace</Link>, en rappelant le nom de votre centre.
          </p>
        </section>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-header"><h2 style={{ margin: 0 }}>Les formules CT en Folie</h2></div>
          <p className="help-text">
            Un aperçu des principales formules de diffusion d'offres d'emploi — tarifs à titre indicatif (hors
            réduction partenaire), le détail complet et à jour est toujours sur leur site.
          </p>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Formule</th><th>Durée de diffusion</th><th>Tarif</th></tr></thead>
              <tbody>
                {OFFRES.map((o) => (
                  <tr key={o.nom}>
                    <td>{o.nom}</td>
                    <td className="help-text">{o.duree}</td>
                    <td className="mono">{o.prix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="help-text" style={{ marginTop: 10 }}>
            Existe aussi : une formule <strong>« Itinérant »</strong> pour les postes mobiles, et un{' '}
            <strong>abonnement annuel</strong> avec accompagnement RH et juridique illimité.
          </p>
        </section>

        <a
          href="https://ct-en-folie.com/services/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          style={{ display: 'inline-block', marginTop: 20 }}
        >
          Voir toutes les offres sur ct-en-folie.com ↗
        </a>
      </main>
    </div>
  );
}

export default function RecrutementPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: 40 }}><p className="help-text">Chargement…</p></div>}>
      <RecrutementInner />
    </Suspense>
  );
}
