'use client';

import Logo from './Logo';

function formatMois(mois) {
  const [annee, m] = mois.split('-');
  const date = new Date(Number(annee), Number(m) - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function formatDateCourte(dateStr) {
  const d = new Date(dateStr.slice(0, 10) + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function FactureDocument({ centre, mois, lignes, total }) {
  return (
    <div className="facture-shell">
      <div className="facture-actions no-print">
        <button type="button" onClick={() => window.print()}>Imprimer / Enregistrer en PDF</button>
      </div>

      <div className="facture-document">
        <div className="facture-header">
          <div className="brand" style={{ color: 'var(--color-primary)' }}>
            <Logo size={40} />
            Créneau CT
          </div>
          <div className="facture-meta">
            <p className="help-text" style={{ margin: 0 }}>
              {/* À compléter avec vos informations d'entreprise (SIRET, adresse, etc.) une fois votre structure créée. */}
              Facture de commission — {formatMois(mois)}
            </p>
          </div>
        </div>

        <div className="facture-parties">
          <div>
            <p className="eyebrow" style={{ marginBottom: 4 }}>Émise par</p>
            <p style={{ margin: 0, fontWeight: 600 }}>Créneau CT</p>
            <p className="help-text" style={{ margin: 0 }}>Plateforme de réservation de contrôle technique</p>
          </div>
          <div>
            <p className="eyebrow" style={{ marginBottom: 4 }}>Adressée à</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{centre.nom}</p>
            <p className="help-text" style={{ margin: 0 }}>{centre.adresse}, {centre.code_postal} {centre.ville}</p>
          </div>
        </div>

        <table style={{ marginTop: 24 }}>
          <thead>
            <tr>
              <th>Réf. RDV</th>
              <th>Date réservation</th>
              <th>Date du contrôle</th>
              <th>Prix client</th>
              <th>Taux</th>
              <th>Commission</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.reference}>
                <td className="mono">{l.reference}</td>
                <td className="mono">{formatDateCourte(l.created_at)}</td>
                <td className="mono">{formatDateCourte(l.date_creneau)} {l.heure}</td>
                <td className="mono">{l.prix != null ? `${l.prix.toFixed(2)} €` : '—'}</td>
                <td className="mono">{l.commission_pourcentage}%</td>
                <td className="mono" style={{ fontWeight: 700 }}>{l.commission_montant != null ? `${l.commission_montant.toFixed(2)} €` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="facture-total">
          <span>Total dû pour {formatMois(mois)}</span>
          <span className="facture-total-montant">{total.toFixed(2)} €</span>
        </div>

        <p className="help-text" style={{ marginTop: 24 }}>
          {lignes.length} rendez-vous confirmé{lignes.length > 1 ? 's' : ''} via Créneau CT sur cette période.
          Commission calculée sur le prix payé par le client, selon le délai entre la réservation et la date du contrôle.
        </p>
      </div>
    </div>
  );
}
