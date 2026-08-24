import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Contrôle technique automobile : le guide complet',
  description: '136 points de contrôle, périodicité tous les 2 ans, contre-visite : tout savoir sur le contrôle technique voiture en France.',
  alternates: { canonical: '/guide/auto' },
  openGraph: {
    title: 'Contrôle technique automobile : le guide complet — Créneau CT',
    description: '136 points de contrôle, périodicité tous les 2 ans, contre-visite : tout savoir sur le contrôle technique voiture en France.',
  },
};

export default function GuideAutoPage() {
  return (
    <>
      <Header />

      <section className="hero">
        <div className="container">
          <div className="eyebrow">Guide pratique automobile</div>
          <h1>Le contrôle technique automobile : le guide complet</h1>
          <p className="lead">
            Ce qu'il faut savoir avant de prendre rendez-vous : qui est concerné, à quelle fréquence, ce qui est
            vérifié, et surtout comment éviter la contre-visite.
          </p>
        </div>
      </section>

      <section className="container legal-content" style={{ padding: '32px 24px 64px' }}>

        <div className="guide-card">
          <h2>🚘 Qui doit passer le contrôle technique ?</h2>
          <p>
            Toute voiture particulière ou camping-car dont le poids total autorisé en charge ne dépasse pas 3,5
            tonnes (catégorie M1 sur la carte grise) doit passer un contrôle technique, quelle que soit son
            énergie (essence, diesel, hybride ou électrique). Quelques véhicules spécifiques en sont dispensés,
            mais la grande majorité des voitures particulières sont concernées.
          </p>
        </div>

        <div className="guide-card">
          <h2>📅 Quand faire son premier contrôle technique ?</h2>
          <p>
            Pour un véhicule neuf, le premier contrôle doit être réalisé dans les <strong>6 mois précédant le
            4ᵉ anniversaire</strong> de sa première mise en circulation. Par exemple, un véhicule mis en
            circulation le 1ᵉʳ octobre 2022 doit passer son premier contrôle entre le 1ᵉʳ avril et le 30
            septembre 2026. Aucune convocation n'est envoyée : c'est à vous de prendre l'initiative.
          </p>
        </div>

        <div className="guide-card">
          <h2>🔁 À quelle fréquence renouveler le contrôle ?</h2>
          <p>
            Si le résultat est favorable, le contrôle technique est valable <strong>2 ans</strong>. La date
            limite est indiquée par un timbre apposé sur la carte grise. Un contrôle réalisé le 14 mai 2025 avec
            un résultat favorable reste valable jusqu'au 13 mai 2027.
          </p>
        </div>

        <div className="guide-card">
          <h2>🔍 Les 136 points de contrôle</h2>
          <p>
            Le contrôleur examine <strong>136 points répartis en 9 grandes familles</strong>, définies par
            arrêté ministériel :
          </p>
          <ul>
            <li><strong>Identification</strong> du véhicule (plaque, numéro de série, éventuelle campagne de rappel)</li>
            <li><strong>Freinage</strong> (plaquettes, disques, efficacité)</li>
            <li><strong>Direction</strong> (volant, boîtier de direction)</li>
            <li><strong>Visibilité</strong> (pare-brise, rétroviseurs, essuie-glaces)</li>
            <li><strong>Feux, dispositifs réfléchissants et équipements électriques</strong> (y compris batterie et câble de recharge sur un véhicule électrique)</li>
            <li><strong>Essieux, roues, pneus, suspension</strong></li>
            <li><strong>Châssis et accessoires du châssis</strong></li>
            <li>Autre matériel : <strong>ceintures de sécurité, avertisseur sonore</strong></li>
            <li><strong>Nuisances</strong> : niveau de pollution et niveau sonore</li>
          </ul>
          <p className="help-text" style={{ marginTop: 10 }}>
            Depuis le 1ᵉʳ janvier 2026, le contrôle vérifie aussi si le véhicule est concerné par une campagne
            de rappel qualifiée de grave par le constructeur (par exemple les airbags Takata). Si c'est le cas
            et que la réparation n'a pas été faite, le véhicule ne peut plus circuler dès le lendemain du
            contrôle.
          </p>
        </div>

        <div className="guide-card">
          <h2>✅ Le résultat du contrôle</h2>
          <p>Trois issues sont possibles, selon la gravité des défaillances relevées :</p>
          <ul>
            <li><strong>Favorable</strong> : aucune défaillance majeure ni critique. Rien à faire avant le prochain contrôle dans 2 ans.</li>
            <li><strong>Défavorable pour défaillance majeure</strong> : au moins un point pouvant compromettre la sécurité ou l'environnement. Contrôle valable seulement 2 mois.</li>
            <li><strong>Défavorable pour défaillance critique</strong> : un danger direct et immédiat. Le contrôle n'est valable que le jour même.</li>
          </ul>
        </div>

        <div className="guide-card accent-danger">
          <h2>⚠️ Le vrai risque : la contre-visite</h2>
          <p>
            C'est le point à ne surtout pas négliger. Dès qu'une défaillance majeure ou critique est constatée,
            vous devez faire réparer le véhicule <strong>et repasser une contre-visite dans un délai de 2
            mois</strong> après le contrôle initial, dans n'importe quel centre agréé, pas nécessairement
            celui d'origine.
          </p>
          <p style={{ marginTop: 10 }}>
            Si la contre-visite est favorable, elle prolonge la validité <strong>jusqu'à 2 ans après la date du
            contrôle initial défavorable</strong>, pas 2 ans après la contre-visite elle-même. Autrement dit,
            plus vous tardez à faire réparer et contre-visiter votre véhicule, plus vous rognez sur la durée de
            validité obtenue. À l'inverse, si vous ne présentez pas le procès-verbal de contre-visite ou que le
            délai de 2 mois est dépassé, le véhicule est soumis à un tout nouveau contrôle technique complet.
          </p>
        </div>

        <div className="guide-card accent-succes">
          <h2>💡 Nos conseils avant de passer le contrôle technique</h2>
          <p>Quelques vérifications simples permettent souvent d'éviter une contre-visite :</p>
          <ul>
            <li>Contrôlez l'état et la profondeur de vos <strong>pneus</strong> (usure, pression, absence de hernie)</li>
            <li>Vérifiez que tous vos <strong>feux et clignotants</strong> fonctionnent, y compris l'éclairage de plaque</li>
            <li>Assurez-vous que le <strong>pare-brise</strong> n'a pas d'impact dans le champ de vision du conducteur</li>
            <li>Vérifiez les <strong>niveaux</strong> (liquide de frein, liquide de refroidissement, lave-glace)</li>
            <li>Contrôlez l'état de vos <strong>essuie-glaces</strong></li>
            <li>Assurez-vous que le <strong>triangle de signalisation et le gilet réfléchissant</strong> sont bien à bord</li>
            <li>Vérifiez que votre <strong>plaque d'immatriculation</strong> est propre, fixée et lisible</li>
            <li>Faites vérifier vos <strong>plaquettes de frein</strong> si vous entendez un grincement</li>
          </ul>
        </div>

        <div className="guide-card accent-promo">
          <h2>💶 Combien ça coûte, et que risque-t-on sans contrôle valide ?</h2>
          <p>
            Le prix est <strong>libre</strong> et fixé par chaque centre. C'est justement tout l'intérêt de
            comparer les centres disponibles près de chez vous. Rouler avec un contrôle technique expiré expose
            à une amende pouvant aller jusqu'à 750 €, généralement une amende forfaitaire de 135 €. Les forces
            de l'ordre peuvent aussi immobiliser le véhicule, voire le mettre en fourrière en cas de défaillance
            non réparée.
          </p>
        </div>

        <div className="message-banner success" style={{ marginTop: 20 }}>
          <Link href="/">Trouvez dès maintenant un créneau disponible près de chez vous</Link>, y compris de
          dernière minute.
        </div>

        <p className="help-text" style={{ marginTop: 24 }}>
          Informations vérifiées à partir des données officielles de{' '}
          <a href="https://www.service-public.gouv.fr/particuliers/vosdroits/F2878" target="_blank" rel="noopener noreferrer">
            service-public.gouv.fr
          </a>{' '}
          (janvier 2026). En cas de doute, référez-vous toujours à la réglementation en vigueur au moment de
          votre contrôle.
        </p>
      </section>

      <Footer />
    </>
  );
}
