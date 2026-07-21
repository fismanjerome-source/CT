import Footer from '../components/Footer';
import Header from '../components/Header';

export const metadata = {
  title: 'FAQ Clients — Créneau CT',
};

const questions = [
  {
    q: "💶 Est-ce que je paie plus cher en passant par Créneau CT ?",
    r: "Non. Le prix affiché est celui fixé par le centre — c'est exactement ce que vous payez sur place, ni plus ni moins. Créneau CT ne facture rien au client : notre rémunération vient d'une commission que le centre nous verse, jamais répercutée sur votre facture.",
  },
  {
    q: "💳 Dois-je payer en ligne au moment de la réservation ?",
    r: "Non, aucun paiement en ligne n'est demandé. Vous réglez directement au centre, le jour du contrôle, avec le moyen de paiement qu'il accepte.",
  },
  {
    q: "🚗 Comment savoir si un centre fait bien ma catégorie de véhicule ?",
    r: "Chaque centre affiche les catégories qu'il accepte (essence/diesel, GPL, hybride, électrique, moto). Sur la page du centre, sélectionnez votre véhicule : seuls les créneaux compatibles s'affichent.",
  },
  {
    q: "🔄 Puis-je annuler ou modifier mon rendez-vous ?",
    r: "Vous pouvez annuler gratuitement à tout moment depuis la page « Suivre un RDV », avec votre référence de réservation et l'email utilisé. Le créneau est aussitôt remis à disposition. Pour modifier l'heure, il suffit d'annuler puis de reprendre un nouveau créneau.",
  },
  {
    q: "🏷️ Que se passe-t-il si le prix affiché comporte une remise ?",
    r: "Certains centres choisissent librement d'appliquer une remise sur certains créneaux. Si c'est le cas, le prix initial barré et le prix final s'affichent clairement avant la confirmation — vous savez toujours exactement combien vous paierez.",
  },
  {
    q: "🔍 Créneau CT réalise-t-il lui-même le contrôle technique ?",
    r: "Non. Créneau CT est une plateforme de mise en relation : nous ne sommes pas un centre de contrôle technique et ne réalisons aucun contrôle. Le rendez-vous est honoré par le centre agréé que vous avez choisi, seul responsable de la prestation.",
  },
  {
    q: "📍 Que faire si je ne trouve pas de créneau qui me convient ?",
    r: "Essayez le bouton « Prochain RDV disponible près de chez moi » en page d'accueil, qui cherche automatiquement le créneau le plus proche géographiquement. Vous pouvez aussi élargir votre recherche à d'autres villes voisines.",
  },
  {
    q: "🚓 Que faire si je me fais arrêter par la police avec un contrôle technique expiré ?",
    r: "Réservez un créneau au plus vite : la loi n'accorde aucune tolérance une fois la date dépassée, et l'amende (135 € forfaitaire, jusqu'à 375 € en cas de retard de paiement) tombe immédiatement. Les forces de l'ordre peuvent retenir votre carte grise sur place et immobiliser le véhicule — un délai de régularisation (généralement 7 jours) vous est alors accordé pour passer le contrôle. Présentez-vous au centre avec votre carte grise et, si vous l'avez, le procès-verbal remis par les forces de l'ordre. Une fois le contrôle technique favorable obtenu, il faudra ensuite vous rendre au commissariat ou à la gendarmerie qui a retenu votre carte grise pour la récupérer, justificatif du nouveau contrôle à l'appui.",
  },
];

export default function FAQClientsPage() {
  return (
    <>
      <Header />

      <section className="hero">
        <div className="container">
          <div className="eyebrow">❓ Questions fréquentes</div>
          <h1>FAQ — Particuliers</h1>
          <p className="lead">Tout ce qu'il faut savoir avant de réserver votre contrôle technique.</p>
        </div>
      </section>

      <section className="container legal-content" style={{ padding: '32px 24px 64px' }}>
        {questions.map((item) => (
          <div key={item.q} style={{ marginBottom: 28 }}>
            <h2>{item.q}</h2>
            <p>{item.r}</p>
          </div>
        ))}
      </section>

      <Footer />
    </>
  );
}
