'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '../../components/AdminSidebar';
import AlertePaiements from '../../components/AlertePaiements';

export default function CguAdminPage() {
  const router = useRouter();
  const [contenu, setContenu] = useState('');
  const [derniereMaj, setDerniereMaj] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    async function charger() {
      try {
        const res = await fetch('/api/admin/documents-legaux/cgu');
        if (res.status === 401) { router.push('/admin/login'); return; }
        const data = await res.json();
        if (!res.ok) { setErreur(data.erreur); return; }
        setContenu(data.document.contenu);
        setDerniereMaj(data.document.updated_at);
      } catch {
        setErreur('Erreur réseau. Réessayez.');
      }
    }
    charger();
  }, [router]);

  async function enregistrer(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const res = await fetch('/api/admin/documents-legaux/cgu', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu }),
      });
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); setEnvoi(false); return; }
      setMessage({ type: 'success', text: 'CGU mises à jour. La date de dernière mise à jour est actualisée automatiquement.' });
      setDerniereMaj(new Date().toISOString());
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="pro-shell">
      <AdminSidebar />

      <main className="pro-main">
        <h1>Modifier les CGU</h1>
        <AlertePaiements />
        <p className="help-text">
          Un titre d'article commence par <span className="mono">## </span> (ex : <span className="mono">## Article 1 — Objet</span>),
          une puce commence par <span className="mono">- </span>. Laissez une ligne vide entre chaque paragraphe ou article.
          La date de dernière mise à jour affichée sur la page publique se met à jour automatiquement à chaque enregistrement.
        </p>
        {derniereMaj && (
          <p className="help-text">
            Dernière mise à jour actuelle : {new Date(derniereMaj).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}

        {erreur && <div className="message-banner error" style={{ marginTop: 16 }}>{erreur}</div>}
        {message && <div className="message-banner success" style={{ marginTop: 16 }}>{message.text}</div>}

        <form onSubmit={enregistrer} style={{ marginTop: 16 }}>
          <textarea
            rows={28}
            style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', boxSizing: 'border-box' }}
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
          />
          <button type="submit" disabled={envoi} style={{ marginTop: 12 }}>
            {envoi ? 'Enregistrement…' : 'Enregistrer les CGU'}
          </button>
        </form>
      </main>
    </div>
  );
}
