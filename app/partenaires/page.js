import Footer from '../components/Footer';
import Header from '../components/Header';

export const metadata = {
  title: 'Partenaires — Créneau CT',
  description: "Découvrez les centres de contrôle technique partenaires de Créneau CT partout en France.",
};

const partenaires = [
  {
    nom: 'CT en Folie',
    url: 'https://ct-en-folie.com',
    description:
      "Agence de recrutement spécialisée dans le contrôle technique automobile, moto et poids lourd. Issue d'une communauté de plus de 8 800 professionnels du secteur, elle met en relation les centres de contrôle technique avec des contrôleurs qualifiés partout en France.",
  },
];

export default function PartenairesPage() {
  return (
    <>
      <Header />

      <section className="hero">
        <div className="container">
          <div className="eyebrow">🤝 Ils nous font confiance</div>
          <h1>Nos partenaires</h1>
          <p className="lead">
            Des acteurs du secteur du contrôle technique qui partagent notre exigence de qualité et de transparence.
          </p>
        </div>
      </section>

      <section className="container" style={{ padding: '32px 24px 64px' }}>
        {partenaires.map((p) => (
          <div key={p.nom} className="card">
            <div className="card-header">
              <h2 style={{ margin: 0 }}>{p.nom}</h2>
            </div>
            <p>{p.description}</p>
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn">
              Visiter {p.nom}
            </a>
          </div>
        ))}

        <div className="empty-state" style={{ marginTop: 20 }}>
          Vous représentez une entreprise du secteur et souhaitez devenir partenaire ? Contactez-nous.
        </div>
      </section>

      <Footer />
    </>
  );
}
