import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { getAdminSession, setSessionCookie } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

// Permet à l'admin d'accéder réellement à l'espace professionnel d'un
// centre (et pas seulement de le consulter en lecture seule) : ajouter une
// image, gérer les factures, modifier le planning... exactement comme le
// ferait le gérant. La session admin reste active en parallèle (cookies
// séparés), donc l'admin peut revenir à tout moment à son propre espace.
export async function POST(request, { params }) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const { id } = await params;

  const controleurs = await all(
    `SELECT ctrl.id, ctrl.nom, ctrl.email
     FROM controleur_centres cc
     JOIN controleurs ctrl ON ctrl.id = cc.controleur_id
     WHERE cc.centre_id = ?
     ORDER BY ctrl.id`,
    [id]
  );

  if (controleurs.length === 0) {
    return jsonError(404, 'Aucun compte gérant trouvé pour ce centre.');
  }

  // S'il y a plusieurs gérants pour ce centre, on utilise le premier —
  // suffisant pour accéder aux données du centre, qui sont partagées entre
  // tous les comptes qui le gèrent.
  const controleur = controleurs[0];
  await setSessionCookie(controleur.id);

  return NextResponse.json({
    message: `Connecté en tant que ${controleur.nom}.`,
    centre_id: Number(id),
    autres_gerants: controleurs.length > 1 ? controleurs.slice(1).map((c) => c.nom) : [],
  });
}
