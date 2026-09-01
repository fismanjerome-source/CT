'use client';

import { createContext, useContext } from 'react';

// Transmet le site déjà résolu côté serveur (voir lib/site.js) aux
// composants clients — jamais recalculé depuis window.location, pour éviter
// un mismatch d'hydratation (le rendu serveur ne connaît pas encore le host
// tant qu'on ne le lui a pas explicitement transmis).
const SiteContext = createContext('vl');

export function SiteProvider({ site, children }) {
  return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>;
}

export function useSite() {
  return useContext(SiteContext);
}
