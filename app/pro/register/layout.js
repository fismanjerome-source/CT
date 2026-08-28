// Layout serveur uniquement pour porter les métadonnées SEO : page.js est un
// Client Component ('use client'), qui ne peut pas exporter `metadata`
// directement — Next.js résout les métadonnées via le layout du même
// segment même quand la page elle-même est cliente.
export const metadata = {
  title: 'Inscription centre de contrôle technique',
  description: "Créez gratuitement votre compte centre de contrôle technique sur Créneau CT : comblez vos créneaux vides, sans abonnement ni engagement. Vous ne payez une commission que sur les rendez-vous réellement honorés.",
  alternates: { canonical: '/pro/register' },
  openGraph: {
    title: 'Inscription centre de contrôle technique — Créneau CT',
    description: "Créez gratuitement votre compte centre de contrôle technique sur Créneau CT : comblez vos créneaux vides, sans abonnement ni engagement.",
  },
};

export default function ProRegisterLayout({ children }) {
  return children;
}
