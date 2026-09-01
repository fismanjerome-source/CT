// Réexporte la même page d'accueil que app/page.js (recherche, résultats,
// réservation) — le contenu diffère uniquement via useSite() (voir
// app/components/SiteContext.js), fourni ici par app/pl/layout.js. Aucune
// logique dupliquée : un seul fichier à maintenir pour les deux domaines.
export { default } from '../page';
