'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/Logo';
import AlertePaiements from '../../components/AlertePaiements';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminContactsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [contacts, setContacts] = useState(null);
  const [erreur, setErreur] = useState(null);

  async function charger() {
    try {
      const res = await fetch('/api/admin/contacts');
      if (res.status === 401) { router.push('/admin/login'); return; }
      const json = await res.json();
      if (!res.ok) { setErreur(json.erreur); return; }
      setContacts(json.contacts);
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    }
  }

  useEffect(() => { charger(); }, []);

  async function marquerTraite(id, statutActuel) {
    const nouveauStatut = statutActuel === 'traite' ? 'nouveau' : 'traite';
    await fetch(`/api/admin/contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: nouveauStatut }),
    });
    charger();
  }

  return (
    <div className="pro-shell">
      <aside className="pro-sidebar">
        <div className="brand"><Logo /> Espace admin</div>
        <nav>
          <Link href="/admin/dashboard" className={pathname === '/admin/dashboard' ? 'active' : ''}>Commissions</Link>
          <Link href="/admin/paiements" className={pathname.startsWith('/admin/paiements') ? 'active' : ''}>Paiements</Link>
          <Link href="/admin/promotions" className={pathname.startsWith('/admin/promotions') ? 'active' : ''}>Promotions</Link>
          <Link href="/admin/factures" className={pathname.startsWith('/admin/factures') ? 'active' : ''}>Factures</Link>
          <Link href="/admin/centres" className={pathname.startsWith('/admin/centres') ? 'active' : ''}>Centres & utilisateurs</Link>
          <Link href="/admin/emails" className={pathname.startsWith('/admin/emails') ? 'active' : ''}>Modèles de mails</Link>
          <Link href="/admin/contacts" className={pathname.startsWith('/admin/contacts') ? 'active' : ''}>Contacts</Link>
        </nav>
      </aside>

      <main className="pro-main">
        <h1>Demandes de contact</h1>
        <AlertePaiements />
        <p className="help-text">Centres intéressés ayant rempli le formulaire de la page Contact.</p>

        {erreur && <div className="message-banner error" style={{ marginTop: 16 }}>{erreur}</div>}

        {!contacts ? (
          <p className="help-text" style={{ marginTop: 20 }}>Chargement…</p>
        ) : contacts.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 20 }}>Aucune demande pour le moment.</div>
        ) : (
          <div style={{ marginTop: 20 }}>
            {contacts.map((c) => (
              <div key={c.id} className="card">
                <div className="card-header">
                  <div>
                    <h2 style={{ margin: 0 }}>
                      {c.nom}
                      {c.type === 'reinitialisation_mdp' && (
                        <span className="promo-badge-inline" style={{ marginLeft: 8, verticalAlign: 'middle' }}>🔑 Mot de passe oublié</span>
                      )}
                      {c.type === 'message_pro' && (
                        <span className="promo-badge-inline" style={{ marginLeft: 8, verticalAlign: 'middle', background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>💬 Message d'un centre</span>
                      )}
                    </h2>
                    <p className="help-text" style={{ margin: 0 }}>
                      {c.nom_centre && <>{c.nom_centre} · </>}
                      {c.email}{c.telephone && ` · ${c.telephone}`}
                    </p>
                  </div>
                  <span className={`badge ${c.statut === 'traite' ? 'disponible' : 'reserve'}`}>
                    {c.statut === 'traite' ? 'Traité' : 'Nouveau'}
                  </span>
                </div>
                <p>{c.message}</p>
                {c.type === 'reinitialisation_mdp' && (
                  <p className="help-text">Réinitialisez ce compte depuis l'onglet <Link href="/admin/centres">Centres & utilisateurs</Link>.</p>
                )}
                <p className="help-text mono">{formatDate(c.created_at)}</p>
                <button className="btn-secondary" onClick={() => marquerTraite(c.id, c.statut)}>
                  {c.statut === 'traite' ? 'Marquer comme nouveau' : 'Marquer comme traité'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
