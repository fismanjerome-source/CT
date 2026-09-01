import { SiteProvider } from '../components/SiteContext';

// "pl" codé en dur : ce layout ne sert jamais que les requêtes déjà
// réécrites depuis pl.creneauct.fr par middleware.js — pas besoin de lire
// le host ici, ce qui permet à ces pages de rester statiquement
// générables (le titre/OG diffère de app/layout.js, mais sans dépendre
// d'une donnée de requête).
export const metadata = {
  // "absolute" plutôt que "default" : un "default" serait quand même
  // ré-enveloppé par le template du layout racine ("%s — Créneau CT"),
  // ajoutant un second suffixe en trop. "absolute" casse la chaîne de
  // templates ancêtres pour ce titre précis ; le template ci-dessous reste
  // actif pour les pages descendantes qui fournissent leur propre titre
  // (ex: app/pl/centre/[id]).
  title: {
    absolute: 'Créneau CT PL — Contrôle technique poids lourds et autocars',
    template: '%s — Créneau CT PL',
  },
  description: "Réservez en ligne le contrôle technique de vos camions, poids lourds et autocars, dans un centre agréé près de chez vous. Gestion de flotte simplifiée, sans frais supplémentaires.",
  keywords: ['contrôle technique poids lourd', 'contrôle technique camion', 'contrôle technique autocar', 'CT PL', 'visite technique poids lourd'],
  metadataBase: new URL('https://pl.creneauct.fr'),
  openGraph: {
    title: 'Créneau CT PL — Contrôle technique poids lourds et autocars',
    description: "Réservez en ligne le contrôle technique de vos camions, poids lourds et autocars, dans un centre agréé près de chez vous.",
    url: 'https://pl.creneauct.fr',
    siteName: 'Créneau CT PL',
    locale: 'fr_FR',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Créneau CT PL',
  },
};

export default function PlLayout({ children }) {
  return <SiteProvider site="pl">{children}</SiteProvider>;
}
