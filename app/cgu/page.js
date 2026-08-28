import Footer from '../components/Footer';
import Header from '../components/Header';
import { get } from '@/lib/db';

export const metadata = {
  title: 'Conditions Générales d\'Utilisation (CGU)',
  description: "Conditions générales d'utilisation du site Créneau CT, pour les clients comme pour les centres partenaires.",
  alternates: { canonical: '/cgu' },
  openGraph: {
    title: 'Conditions Générales d\'Utilisation (CGU) — Créneau CT',
    description: "Conditions générales d'utilisation du site Créneau CT, pour les clients comme pour les centres partenaires.",
  },
};

// Analyse ligne par ligne plutôt que bloc par bloc (séparé sur \n\n) :
// l'ancienne version supposait qu'un titre "## " occupait tout son bloc à
// lui seul, alors que le contenu saisi enchaîne souvent le titre et son
// premier paragraphe (voire des puces) sans ligne vide entre les deux —
// ce qui faisait apparaître le paragraphe suivant en gras à l'intérieur
// du <h2>, ou aplatissait une liste à puces en une phrase avec des "-"
// au milieu. Ici, un changement de type de ligne (titre / puce / texte)
// clôt toujours l'élément en cours, avec ou sans ligne vide.
function formaterContenu(contenu) {
  const elements = [];
  let paragrapheCourant = [];
  let listeCourante = [];

  const clorreParagraphe = (cle) => {
    if (paragrapheCourant.length) {
      elements.push(<p key={cle}>{paragrapheCourant.join(' ')}</p>);
      paragrapheCourant = [];
    }
  };
  const clorreListe = (cle) => {
    if (listeCourante.length) {
      elements.push(
        <ul key={cle}>
          {listeCourante.map((item, j) => <li key={`${cle}-${j}`}>{item}</li>)}
        </ul>
      );
      listeCourante = [];
    }
  };

  contenu.split('\n').forEach((ligneBrute, i) => {
    const ligne = ligneBrute.trim();
    if (!ligne) {
      clorreParagraphe(`p-${i}`);
      clorreListe(`ul-${i}`);
      return;
    }
    if (ligne.startsWith('## ')) {
      clorreParagraphe(`p-${i}`);
      clorreListe(`ul-${i}`);
      elements.push(<h2 key={`h-${i}`}>{ligne.slice(3).trim()}</h2>);
      return;
    }
    if (ligne.startsWith('- ')) {
      clorreParagraphe(`p-${i}`);
      listeCourante.push(ligne.slice(2).trim());
      return;
    }
    clorreListe(`ul-${i}`);
    paragrapheCourant.push(ligne);
  });
  clorreParagraphe('p-fin');
  clorreListe('ul-fin');

  return elements;
}

export default async function CGUPage() {
  let contenu = null;
  let derniereMaj = null;
  try {
    const doc = await get("SELECT * FROM documents_legaux WHERE cle = 'cgu'");
    if (doc) {
      contenu = doc.contenu;
      derniereMaj = new Date(doc.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  } catch {
    // Si la base est momentanément indisponible, la page reste affichable sans contenu dynamique.
  }

  return (
    <>
      <Header />

      <section className="container legal-content" style={{ padding: '40px 24px 64px' }}>
        <h1>Conditions Générales d'Utilisation (CGU)</h1>
        {derniereMaj && <p className="help-text">Dernière mise à jour : {derniereMaj}</p>}

        <div className="message-banner error" style={{ marginTop: 20 }}>
          Document en cours de finalisation, à faire valider par un professionnel du droit avant toute mise en
          exploitation commerciale réelle. Certaines informations (identité de l'éditeur) restent à compléter.
        </div>

        {contenu ? formaterContenu(contenu) : (
          <p className="help-text">Contenu momentanément indisponible, réessayez dans quelques instants.</p>
        )}
      </section>

      <Footer />
    </>
  );
}
