import SuiviClient from './SuiviClient';

export const metadata = {
  title: 'Suivre ou modifier mon rendez-vous',
  description: "Retrouvez votre rendez-vous de contrôle technique avec votre référence et votre email : consultez, modifiez ou annulez votre créneau en quelques secondes.",
  openGraph: {
    title: 'Suivre ou modifier mon rendez-vous — Créneau CT',
    description: "Retrouvez votre rendez-vous de contrôle technique avec votre référence et votre email : consultez, modifiez ou annulez votre créneau en quelques secondes.",
  },
};

export default function SuiviPage() {
  return <SuiviClient />;
}
