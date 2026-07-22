import Footer from '../components/Footer';
import Header from '../components/Header';

export const metadata = {
  title: 'Sécurité et confidentialité — Créneau CT',
  description: "Comment Créneau CT protège vos données : mots de passe chiffrés, agenda en lecture seule et révocable, double authentification, transparence sur nos limites.",
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
            comment fonctionne la sécurité de Créneau CT — et ce qu'on ne prétend pas être.
          </p>
        </div>
      </section>

      <section className="container legal-content" style={{ padding: '40px 24px 64px' }}>

        <h2>🗓️ Le lien de votre agenda externe</h2>
        <p>
          Le lien que vous nous transmettez pour synchroniser votre agenda (Google Calendar, Outlook...)
          <strong> n'est jamais un accès à votre compte</strong> — c'est un lien de lecture seule que votre propre
          service de messagerie génère spécifiquement pour être partagé, le même mécanisme que vous utiliseriez
          pour partager votre agenda avec un collègue.
        </p>
        <ul>
          <li>Nous ne pouvons que <strong>consulter</strong> vos événements existants, jamais en créer, modifier ou supprimer</li>
          <li>Ce lien n'est jamais partagé avec d'autres centres ni avec un tiers</li>
          <li>Vous pouvez le <strong>révoquer à tout moment</strong>, directement depuis les paramètres de votre propre agenda, sans même nous prévenir — l'ancien lien cesse alors immédiatement de fonctionner</li>
        </ul>

        <h2>🔐 Ce qui protège vos données au quotidien</h2>
        <ul>
          <li>Les mots de passe ne sont <strong>jamais stockés en clair</strong> : ils sont chiffrés (hachés) avec un algorithme moderne (scrypt), impossible à retrouver même en cas d'accès à la base de données</li>
          <li>Toutes les connexions au site passent par <strong>HTTPS</strong> (chiffrement des données en transit)</li>
          <li>Les sessions de connexion sont signées cryptographiquement pour empêcher toute falsification</li>
          <li>L'espace admin est protégé par <strong>double authentification</strong> (le même principe que sur une banque en ligne)</li>
          <li>Chaque centre ne voit que ses propres données — jamais celles d'un autre centre</li>
        </ul>

        <h2>🎯 Ce que nous ne prétendons pas être</h2>
        <p>
          Créneau CT est une plateforme jeune, en développement actif. Nous n'avons pas encore fait auditer notre
          sécurité par un organisme externe (audit de sécurité, certification type ISO 27001 ou SOC2) — une étape
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
