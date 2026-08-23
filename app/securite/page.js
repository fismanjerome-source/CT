import Footer from '../components/Footer';
import Header from '../components/Header';

export const metadata = {
  title: 'Sécurité et confidentialité',
  description: "Comment Créneau CT protège vos données : accès API en lecture seule, mots de passe et clés chiffrés, agenda révocable, double authentification, transparence sur nos limites.",
  openGraph: {
    title: 'Sécurité et confidentialité — Créneau CT',
    description: "Comment Créneau CT protège vos données : accès API en lecture seule, mots de passe et clés chiffrés, agenda révocable, double authentification, transparence sur nos limites.",
  },
};

export default function SecuritePage() {
  return (
    <>
      <Header />

      <section className="hero">
        <div className="container">
          <div className="eyebrow">🔒 Confiance</div>
          <h1>Sécurité et confidentialité</h1>
          <p className="lead">
            Une question légitime, surtout quand il s'agit de relier votre agenda. Voici, en toute transparence,
            comment fonctionne la sécurité de Créneau CT, et ce qu'on ne prétend pas être.
          </p>
        </div>
      </section>

      <section className="container legal-content" style={{ padding: '40px 24px 64px' }}>

        <h2>🔌 Accès par API pour les centres équipés</h2>
        <p>
          Si votre centre utilise déjà un logiciel de planning, vous pouvez générer une <strong>clé API</strong> en
          lecture seule depuis votre espace professionnel (onglet « Clés API ») pour récupérer automatiquement vos
          créneaux et vos rendez-vous, sans ressaisie manuelle. Une spécification technique complète (OpenAPI) est
          publiée sur{' '}
          <a href="/openapi.json" target="_blank" rel="noopener noreferrer">creneauct.fr/openapi.json</a>.
        </p>
        <ul>
          <li>Accès <strong>strictement en lecture</strong> à vos propres créneaux et rendez-vous, jamais en écriture ni sur les données d'un autre centre</li>
          <li>La clé n'est <strong>affichée qu'une seule fois</strong>, à sa création : nous ne la stockons jamais en clair, seule une empreinte cryptographique (hachage) permet de la vérifier, exactement comme pour un mot de passe</li>
          <li>Vous pouvez générer plusieurs clés, les nommer, et les <strong>révoquer individuellement à tout moment</strong> depuis votre espace</li>
        </ul>
        <p className="help-text">
          Réservé aux centres à l'aise avec ce type d'intégration technique ; pour un usage simple, la
          synchronisation d'agenda décrite ci-dessous suffit largement.
        </p>

        <h2>🗓️ Le lien de votre agenda externe</h2>
        <p>
          Le lien que vous nous transmettez pour synchroniser votre agenda (Google Calendar, Outlook...)
          <strong> n'est jamais un accès à votre compte</strong> : c'est un lien de lecture seule que votre propre
          service de messagerie génère spécifiquement pour être partagé, le même mécanisme que vous utiliseriez
          pour partager votre agenda avec un collègue.
        </p>
        <ul>
          <li>Nous ne pouvons que <strong>consulter</strong> vos événements existants, jamais en créer, modifier ou supprimer</li>
          <li>Ce lien n'est jamais partagé avec d'autres centres ni avec un tiers</li>
          <li>Vous pouvez le <strong>révoquer à tout moment</strong>, directement depuis les paramètres de votre propre agenda, sans même nous prévenir : l'ancien lien cesse alors immédiatement de fonctionner</li>
        </ul>

        <h2>🔐 Ce qui protège vos données au quotidien</h2>
        <ul>
          <li>Les mots de passe ne sont <strong>jamais stockés en clair</strong> : ils sont chiffrés (hachés) avec un algorithme moderne (scrypt), impossible à retrouver même en cas d'accès à la base de données. Les clés API subissent le même traitement</li>
          <li>Toutes les connexions au site passent par <strong>HTTPS</strong>, avec redirection forcée et mémorisation par le navigateur (HSTS) pour empêcher tout downgrade vers une connexion non chiffrée</li>
          <li>Les sessions de connexion sont signées cryptographiquement pour empêcher toute falsification</li>
          <li>Une <strong>double authentification</strong> (le même principe que sur une banque en ligne) est disponible aussi bien pour l'espace admin que pour chaque centre partenaire, activable librement depuis son espace</li>
          <li>Chaque centre ne voit que ses propres données, jamais celles d'un autre centre</li>
          <li>Les formulaires publics (réservation, contact, connexion) sont protégés contre les tentatives automatisées en masse (limite du nombre d'essais par adresse IP)</li>
          <li>Une politique de sécurité au niveau du navigateur (Content-Security-Policy et en-têtes associés) limite ce qu'une page peut charger ou exécuter, en plus des protections classiques contre le détournement de clic (clickjacking)</li>
          <li>Nos dépendances logicielles sont tenues à jour pour corriger les failles connues dès qu'elles sont publiées</li>
        </ul>

        <h2>🛡️ Vous avez trouvé une faille ?</h2>
        <p>
          Nous n'avons pas encore de programme de récompense formel, mais tout signalement responsable est le
          bienvenu et traité sérieusement : écrivez-nous à{' '}
          <a href="mailto:contact@creneauct.fr">contact@creneauct.fr</a>, ou consultez{' '}
          <a href="/.well-known/security.txt" target="_blank" rel="noopener noreferrer">notre fichier security.txt</a>{' '}
          pour les coordonnées à jour. Merci de ne pas divulguer publiquement une faille avant qu'on ait pu la
          corriger.
        </p>

        <h2>🎯 Ce que nous ne prétendons pas être</h2>
        <p>
          Créneau CT est une plateforme jeune, en développement actif. Nous n'avons pas encore fait auditer notre
          sécurité par un organisme externe (audit de sécurité, certification type ISO 27001 ou SOC2), une étape
          que nous envisageons à mesure que la plateforme grandit. Nous préférons vous le dire clairement plutôt
          que de prétendre à des garanties que nous n'avons pas.
        </p>
        <p>
          Une question de sécurité spécifique, ou une exigence particulière de votre part ? Contactez-nous
          directement, nous en discutons volontiers.
        </p>

      </section>

      <Footer />
    </>
  );
}
