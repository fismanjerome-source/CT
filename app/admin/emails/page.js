'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/Logo';
import AlertePaiements from '../../components/AlertePaiements';

function ApercuEmail({ email }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 style={{ margin: 0 }}>{email.titre}</h2>
          <p className="help-text" style={{ margin: '4px 0 0' }}>{email.declencheur}</p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => setOuvert(!ouvert)}>
          {ouvert ? 'Masquer' : 'Voir l\'aperçu'}
        </button>
      </div>
      <p className="help-text mono">Objet : {email.subject}</p>
      {ouvert && (
        <iframe
          title={email.titre}
          srcDoc={email.html}
          style={{ width: '100%', height: 500, border: '1px solid var(--color-border)', borderRadius: 4, marginTop: 10 }}
        />
      )}
    </div>
  );
}

export default function AdminEmailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    async function charger() {
      try {
        const res = await fetch('/api/admin/emails');
        if (res.status === 401) { router.push('/admin/login'); return; }
        const json = await res.json();
        if (!res.ok) { setErreur(json.erreur); return; }
        setData(json);
      } catch {
        setErreur('Erreur réseau. Réessayez.');
      }
    }
    charger();
  }, [router]);

  return (
    <div className="pro-shell">
      <aside className="pro-sidebar">
        <div className="brand"><Logo /> Espace admin</div>
        <nav>
          <Link href="/admin/dashboard" className={pathname === '/admin/dashboard' ? 'active' : ''}>Commissions</Link>
          <Link href="/admin/paiements" className={pathname.startsWith('/admin/paiements') ? 'active' : ''}>Paiements</Link>
          <Link href="/admin/promotions" className={pathname.startsWith('/admin/promotions') ? 'active' : ''}>Promotions</Link>
          <Link href="/admin/reserver" className={pathname.startsWith('/admin/reserver') ? 'active' : ''}>Réserver un RDV</Link>
          <Link href="/admin/factures" className={pathname.startsWith('/admin/factures') ? 'active' : ''}>Factures</Link>
          <Link href="/admin/centres" className={pathname.startsWith('/admin/centres') ? 'active' : ''}>Centres & utilisateurs</Link>
          <Link href="/admin/emails" className={pathname.startsWith('/admin/emails') ? 'active' : ''}>Modèles de mails</Link>
          <Link href="/admin/contacts" className={pathname.startsWith('/admin/contacts') ? 'active' : ''}>Contacts</Link>
        </nav>
      </aside>

      <main className="pro-main">
        <h1>Modèles de mails</h1>
        <AlertePaiements />
        <p className="help-text">
          Aperçu des emails automatiques envoyés par la plateforme, avec des données d'exemple. Pour changer le
          contenu d'un modèle, ça se passe directement dans le code — demandez-moi la modification souhaitée.
        </p>

        {erreur && <div className="message-banner error">{erreur}</div>}

        {!data ? (
          <p className="help-text">Chargement…</p>
        ) : (
          <>
            <h2 style={{ marginTop: 28 }}>Emails professionnels (centres)</h2>
            {data.emails_professionnels.map((e) => <ApercuEmail key={e.cle} email={e} />)}

            <h2 style={{ marginTop: 28 }}>Emails clients</h2>
            {data.emails_clients.map((e) => <ApercuEmail key={e.cle} email={e} />)}
          </>
        )}
      </main>
    </div>
  );
}
