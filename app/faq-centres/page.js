import Link from 'next/link';
import Footer from '../components/Footer';
import Header from '../components/Header';

export const metadata = {
  title: 'FAQ Centres',
  description: "Toutes les réponses pour les centres de contrôle technique partenaires : commission, remises, multi-centres, facturation, gestion des créneaux.",
  openGraph: {
    title: 'FAQ Centres — Créneau CT',
    description: "Toutes les réponses pour les centres de contrôle technique partenaires : commission, remises, multi-centres, facturation, gestion des créneaux.",
  },
};

const questions = [
  {
    q: "💸 Y a-t-il un abonnement ou des frais fixes pour rejoindre Créneau CT ?",
    r: "Aucun. Pas d'abonnement mensuel, pas de frais d'inscription, pas de frais de résiliation. Vous ne payez une commission que sur les rendez-vous réellement pris via la plateforme, rien du tout si aucun client ne réserve.",
  },
  {
    q: "🧮 Comment est calculée la commission ?",
    r: "Elle est calculée automatiquement à chaque réservation, sur le prix effectivement payé par le client (donc après une éventuelle remise que vous avez vous-même choisie) : 25% si le rendez-vous est pris dans les 7 jours, 20% entre 7 et 14 jours, 15% au-delà. Le taux dépend uniquement du délai entre la réservation et la date du contrôle, jamais d'autre critère caché.",
  },
  {
    q: "🏷️ Suis-je obligé d'offrir une remise à mes clients ?",
    r: "Non, jamais. La remise est entièrement optionnelle et reste à votre entière discrétion, créneau par créneau. Si vous ne renseignez rien, le client paie votre prix plein.",
  },
  {
    q: "📄 Comment je sais ce que je dois à Créneau CT ?",
    r: "Tout est transparent et consultable à tout moment dans votre espace professionnel : chaque créneau de votre planning affiche le prix client, la commission correspondante, et ce qui vous reste net. Une facture détaillée est aussi générée automatiquement chaque mois avec activité, téléchargeable en PDF.",
  },
  {
    q: "🚗 Puis-je choisir les véhicules que j'accepte ?",
    r: "Oui. Vous déclarez dans votre espace professionnel les catégories que votre centre est équipé pour contrôler (essence/diesel, GPL, hybride, électrique, moto), et vous pouvez même restreindre certains créneaux à une catégorie précise si besoin.",
  },
  {
    q: "🏢 Je gère plusieurs centres, puis-je tout gérer avec un seul compte ?",
    r: "Oui. Depuis votre espace professionnel, vous pouvez ajouter autant de centres que nécessaire à votre compte et basculer facilement de l'un à l'autre, sans avoir à créer un compte séparé par centre.",
  },
  {
    q: "📅 Comment sont sélectionnés les créneaux à publier ?",
    r: "C'est entièrement vous qui décidez : ouverture ponctuelle d'un créneau, ou en un clic via « Combler des horaires vides » pour publier automatiquement tous vos créneaux libres sur une période donnée.",
  },
  {
    q: "📱 Puis-je gérer mon planning depuis mon téléphone ou ma tablette ?",
    r: "Oui, entièrement. Votre espace professionnel fonctionne aussi bien sur ordinateur que sur smartphone ou tablette, sans rien à installer : juste vous connecter depuis un navigateur. Pratique pour ouvrir un créneau de dernière minute ou vérifier vos rendez-vous du jour, même loin du bureau.",
  },
  {
    q: "🔐 Puis-je activer une double authentification sur mon compte ?",
    r: "Oui. Depuis l'onglet « Paramètres » de votre espace, vous pouvez activer une double authentification (le même principe que sur une banque en ligne) : un code à 6 chiffres généré par une application comme Google Authenticator, en plus de votre mot de passe. Totalement facultatif, mais recommandé si le service informatique de votre réseau vous le demande par exemple.",
  },
  {
    q: "★ Pourquoi certains centres ont une étoile ?",
    r: "Cette étoile signale un centre en statut « Premium » : pour 30 € TTC par mois, sans engagement, ce centre apparaît en tête des résultats de recherche, avec un icône doré visible par les clients. Vous pouvez l'activer pour votre propre centre à tout moment depuis l'onglet « Premium » de votre espace. Le premier mois est calculé au prorata du nombre de jours restants, tout comme le dernier si vous arrêtez.",
  },
  {
    q: "🎁 Comment fonctionne le parrainage ?",
    r: "Chaque centre dispose d'un code de parrainage unique, visible dans l'onglet « Premium » de son espace. Un autre centre s'inscrit en renseignant ce code, puis honore son tout premier rendez-vous ? Vous recevez automatiquement 2 mois de statut Premium offerts, sans rien avoir à demander : la récompense est créditée dès que la condition est remplie.",
  },
];

export default function FAQCentresPage() {
  const donneesStructurees = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: item.q.replace(/^[^\p{L}\p{N}]+\s*/u, '').trim(),
      acceptedAnswer: { '@type': 'Answer', text: item.r },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees) }}
      />
      <Header />

      <section className="hero">
        <div className="container">
          <div className="eyebrow">❓ Questions fréquentes</div>
          <h1>FAQ Centres de contrôle technique</h1>
          <p className="lead">
            Notre engagement : la transparence totale, sans abonnement. Voici comment ça fonctionne concrètement.
          </p>
        </div>
      </section>

      <section className="container legal-content" style={{ padding: '32px 24px 64px' }}>
        {questions.map((item) => (
          <div key={item.q} style={{ marginBottom: 28 }}>
            <h2>{item.q}</h2>
            <p>{item.r}</p>
          </div>
        ))}

        <div className="empty-state" style={{ marginTop: 20 }}>
          Une autre question ? <Link href="/contact">Contactez-nous</Link>, nous répondons rapidement.
        </div>
      </section>

      <Footer />
    </>
  );
}
