import Link from 'next/link';
import Footer from '../components/Footer';
import Header from '../components/Header';

export const metadata = {
  title: 'Mentions légales — Créneau CT',
};

export default function MentionsLegalesPage() {
  return (
    <>
      <Header />

      <section className="container legal-content" style={{ padding: '40px 24px 64px' }}>
        <h1>Mentions légales</h1>

        <div className="message-banner error" style={{ marginTop: 20 }}>
          Cette page doit impérativement être complétée avant toute mise en ligne publique définitive : l'affichage
          de mentions légales incomplètes ou inexactes est une infraction en droit français (loi n°2004-575 du 21
          juin 2004 pour la confiance dans l'économie numérique). Les champs entre crochets sont à renseigner dès
          l'immatriculation de votre activité (auto-entrepreneur ou autre statut).
        </div>

        <h2>Éditeur du site</h2>
        <p>
          Le site Créneau CT est édité par :<br />
          [NOM ET PRÉNOM OU DÉNOMINATION SOCIALE À COMPLÉTER]<br />
          Statut : [Entrepreneur individuel / Auto-entrepreneur / Société — À COMPLÉTER]<br />
          SIRET : [À COMPLÉTER après immatriculation]<br />
          Adresse : [ADRESSE À COMPLÉTER]<br />
          Email de contact : contact@creneauct.fr<br />
          Téléphone : 01 86 76 12 34 [NUMÉRO FICTIF, À REMPLACER PAR LE VÔTRE]
        </p>

        <h2>Directeur de la publication</h2>
        <p>[NOM DU RESPONSABLE DE PUBLICATION À COMPLÉTER]</p>

        <h2>Hébergement</h2>
        <p>
          Le site est hébergé par :<br />
          Render Services, Inc.<br />
          525 Brannan Street, Suite 300, San Francisco, CA 94107, États-Unis<br />
          <a href="https://render.com" target="_blank" rel="noopener noreferrer">render.com</a>
        </p>
        <p>
          La base de données est hébergée par :<br />
          Turso (Iku Inc.)<br />
          <a href="https://turso.tech" target="_blank" rel="noopener noreferrer">turso.tech</a>
        </p>
        <p>
          L'envoi des emails automatiques (confirmation, rappel de rendez-vous) est assuré par :<br />
          Resend<br />
          <a href="https://resend.com" target="_blank" rel="noopener noreferrer">resend.com</a>
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L'ensemble du contenu du site Créneau CT (textes, logo, charte graphique, structure) est protégé par le
          droit d'auteur. Toute reproduction, représentation ou exploitation, totale ou partielle, sans autorisation
          préalable, est interdite.
        </p>

        <h2>Données personnelles</h2>
        <p>
          Le traitement des données personnelles collectées sur le site est décrit dans nos{' '}
          <Link href="/cgu">Conditions Générales d'Utilisation</Link> (article 8). Conformément au RGPD, vous
          disposez d'un droit d'accès, de rectification et de suppression de vos données, exerçable auprès de
          contact@creneauct.fr. Les centres partenaires peuvent également supprimer leurs données personnelles
          directement depuis leur espace professionnel.
        </p>

        <h2>Cookies</h2>
        <p>
          Le site utilise uniquement des cookies strictement nécessaires à son fonctionnement (maintien de la
          connexion à l'espace professionnel ou admin). Aucun cookie publicitaire ou de traçage tiers n'est déposé.
        </p>

        <h2>Médiation de la consommation</h2>
        <p>
          Conformément à l'article L.616-1 du Code de la consommation, en cas de litige non résolu directement avec
          nous, le Client peut recourir gratuitement à un médiateur de la consommation. [COORDONNÉES DU MÉDIATEUR
          À COMPLÉTER après immatriculation de l'activité].
        </p>
      </section>

      <Footer />
    </>
  );
}
