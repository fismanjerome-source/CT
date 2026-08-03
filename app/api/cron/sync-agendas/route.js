// app/api/cron/sync-agendas/route.js — à appeler régulièrement (toutes les
// heures par exemple) par un service de tâche planifiée externe et gratuit
// (ex: cron-job.org), avec le paramètre ?cle=VOTRE_CRON_SECRET dans l'URL.
// Synchronise automatiquement l'agenda externe de TOUS les centres qui en
// ont renseigné un, sans qu'un humain ait besoin de cliquer sur
// "Synchroniser maintenant".

import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { jsonError } from '@/lib/utils';
import { synchroniserAgendaCentre } from '@/lib/ical';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cle = searchParams.get('cle');

  if (!process.env.CRON_SECRET || cle !== process.env.CRON_SECRET) {
    return jsonError(401, 'Clé secrète manquante ou incorrecte.');
  }

  const centres = await all(`SELECT id, nom FROM centres WHERE ical_url IS NOT NULL AND ical_url != ''`);

  const resultats = [];
  for (const centre of centres) {
    try {
      const resultat = await synchroniserAgendaCentre(centre.id);
      resultats.push({ centre: centre.nom, ok: true, ...resultat });
    } catch (e) {
      // Un centre en échec (lien invalide, agenda inaccessible...) ne doit
      // jamais bloquer la synchronisation des autres centres.
      resultats.push({ centre: centre.nom, ok: false, erreur: e.message });
    }
  }

  const totalBloques = resultats.reduce((acc, r) => acc + (r.creneaux_bloques || 0), 0);

  return NextResponse.json({
    message: `${centres.length} centre(s) synchronisé(s), ${totalBloques} créneau(x) bloqué(s) au total.`,
    resultats,
  });
}
