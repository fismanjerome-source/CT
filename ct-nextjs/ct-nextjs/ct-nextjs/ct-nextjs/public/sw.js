// public/sw.js — service worker minimal, dont le seul rôle est de rendre le
// site installable (critère technique requis par Android/Chrome). Il ne met
// rien en cache et ne modifie aucune requête : le site reste toujours
// parfaitement à jour, sans risque de contenu obsolète affiché à un client
// ou un centre (réservations, planning...).

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Volontairement vide : toutes les requêtes passent normalement par le
  // réseau, comme si ce fichier n'existait pas.
});
