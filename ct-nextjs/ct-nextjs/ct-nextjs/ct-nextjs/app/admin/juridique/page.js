'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '../../components/AdminSidebar';
import AlertePaiements from '../../components/AlertePaiements';

const FORM_VIDE = { titre: '', resume: '', contenu: '', lien_externe: '', lien_libelle: '', ordre: 0 };

export default function JuridiqueAdminPage() {
  const router = useRouter();
  const [fiches, setFiches] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);
  const [edition, setEdition] = useState(null); // null | 'nouvelle' | id
  const [form, setForm] = useState(FORM_VIDE);
  const [envoi, setEnvoi] = useState(false);

  async function charger() {
    try {
      const res = await fetch('/api/admin/fiches-juridiques');
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); return; }
      setFiches(data.fiches);
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    }
  }

  useEffect(() => { charger(); }, []);

  function ouvrirNouvelle() {
    setForm(FORM_VIDE);
    setEdition('nouvelle');
  }

  function ouvrirEdition(fiche) {
    setForm({
      titre: fiche.titre, resume: fiche.resume || '', contenu: fiche.contenu,
      lien_externe: fiche.lien_externe || '', lien_libelle: fiche.lien_libelle || '', ordre: fiche.ordre,
    });
    setEdition(fiche.id);
  }

  async function enregistrer(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const url = edition === 'nouvelle' ? '/api/admin/fiches-juridiques' : `/api/admin/fiches-juridiques/${edition}`;
      const methode = edition === 'nouvelle' ? 'POST' : 'PATCH';
      const res = await fetch(url, { method: methode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setErreur(data.erreur); setEnvoi(false); return; }
      setMessage({ type: 'success', text: 'Fiche enregistrée.' });
      setEdition(null);
      charger();
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    } finally {
      setEnvoi(false);
    }
  }

  async function supprimer(id) {
    if (!confirm('Supprimer définitivement cette fiche ?')) return;
    try {
      await fetch(`/api/admin/fiches-juridiques/${id}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: 'Fiche supprimée.' });
      charger();
    } catch {
      setErreur('Erreur réseau. Réessayez.');
    }
  }

  return (
    <div className="pro-shell">
      <AdminSidebar />

      <main className="pro-main">
        <h1>Juridique</h1>
        <AlertePaiements />
        <p className="help-text">
          Fiches d'information juridique visibles par les centres partenaires dans leur espace pro. Vous seul(e)
          pouvez les créer ou les modifier ici.
        </p>

        {erreur && <div className="message-banner error" style={{ marginTop: 16 }}>{erreur}</div>}
        {message && <div className="message-banner success" style={{ marginTop: 16 }}>{message.text}</div>}

        {edition === null && (
          <button type="button" style={{ marginTop: 16, marginBottom: 20 }} onClick={ouvrirNouvelle}>
            + Nouvelle fiche
          </button>
        )}

        {edition !== null && (
          <section className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h2 style={{ margin: 0 }}>{edition === 'nouvelle' ? 'Nouvelle fiche' : 'Modifier la fiche'}</h2></div>
            <form onSubmit={enregistrer}>
              <div className="form-row">
                <label htmlFor="titre">Titre</label>
                <input id="titre" type="text" required value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
              </div>
              <div className="form-row">
                <label htmlFor="resume">Résumé (optionnel, une phrase affichée en aperçu)</label>
                <input id="resume" type="text" value={form.resume} onChange={(e) => setForm({ ...form, resume: e.target.value })} />
              </div>
              <div className="form-row">
                <label htmlFor="contenu">Contenu</label>
                <textarea id="contenu" required rows={10} value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })} />
              </div>
              <div className="grid-2">
                <div className="form-row">
                  <label htmlFor="lien_externe">Lien externe (optionnel, ex : Légifrance)</label>
                  <input id="lien_externe" type="url" placeholder="https://..." value={form.lien_externe} onChange={(e) => setForm({ ...form, lien_externe: e.target.value })} />
                </div>
                <div className="form-row">
                  <label htmlFor="lien_libelle">Libellé du lien</label>
                  <input id="lien_libelle" type="text" placeholder="ex : Consulter sur Légifrance" value={form.lien_libelle} onChange={(e) => setForm({ ...form, lien_libelle: e.target.value })} />
                </div>
              </div>
              <div className="form-row" style={{ maxWidth: 160 }}>
                <label htmlFor="ordre">Ordre d'affichage</label>
                <input id="ordre" type="number" value={form.ordre} onChange={(e) => setForm({ ...form, ordre: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</button>
                <button type="button" className="btn-secondary" onClick={() => setEdition(null)}>Annuler</button>
              </div>
            </form>
          </section>
        )}

        {!fiches ? (
          <p className="help-text">Chargement…</p>
        ) : fiches.length === 0 ? (
          <div className="empty-state">Aucune fiche pour le moment.</div>
        ) : (
          fiches.map((f) => (
            <section key={f.id} className="card">
              <div className="card-header" style={{ justifyContent: 'space-between', display: 'flex' }}>
                <h2 style={{ margin: 0 }}>{f.titre}</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn-secondary" onClick={() => ouvrirEdition(f)}>Modifier</button>
                  <button type="button" className="btn-danger" onClick={() => supprimer(f.id)}>Supprimer</button>
                </div>
              </div>
              {f.resume && <p className="help-text">{f.resume}</p>}
              <p style={{ whiteSpace: 'pre-line' }}>{f.contenu}</p>
              {f.lien_externe && (
                <a href={f.lien_externe} target="_blank" rel="noopener noreferrer">
                  {f.lien_libelle || 'En savoir plus'} ↗
                </a>
              )}
            </section>
          ))
        )}
      </main>
    </div>
  );
}
