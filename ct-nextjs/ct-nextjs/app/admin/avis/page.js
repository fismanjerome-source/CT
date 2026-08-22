'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '../../components/AdminSidebar';
import AlertePaiements from '../../components/AlertePaiements';

export default function AvisAdminPage() {
  const router = useRouter();
  const [avis, setAvis] = useState(null);
  const [erreur, setErreur] = useState(null);

  async function charger() {
    try {
      const res = await fetch('/api/admin/avis');
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); return; }
      setAvis(data.avis);
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    }
  }

  useEffect(() => { charger(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function basculerVisibilite(id) {
    try {
      await fetch(`/api/admin/avis/${id}`, { method: 'PATCH' });
      charger();
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    }
  }

  return (
    <div className="pro-shell">
      <AdminSidebar />
      <main className="pro-main">
        <h1>Avis clients</h1>
        <AlertePaiements />
        <p className="help-text">
          Tous les avis laissés par les clients, tous centres confondus. Un avis masqué disparaît immédiatement de
          la fiche publique du centre, sans être supprimé (réversible à tout moment).
        </p>

        {erreur && <div className="message-banner error" style={{ marginTop: 16 }}>{erreur}</div>}

        {!avis ? (
          <p className="help-text">Chargement…</p>
        ) : avis.length === 0 ? (
          <div className="empty-state">Aucun avis pour le moment.</div>
        ) : (
          avis.map((a) => (
            <div key={a.id} className="card" style={{ opacity: a.visible ? 1 : 0.55 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong>{a.centre_nom}</strong>
                  <span style={{ color: 'var(--color-accent)', marginLeft: 10 }}>{'★'.repeat(a.note)}{'☆'.repeat(5 - a.note)}</span>
                  <p className="help-text" style={{ margin: '4px 0 0' }}>
                    {new Date(a.created_at).toLocaleDateString('fr-FR')} {a.client_prenom ? `— ${a.client_prenom}` : ''}
                    {!a.visible && ' — masqué'}
                  </p>
                </div>
                <button type="button" className="btn-secondary" onClick={() => basculerVisibilite(a.id)}>
                  {a.visible ? 'Masquer' : 'Remettre visible'}
                </button>
              </div>
              {a.commentaire && <p style={{ marginTop: 10, marginBottom: 0 }}>{a.commentaire}</p>}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
