import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Le contrôle technique, c\'est quoi ? — Guide complet | Créneau CT',
  description: 'Obligations, périodicité, points de contrôle, contre-visite : tout comprendre sur le contrôle technique automobile et moto en France.',
};

export default function GuidePage() {
  return (
    <>
      <Header />

      <section className="hero">
        <div className="container">
          <div className="eyebrow">Guide pratique</div>
          <h1>Le contrôle technique, c'est quoi ?</h1>
          <p className="lead">
            Une obligation légale méconnue dans le détail : à quelle fréquence, quels points sont vérifiés,
            que risque-t-on en cas de contre-visite ? Créneau CT vous explique tout simplement, pour voiture
            comme pour deux-roues.
          </p>
        </div>
      </section>

      <section className="container" style={{ padding: '32px 24px 64px', maxWidth: 760 }}>
        <div className="card">
          <div className="card-header">
            <h2 style={{ margin: 0 }}>🚗 Contrôle technique automobile</h2>
          </div>
          <p>
            Périodicité, 136 points de contrôle, contre-visite, sanctions : le guide complet pour les voitures
            et camping-cars jusqu'à 3,5 tonnes.
          </p>
          <Link href="/guide/auto" className="btn">Lire le guide auto</Link>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 style={{ margin: 0 }}>🏍️ Contrôle technique moto</h2>
          </div>
          <p>
            Motos, scooters, quads, tricycles : une obligation récente avec ses propres règles de périodicité
            et ses 80 points de contrôle.
          </p>
          <Link href="/guide/moto" className="btn">Lire le guide moto</Link>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 style={{ margin: 0 }}>✅ Checklist avant d'y aller</h2>
          </div>
          <p>
            Vérifiez chez vous, en 10 minutes, les points responsables de la
            majorité des échecs — plus des rappels constructeur et un
            annuaire des centres agréés. Gratuit, sans compte à créer.
          </p>
          <a
            href="https://avant.creneauct.fr/checklist"
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            Faire la checklist gratuite
          </a>
        </div>

        <div className="empty-state" style={{ marginTop: 20 }}>
          Prêt à réserver ? <Link href="/">Trouvez un créneau disponible près de chez vous</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
