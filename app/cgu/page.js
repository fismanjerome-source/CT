import Footer from '../components/Footer';
import Header from '../components/Header';

export const metadata = {
  title: 'Conditions Générales d\'Utilisation — Créneau CT',
};

export default function CGUPage() {
  return (
    <>
      <Header />

      <section className="container legal-content" style={{ padding: '40px 24px 64px' }}>
        <h1>Conditions Générales d'Utilisation</h1>
        <p className="help-text">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}</p>

        <div className="message-banner error" style={{ marginTop: 20 }}>
          Document en cours de finalisation, à faire valider par un professionnel du droit avant toute mise en
          exploitation commerciale réelle. Certaines informations (identité de l'éditeur) restent à compléter.
        </div>

        <h2>Article 1 — Objet</h2>
        <p>
          Les présentes Conditions Générales d'Utilisation (ci-après les « CGU ») ont pour objet de définir les
          modalités et conditions dans lesquelles Créneau CT (ci-après « la Plateforme », « nous ») met à disposition
          des utilisateurs un service de mise en relation entre des particuliers souhaitant faire réaliser un
          contrôle technique automobile ou moto (ci-après « l'Utilisateur », « le Client ») et des centres de
          contrôle technique agréés (ci-après « le Centre », « le Professionnel »).
        </p>
        <p>
          L'utilisation de la Plateforme, quelle qu'en soit la forme, implique l'acceptation pleine et entière des
          présentes CGU par l'Utilisateur et par le Centre.
        </p>

        <h2>Article 2 — Description du service</h2>
        <p>
          Créneau CT est un service de réservation en ligne permettant :
        </p>
        <ul>
          <li>aux Utilisateurs de consulter les disponibilités des Centres partenaires et de réserver un créneau de contrôle technique ;</li>
          <li>aux Centres de publier et gérer leurs créneaux disponibles, notamment ceux libérés à court terme dans leur planning.</li>
        </ul>
        <p>
          <strong>Créneau CT n'est pas un centre de contrôle technique</strong> et ne réalise elle-même aucun contrôle
          technique. La Plateforme agit exclusivement en qualité d'intermédiaire technique de mise en relation entre
          l'Utilisateur et le Centre. La réalisation du contrôle technique relève de la seule responsabilité du
          Centre, dans le respect de la réglementation applicable au contrôle technique des véhicules.
        </p>

        <h2>Article 3 — Réservation d'un rendez-vous</h2>
        <p>
          La réservation d'un créneau via la Plateforme constitue un engagement de l'Utilisateur à se présenter au
          Centre choisi, à la date et l'heure sélectionnées, muni du véhicule concerné et des documents requis pour
          le contrôle technique.
        </p>
        <p>
          Chaque réservation confirmée donne lieu à l'envoi d'une référence unique, permettant à l'Utilisateur de
          consulter ou d'annuler son rendez-vous depuis la page dédiée du site.
        </p>

        <h2>Article 4 — Prix et paiement</h2>
        <p>
          Le prix du contrôle technique affiché sur la Plateforme est fixé librement par chaque Centre et lui est
          intégralement dû. <strong>Le règlement du contrôle technique s'effectue directement auprès du Centre</strong>,
          selon les moyens de paiement qu'il accepte — la Plateforme n'intervient pas dans cette transaction et ne
          perçoit, à ce jour, aucun paiement de la part de l'Utilisateur.
        </p>
        <p>
          Le prix affiché tient compte, le cas échéant, d'une remise accordée librement par le Centre, à sa seule
          discrétion, ou d'une promotion ponctuelle proposée par la Plateforme elle-même — auquel cas la
          commission normalement due par le Centre à la Plateforme est réduite en conséquence, sans aucune
          répercussion sur le prix payé par l'Utilisateur ni sur la rémunération du Centre. Le prix final affiché
          avant confirmation de la réservation est celui effectivement dû par l'Utilisateur au Centre.
        </p>

        <h2>Article 5 — Modification, annulation et absence</h2>
        <p>
          L'Utilisateur peut, gratuitement et sans justificatif, annuler ou modifier son rendez-vous à tout moment
          avant sa date, depuis la page « Suivre un RDV », à l'aide de sa référence de réservation et de l'adresse
          email utilisée lors de la réservation. Le créneau annulé ou libéré par une modification est immédiatement
          remis à disposition des autres Utilisateurs.
        </p>
        <p>
          Par mesure d'organisation, aucun créneau ne peut être réservé ou modifié s'il reste moins d'1h30 avant
          son horaire.
        </p>
        <p>
          En cas d'absence de l'Utilisateur au rendez-vous sans annulation préalable, le Centre peut le signaler
          depuis son espace professionnel ; la commission normalement due à la Plateforme sur ce rendez-vous n'est
          alors pas exigible. L'Utilisateur en est informé par email. Un email de suivi est par ailleurs envoyé à
          chaque Utilisateur après son rendez-vous afin de vérifier son bon déroulement. En cas d'absences
          répétées et avérées, la Plateforme se réserve le droit de refuser toute réservation ultérieure de la
          part de l'Utilisateur concerné.
        </p>

        <h2>Article 6 — Obligations des Centres partenaires</h2>
        <p>
          Chaque Centre s'engage à ne publier sur la Plateforme que des créneaux réellement disponibles, à honorer
          les rendez-vous confirmés, et à fournir des informations exactes (prix, coordonnées, agrément). Le Centre
          demeure seul responsable de la conformité de ses prestations à la réglementation applicable au contrôle
          technique.
        </p>

        <h2>Article 7 — Responsabilité</h2>
        <p>
          La Plateforme met tout en œuvre pour assurer l'exactitude des informations affichées (disponibilités,
          prix), sans pouvoir garantir l'absence totale d'erreur, notamment en cas de modification de dernière
          minute par un Centre. La Plateforme ne saurait être tenue responsable de la qualité, de la conformité ou
          des conditions de réalisation du contrôle technique lui-même, qui relèvent exclusivement du Centre.
        </p>
        <p>
          Conformément à l'article L.441-10 du Code de commerce, tout retard de paiement d'une commission par un
          Centre donne lieu, de plein droit et sans mise en demeure préalable, à des pénalités calculées au taux
          d'intérêt de la Banque Centrale Européenne majoré de 10 points, ainsi qu'à une indemnité forfaitaire pour
          frais de recouvrement de 40 €. Ce montant peut être révisé par la Plateforme sur présentation des frais
          réellement engagés.
        </p>

        <h2>Article 8 — Données personnelles</h2>
        <p>
          Les données transmises lors d'une réservation (nom, email, téléphone, immatriculation) sont utilisées
          exclusivement pour la gestion du rendez-vous et sa communication au Centre concerné. Conformément au
          Règlement Général sur la Protection des Données (RGPD), toute personne dispose d'un droit d'accès, de
          rectification et de suppression de ses données, qu'elle peut exercer en écrivant à
          contact@creneauct.fr. Les Centres partenaires disposent en outre d'un accès direct à la suppression de
          leurs données personnelles depuis leur espace professionnel (rubrique Paramètres). Par obligation légale
          de conservation des documents comptables, l'historique des rendez-vous déjà honorés est conservé de
          façon anonyme après suppression d'un compte, sans qu'aucune donnée ne permette plus d'identifier la
          personne concernée.
        </p>
        <p>
          Par ailleurs, la Plateforme mesure sa fréquentation à des fins statistiques internes (pages consultées,
          ville et région estimées à partir de l'adresse IP de connexion). Cette mesure ne repose sur aucun cookie
          ni traceur, et l'adresse IP elle-même n'est jamais conservée : seule une localisation approximative
          (ville, région) en est déduite au moment de la visite, sans lien possible avec l'identité de la personne.
        </p>

        <h2>Article 9 — Propriété intellectuelle</h2>
        <p>
          L'ensemble des éléments composant la Plateforme (structure, textes, logo, charte graphique) est protégé au
          titre du droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.
        </p>

        <h2>Article 10 — Droit applicable</h2>
        <p>
          Les présentes CGU sont soumises au droit français. Tout litige relatif à leur interprétation ou leur
          exécution relève, à défaut de résolution amiable, des juridictions françaises compétentes.
        </p>

        <h2>Article 11 — Modification des CGU</h2>
        <p>
          La Plateforme se réserve le droit de modifier les présentes CGU à tout moment. Les Utilisateurs sont
          invités à les consulter régulièrement.
        </p>
      </section>

      <Footer />
    </>
  );
}
