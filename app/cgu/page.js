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

function formaterContenu(contenu) {
  const blocs = contenu.split(/\n\n+/);
  return blocs.map((bloc, i) => {
    const texte = bloc.trim();
    if (texte.startsWith('## ')) {
      return <h2 key={i}>{texte.slice(3).trim()}</h2>;
    }
    if (texte.startsWith('- ')) {
      const items = texte.split('\n').map((l) => l.replace(/^- /, '').trim());
      return (
        <ul key={i}>
          {items.map((item, j) => <li key={j}>{item}</li>)}
        </ul>
      );
    }
    return <p key={i}>{texte}</p>;
  });
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
