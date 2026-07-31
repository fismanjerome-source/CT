export default function manifest() {
  return {
    name: 'Créneau CT — Réservation de contrôle technique',
    short_name: 'Créneau CT',
    description: "Réservez votre contrôle technique en ligne, y compris de dernière minute.",
    start_url: '/',
    display: 'standalone',
    background_color: '#F4F5F1',
    theme_color: '#1B3A5C',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
