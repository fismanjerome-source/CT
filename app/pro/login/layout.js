// Layout serveur uniquement pour porter les métadonnées SEO : page.js est un
// Client Component ('use client'), qui ne peut pas exporter `metadata`
// directement — Next.js résout les métadonnées via le layout du même
// segment même quand la page elle-même est cliente.
export const metadata = {
  title: 'Espace professionnel — Connexion',
  description: "Connectez-vous à votre espace professionnel Créneau CT pour gérer vos créneaux, vos tarifs et vos réservations.",
  alternates: { canonical: '/pro/login' },
};

export default function ProLoginLayout({ children }) {
  return children;
}
