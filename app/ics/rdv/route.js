import { NextResponse } from 'next/server';
import { get, all, run } from '@/lib/db';
import { genererFluxICS } from '@/lib/ics';
import { hashCleApi } from '@/lib/apiAuth';
import { jsonError, todayISO } from '@/lib/utils';

// GET /ics/rdv?cle=<clé API>
// Flux iCal des rendez-vous à venir du centre, destiné à un abonnement
// d'agenda (Google Calendar, Outlook, logiciel de planning...). Les clients
// d'abonnement d'agenda ne peuvent pas envoyer d'en-tête personnalisé, d'où
// l'authentification par paramètre d'URL plutôt que par Authorization.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cle = searchParams.get('cle');
  if (!cle) return jsonError(401, 'Paramètre "cle" manquant.');

  // Recherche par hash, comme verifierCleApi() pour l'API Bearer — les clés
  // ne sont jamais stockées en clair. Cette route cherchait encore par la
  // colonne "cle" en clair, restée vide depuis le passage au hachage : aucun
  // abonnement d'agenda créé après cette migration ne pouvait plus s'authentifier.
  const ligneCle = await get('SELECT id, centre_id, actif FROM api_cles WHERE cle_hash = ?', [hashCleApi(cle)]);
  if (!ligneCle || !ligneCle.actif) return jsonError(401, 'Clé API invalide ou révoquée.');

  run('UPDATE api_cles SET derniere_utilisation = ? WHERE id = ?', [new Date().toISOString(), ligneCle.id]).catch(() => {});

  const centre = await get('SELECT nom FROM centres WHERE id = ?', [ligneCle.centre_id]);
  if (!centre) return jsonError(404, 'Centre introuvable.');

  const rdv = await all(
    `SELECT r.reference, c.date, c.heure, c.duree_minutes, r.client_prenom, r.client_nom, r.client_telephone, r.immatriculation
     FROM rdv r JOIN creneaux c ON c.id = r.creneau_id
     WHERE c.centre_id = ? AND r.statut = 'confirme' AND c.date >= ?
     ORDER BY c.date, c.heure
     LIMIT 500`,
    [ligneCle.centre_id, todayISO()]
  );

  const flux = genererFluxICS(centre.nom, rdv);

  return new NextResponse(flux, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="creneau-ct-rendez-vous.ics"',
    },
  });
}
