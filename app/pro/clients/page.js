'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/Logo';
import { IconeVehicule } from '../../components/VehiculeIcons';
import { TYPES_VEHICULES } from '@/lib/vehicules';

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function SidebarNav({ pathname, centreId }) {
  return (
    <nav>
      <Link href={centreId ? `/pro/dashboard?centre=${centreId}` : '/pro/dashboard'} className={pathname === '/pro/dashboard' ? 'active' : ''}>📊 Tableau de bord</Link>
      <Link href="/pro/clients" className={pathname.startsWith('/pro/clients') ? 'active' : ''}>🚗 Mes RDV clients</Link>
      <Link href="/pro/centres" className={pathname.startsWith('/pro/centres') ? 'active' : ''}>🏢 Mes centres</Link>
      <Link href={centreId ? `/pro/factures?centre=${centreId}` : '/pro/factures'} className={pathname.startsWith('/pro/factures') ? 'active' : ''}>🧾 Mes factures</Link>
      <Link href="/pro/parametres" className={pathname.startsWith('/pro/parametres') ? 'active' : ''}>⚙️ Paramètres</Link>
      <Link href="/pro/contact" className={pathname.startsWith('/pro/contact') ? 'active' : ''}>💬 Contact Créneau CT</Link>
    </nav>
  );
}

function ClientsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const centreIdParam = searchParams.get('centre');

  const [centre, setCentre] = useState(null);
  const [rdvs, setRdvs] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    async function charger() {
      try {
        const urlMe = centreIdParam ? `/api/pro/me?centre=${centreIdParam}` : '/api/pro/me';
        const meRes = await fetch(urlMe);
        if (meRes.status === 401) { router.push('/pro/login'); return; }
        const meJson = await meRes.json();
        if (!meRes.ok) { setErreur(meJson.erreur); return; }
        setCentre(meJson.centre);

        const rdvRes = await fetch(`/api/pro/rdv?centre=${meJson.centre.id}`);
        const rdvJson = await rdvRes.json();
        if (!rdvRes.ok) { setErreur(rdvJson.erreur); return; }
        setRdvs(rdvJson.rdvs);
      } catch {
        setErreur('Erreur réseau. Réessayez.');
      }
    }
    charger();
  }, [router, centreIdParam]);

  const rdvsFiltres = rdvs?.filter((r) => {
    if (!recherche.trim()) return true;
    const q = recherche.trim().toLowerCase();
    return (
      `${r.client_prenom || ''} ${r.client_nom}`.toLowerCase().includes(q) ||
      r.client_email.toLowerCase().includes(q) ||
      r.immatriculation.toLowerCase().includes(q) ||
      r.client_telephone.includes(q) ||
      r.reference.toLowerCase().includes(q)
    );
  });

  return (
    <div className="pro-shell">
      <aside className="pro-sidebar">
        <div className="brand"><Logo /> Espace pro</div>
        <SidebarNav pathname={pathname} centreId={centre?.id} />
      </aside>

      <main className="pro-main">
        <h1>Mes RDV clients</h1>
        <p className="help-text">
          Coordonnées complètes de vos clients pour les RDV confirmés{centre ? ` — ${centre.nom}` : ''}.
        </p>

        {erreur && <div className="message-banner error" style={{ marginTop: 16 }}>{erreur}</div>}

        {rdvs && rdvs.length > 0 && (
          <div className="form-row" style={{ maxWidth: 360, marginTop: 16 }}>
            <label htmlFor="recherche">Rechercher (nom, email, immatriculation...)</label>
            <input id="recherche" type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          </div>
        )}

        {!rdvs ? (
          <p className="help-text" style={{ marginTop: 20 }}>Chargement…</p>
        ) : rdvs.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 20 }}>Aucun RDV client confirmé pour le moment.</div>
        ) : (
          <div className="table-scroll" style={{ marginTop: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Prénom</th>
                  <th>Nom</th>
                  <th>Véhicule</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Immatriculation</th>
                  <th>Référence</th>
                </tr>
              </thead>
              <tbody>
                {rdvsFiltres.map((r) => {
                  const typeInfo = TYPES_VEHICULES.find((t) => t.value === r.type_vehicule);
                  return (
                    <tr key={r.id}>
                      <td className="mono">{formatDate(r.date)}</td>
                      <td className="mono">{r.heure}</td>
                      <td>{r.client_prenom || '—'}</td>
                      <td>{r.client_nom}</td>
                      <td>
                        {typeInfo ? (
                          <span className="vehicule-badge" style={{ background: typeInfo.couleur }}>
                            <IconeVehicule icone={typeInfo.icone} size={12} color="#fff" />
                            {typeInfo.label}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="mono">{r.client_email}</td>
                      <td className="mono">{r.client_telephone}</td>
                      <td className="mono">{r.immatriculation}</td>
                      <td className="mono">{r.reference}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: 40 }}><p className="help-text">Chargement…</p></div>}>
      <ClientsPageInner />
    </Suspense>
  );
}
