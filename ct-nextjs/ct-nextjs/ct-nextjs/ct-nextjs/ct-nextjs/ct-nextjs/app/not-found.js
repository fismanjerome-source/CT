import Link from 'next/link';
import Header from './components/Header';
import Footer from './components/Footer';
import Logo from './components/Logo';

export default function NotFound() {
  return (
    <>
      <Header />
      <section className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Logo size={64} />
        </div>
        <h1 style={{ marginBottom: 12 }}>Page introuvable</h1>
        <p className="lead" style={{ maxWidth: 480, margin: '0 auto 32px' }}>
          Ce créneau n'existe pas — la page que vous cherchez a peut-être été déplacée ou n'existe plus.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn">← Retour à l'accueil</Link>
          <Link href="/suivi" className="btn-secondary">Suivre un RDV</Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
