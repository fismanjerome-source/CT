'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { useRouter } from 'next/navigation';
import AlertePaiements from '../../components/AlertePaiements';
import { IconeVehicule } from '../../components/VehiculeIcons';
import { TYPES_VEHICULES, parseTypes } from '@/lib/vehicules';

function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default function AdminReserverPage() {
  const router = useRouter();

  const [centres, setCentres] = useState(null);
  const [rechercheCentre, setRechercheCentre] = useState('');
  const [centreId, setCentreId] = useState('');
  const [typeVehicule, setTypeVehicule] = useState('');
  const [typeVisite, setTypeVisite] = useState('normale');
  const [dateSelectionnee, setDateSelectionnee] = useState(todayISO());
  const [creneaux, setCreneaux] = useState(null);
  const [chargementCreneaux, setChargementCreneaux] = useState(false);
  const [erreur, setErreur] = useState(null);

  const [modalCreneau, setModalCreneau] = useState(null);
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', immatriculation: '' });
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function charger() {
      try {
        const res = await fetch('/api/admin/centres');
        if (res.status === 401) { router.push('/admin/login'); return; }
        const data = await res.json();
        if (!res.ok) { setErreur(data.erreur); return; }
        setCentres(data.centres);
      } catch {
        setErreur('Erreur réseau. Réessayez.');
      }
    }
    charger();
  }, [router]);

  const centre = centres?.find((c) => String(c.id) === String(centreId));
  const centresFiltres = centres?.filter((c) => {
    const q = rechercheCentre.trim().toLowerCase();
    if (!q) return true;
    return c.nom.toLowerCase().includes(q) || c.ville.toLowerCase().includes(q);
  });
  const typesAcceptes = centre ? parseTypes(centre.types_vehicules_acceptes) : [];

  useEffect(() => {
    if (centre) {
      setTypeVehicule(parseTypes(centre.types_vehicules_acceptes)[0] || '');
      setDateSelectionnee(todayISO());
      setCreneaux(null);
    }
  }, [centreId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!centreId || !typeVehicule) return;
    let annule = false;
    async function chargerCreneaux() {
      setChargementCreneaux(true);
      try {
        const params = new URLSearchParams({ date: dateSelectionnee, type_vehicule: typeVehicule, type_visite: typeVisite });
        const res = await fetch(`/api/centres/${centreId}/creneaux?${params.toString()}`);
        const data = await res.json();
        if (!annule) setCreneaux(data.creneaux);
      } catch {
        if (!annule) setCreneaux([]);
      } finally {
        if (!annule) setChargementCreneaux(false);
      }
    }
    chargerCreneaux();
    return () => { annule = true; };
  }, [centreId, typeVehicule, dateSelectionnee, typeVisite]);

  function ouvrirReservation(creneau) {
    setModalCreneau(creneau);
    setForm({ prenom: '', nom: '', email: '', telephone: '', immatriculation: '' });
    setMessage(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnvoi(true);
    setMessage(null);
    try {
      const res = await fetch('/api/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creneau_id: modalCreneau.id,
          client_prenom: form.prenom.trim(),
          client_nom: form.nom.trim(),
          client_email: form.email.trim(),
          client_telephone: form.telephone.trim(),
          immatriculation: form.immatriculation.trim(),
          type_vehicule: typeVehicule,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage({ type: 'error', text: data.erreur }); setEnvoi(false); return; }
      setModalCreneau(null);
      setMessage({ type: 'success', text: `Rendez-vous enregistré pour ${form.prenom} ${form.nom} — référence ${data.rdv.reference}. Email de confirmation envoyé.` });
      const params = new URLSearchParams({ date: dateSelectionnee, type_vehicule: typeVehicule, type_visite: typeVisite });
      const res2 = await fetch(`/api/centres/${centreId}/creneaux?${params.toString()}`);
      const data2 = await res2.json();
      setCreneaux(data2.creneaux);
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau. Réessayez.' });
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="pro-shell">
      <AdminSidebar />

      <main className="pro-main">
        <h1>Réserver un RDV pour un client</h1>
        <AlertePaiements />
        <p className="help-text">
          Utile si un client vous appelle directement plutôt que de passer par le site — sélectionnez un centre,
          un créneau, et le RDV est créé exactement comme une réservation en ligne (email de confirmation inclus).
        </p>

        {erreur && <div className="message-banner error" style={{ marginTop: 16 }}>{erreur}</div>}
        {message && <div className={`message-banner ${message.type}`} style={{ marginTop: 16 }}>{message.text}</div>}

        <div className="form-row" style={{ maxWidth: 420, marginTop: 20 }}>
          <label htmlFor="recherche_centre">Rechercher un centre (nom ou ville)</label>
          <input
            id="recherche_centre"
            type="text"
            placeholder="Tapez pour filtrer…"
            value={rechercheCentre}
            onChange={(e) => setRechercheCentre(e.target.value)}
          />
        </div>

        <div className="form-row" style={{ maxWidth: 420, marginTop: 12 }}>
          <label htmlFor="centre">Centre {centresFiltres && `(${centresFiltres.length} résultat${centresFiltres.length > 1 ? 's' : ''})`}</label>
          <select id="centre" value={centreId} onChange={(e) => setCentreId(e.target.value)}>
            <option value="">Sélectionner un centre…</option>
            {centresFiltres?.map((c) => (
              <option key={c.id} value={c.id}>{c.nom} — {c.ville}</option>
            ))}
          </select>
        </div>

        {centre && (
          <>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                className={typeVisite === 'normale' ? '' : 'btn-secondary'}
                onClick={() => setTypeVisite('normale')}
              >
                Contrôle technique
              </button>
              <button
                type="button"
                className={typeVisite === 'contre_visite' ? '' : 'btn-secondary'}
                onClick={() => setTypeVisite('contre_visite')}
              >
                Contre-visite
              </button>
            </div>
            <p className="help-text" style={{ marginTop: 6 }}>
              Une contre-visite n'apparaît ici que si le centre a lui-même ouvert ce type de créneau.
            </p>

            {typesAcceptes.length > 0 && (
              <div className="type-vehicule-picker" style={{ marginTop: 16 }}>
                {TYPES_VEHICULES.filter((t) => typesAcceptes.includes(t.value)).map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`type-vehicule-chip ${typeVehicule === t.value ? 'selected' : ''}`}
                    style={typeVehicule === t.value ? { borderColor: t.couleur, background: t.couleur, color: '#fff' } : { borderColor: t.couleur, color: t.couleur }}
                    onClick={() => setTypeVehicule(t.value)}
                  >
                    <IconeVehicule icone={t.icone} size={16} color={typeVehicule === t.value ? '#fff' : t.couleur} />
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            <div className="day-picker" style={{ marginTop: 16 }}>
              {Array.from({ length: 14 }, (_, i) => todayISO(i)).map((d) => {
                const date = new Date(d + 'T00:00:00');
                return (
                  <div
                    key={d}
                    className={`day-chip ${d === dateSelectionnee ? 'selected' : ''}`}
                    onClick={() => setDateSelectionnee(d)}
                  >
                    <span className="dow">{date.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                    <span className="num">{date.getDate()}</span>
                  </div>
                );
              })}
            </div>

            <div className="slots-grid" style={{ marginTop: 16 }}>
              {chargementCreneaux ? (
                <p className="help-text">Chargement…</p>
              ) : !creneaux || creneaux.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>Aucun créneau disponible ce jour-là.</div>
              ) : (
                creneaux.map((c) => (
                  <button key={c.id} className="slot-btn" onClick={() => ouvrirReservation(c)}>
                    <span className="slot-heure">{c.heure}</span>
                    {c.prix != null && <span className="slot-prix">{c.prix.toFixed(2)}€ TTC</span>}
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </main>

      {modalCreneau && centre && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setModalCreneau(null)}>
          <div className="modal">
            <h2>Réserver ce créneau</h2>
            <div className="modal-recap">
              <strong>{centre.nom}</strong><br />
              {new Date(dateSelectionnee + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {modalCreneau.heure}
              {modalCreneau.prix != null && <div style={{ marginTop: 6, fontWeight: 700 }}>{modalCreneau.prix.toFixed(2)}€ TTC</div>}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-row">
                  <label htmlFor="prenom">Prénom du client</label>
                  <input id="prenom" type="text" required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
                </div>
                <div className="form-row">
                  <label htmlFor="nom">Nom du client</label>
                  <input id="nom" type="text" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="email">Email du client</label>
                <input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-row">
                <label htmlFor="telephone">Téléphone du client</label>
                <input id="telephone" type="tel" required value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
              </div>
              <div className="form-row">
                <label htmlFor="immatriculation">Immatriculation</label>
                <input id="immatriculation" type="text" required placeholder="AA-123-BB" style={{ textTransform: 'uppercase' }}
                  value={form.immatriculation} onChange={(e) => setForm({ ...form, immatriculation: e.target.value })} />
              </div>
              <p className="help-text">Le client recevra automatiquement l'email de confirmation avec le fichier calendrier.</p>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setModalCreneau(null)}>Annuler</button>
                <button type="submit" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Confirmer le rendez-vous'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
