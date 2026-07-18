import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Contrôle technique moto : le guide complet | Créneau CT',
  description: '80 points de contrôle, validité 3 ans, contre-visite : tout savoir sur le contrôle technique moto, scooter et quad en France.',
};

export default function GuideMotoPage() {
  return (
    <>
      <Header />

      <section className="hero">
        <div className="container">
          <div className="eyebrow">Guide pratique — Moto & 2-3 roues</div>
          <h1>Le contrôle technique moto : le guide complet</h1>
          <p className="lead">
            Une obligation encore récente pour les motos, scooters, quads et tricycles à moteur — voici les
            règles précises à connaître avant de prendre rendez-vous.
          </p>
        </div>
      </section>

      <section className="container legal-content" style={{ padding: '32px 24px 64px' }}>
        <h2>Qui doit passer le contrôle technique ?</h2>
        <p>
          Tous les véhicules motorisés à 2 ou 3 roues et les quadricycles à moteur sont concernés (catégorie L
          sur la carte grise) : motos, scooters, tricycles, quads routiers... Cela couvre aussi bien les
          cylindrées légères que les grosses motocyclettes. Comme pour les voitures, quelques véhicules
          spécifiques sont dispensés.
        </p>

        <h2>Quand faire son premier contrôle technique ?</h2>
        <p>
          La date du premier contrôle dépend de l'année de première mise en circulation :
        </p>
        <ul>
          <li>
            <strong>Véhicules immatriculés en 2020 ou 2021</strong> : premier contrôle à réaliser en 2026, au
            plus tard 4 mois après la date anniversaire de mise en circulation, avec une limite fixée au 31
            décembre 2026.
          </li>
          <li>
            <strong>Véhicules immatriculés en 2022 et après</strong> : premier contrôle dans les 6 mois précédant
            le 5ᵉ anniversaire de la première mise en circulation — un an de plus que pour les voitures.
          </li>
        </ul>
        <p className="help-text">
          Les véhicules immatriculés en 2017, 2018 et 2019 devaient déjà passer leur premier contrôle en 2025.
        </p>

        <h2>À quelle fréquence renouveler le contrôle ?</h2>
        <p>
          Si le résultat est favorable, le contrôle technique moto est valable <strong>3 ans</strong> (contre 2
          ans pour une voiture). Un contrôle réalisé le 14 mai 2025 avec un résultat favorable reste valable
          jusqu'au 13 mai 2028.
        </p>

        <h2>Les 80 points de contrôle</h2>
        <p>
          Le contrôleur vérifie <strong>80 points</strong>, répartis en familles proches de celles d'une voiture,
          adaptées aux spécificités d'un deux-roues :
        </p>
        <ul>
          <li><strong>Identification</strong> du véhicule (documents, plaque d'immatriculation)</li>
          <li><strong>Freinage</strong></li>
          <li><strong>Direction</strong></li>
          <li><strong>Visibilité</strong></li>
          <li><strong>Feux, dispositifs réfléchissants et équipements électriques</strong></li>
          <li><strong>Essieux, roues, pneus, suspension</strong></li>
          <li><strong>Châssis et accessoires du châssis</strong></li>
          <li>Autre matériel : <strong>avertisseur sonore</strong></li>
          <li><strong>Nuisances</strong> : pollution et niveau sonore</li>
        </ul>

        <h2>Le résultat du contrôle</h2>
        <p>Comme pour une voiture, trois résultats sont possibles :</p>
        <ul>
          <li><strong>Favorable</strong> — aucune défaillance majeure ni critique. Rendez-vous dans 3 ans.</li>
          <li><strong>Défavorable pour défaillance majeure</strong> — contrôle valable seulement 2 mois.</li>
          <li><strong>Défavorable pour défaillance critique</strong> — validité limitée au jour du contrôle.</li>
        </ul>

        <h2>Le vrai risque : la contre-visite</h2>
        <p>
          Exactement comme pour une voiture, une défaillance majeure ou critique impose une contre-visite dans
          un <strong>délai de 2 mois</strong>, dans n'importe quel centre agréé. Si elle est favorable, elle
          prolonge la validité <strong>jusqu'à 3 ans après la date du contrôle initial défavorable</strong> —
          pas 3 ans après la contre-visite. Là encore, tarder à faire réparer réduit d'autant la durée de
          validité obtenue au final.
        </p>

        <h2>Nos conseils avant de passer le contrôle technique moto</h2>
        <p>Quelques points à vérifier vous-même avant de prendre rendez-vous :</p>
        <ul>
          <li>Vérifiez l'<strong>usure et la pression de vos pneus</strong></li>
          <li>Contrôlez l'état de la <strong>chaîne ou de la courroie de transmission</strong> (tension, lubrification)</li>
          <li>Testez le fonctionnement de tous vos <strong>feux, clignotants et le feu stop</strong></li>
          <li>Vérifiez l'<strong>usure des plaquettes ou mâchoires de frein</strong>, avant et arrière</li>
          <li>Assurez-vous que les <strong>rétroviseurs</strong> sont bien fixés et non fissurés</li>
          <li>Contrôlez que la <strong>plaque d'immatriculation</strong> est propre, fixée et parfaitement lisible</li>
          <li>Vérifiez l'<strong>avertisseur sonore</strong> (klaxon)</li>
          <li>Repérez toute <strong>fuite d'huile ou de liquide de frein</strong> apparente</li>
        </ul>

        <h2>Combien ça coûte, et que risque-t-on sans contrôle valide ?</h2>
        <p>
          Le prix est <strong>libre</strong>, fixé par chaque centre, ce qui justifie de comparer les
          disponibilités et tarifs autour de vous. Rouler avec un contrôle expiré expose à une amende pouvant
          aller jusqu'à 750 €, généralement une amende forfaitaire de 135 €, avec un risque d'immobilisation du
          véhicule par les forces de l'ordre.
        </p>

        <div className="message-banner success" style={{ marginTop: 20 }}>
          <Link href="/">Trouvez dès maintenant un créneau moto disponible près de chez vous</Link> — y compris
          de dernière minute.
        </div>

        <p className="help-text" style={{ marginTop: 24 }}>
          Informations vérifiées à partir des données officielles de{' '}
          <a href="https://www.service-public.gouv.fr/particuliers/vosdroits/F37538" target="_blank" rel="noopener noreferrer">
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
