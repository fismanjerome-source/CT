import ContactClient from './ContactClient';

export const metadata = {
  title: 'Contact',
  description: "Vous gérez un ou plusieurs centres de contrôle technique ? Contactez Créneau CT pour rejoindre la plateforme ou poser une question avant de vous inscrire.",
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact — Créneau CT',
    description: "Vous gérez un ou plusieurs centres de contrôle technique ? Contactez Créneau CT pour rejoindre la plateforme ou poser une question avant de vous inscrire.",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
