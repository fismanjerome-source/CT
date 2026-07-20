// lib/emails/templates.js — modèles HTML des emails envoyés par la
// plateforme. Le CSS est en ligne (inline) car c'est la seule méthode
// fiable dans la plupart des clients mail (Gmail, Outlook...).

const SITE_URL = process.env.SITE_URL || 'https://ct-rdv.onrender.com';

function enveloppe(contenuHtml) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; background: #F4F5F1; padding: 32px 16px;">
    <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #DDE2DA;">
      <div style="background: #1B3A5C; padding: 20px 28px;">
        <span style="color: #ffffff; font-size: 18px; font-weight: bold;">Créneau CT</span>
      </div>
      <div style="padding: 28px;">
        ${contenuHtml}
      </div>
      <div style="padding: 16px 28px; background: #F4F5F1; color: #5B665F; font-size: 12px;">
        Créneau CT — plateforme indépendante de mise en relation pour rendez-vous de contrôle technique.
      </div>
    </div>
  </div>`;
}

function bouton(texte, url) {
  return `<a href="${url}" style="display:inline-block; margin-top:20px; padding:12px 24px; background:#1B3A5C; color:#ffffff; text-decoration:none; border-radius:4px; font-weight:bold;">${texte}</a>`;
}

export function emailBienvenuePro({ nom, nomCentre }) {
  return {
    subject: 'Bienvenue sur Créneau CT',
    html: enveloppe(`
      <h1 style="color:#1B3A5C; font-size:20px; margin:0 0 16px;">Bienvenue, ${nom} 👋</h1>
      <p style="color:#1A2420; line-height:1.6;">
        Merci d'avoir créé votre compte professionnel pour <strong>${nomCentre}</strong>. Vous pouvez dès à présent
        déclarer vos véhicules acceptés, ouvrir vos créneaux disponibles, et commencer à recevoir des réservations.
      </p>
      <p style="color:#1A2420; line-height:1.6;">
        Aucun abonnement, aucun engagement : vous ne payez une commission que sur les rendez-vous réellement pris.
      </p>
      ${bouton('Accéder à mon tableau de bord', `${SITE_URL}/pro/dashboard`)}
    `),
  };
}

export function emailConfirmationReservation({ clientNom, centreNom, adresse, dateLisible, heure, reference, typeVehiculeLabel }) {
  return {
    subject: `Votre contrôle technique est confirmé — ${reference}`,
    html: enveloppe(`
      <h1 style="color:#1B3A5C; font-size:20px; margin:0 0 16px;">Rendez-vous confirmé ✅</h1>
      <p style="color:#1A2420; line-height:1.6;">Bonjour ${clientNom},</p>
      <p style="color:#1A2420; line-height:1.6;">Votre contrôle technique est bien confirmé :</p>
      <table style="width:100%; border-collapse:collapse; margin:16px 0;">
        <tr><td style="padding:6px 0; color:#5B665F;">Centre</td><td style="padding:6px 0; font-weight:bold; color:#1A2420;">${centreNom}</td></tr>
        <tr><td style="padding:6px 0; color:#5B665F;">Adresse</td><td style="padding:6px 0; color:#1A2420;">${adresse}</td></tr>
        <tr><td style="padding:6px 0; color:#5B665F;">Date</td><td style="padding:6px 0; font-weight:bold; color:#1A2420;">${dateLisible} à ${heure}</td></tr>
        ${typeVehiculeLabel ? `<tr><td style="padding:6px 0; color:#5B665F;">Véhicule</td><td style="padding:6px 0; font-weight:bold; color:#1A2420;">${typeVehiculeLabel}</td></tr>` : ''}
        <tr><td style="padding:6px 0; color:#5B665F;">Référence</td><td style="padding:6px 0; font-family:monospace; color:#1A2420;">${reference}</td></tr>
      </table>
      <div style="background:#FBEEE1; border-left:3px solid #C1611E; padding:12px 16px; margin:16px 0; color:#1A2420; line-height:1.6;">
        ⚠️ Merci d'arriver <strong>10 minutes avant l'heure</strong> de votre rendez-vous. Tout retard pourra
        entraîner un refus de prise en charge par le centre.<br/>
        📄 Pensez à vous munir de votre <strong>carte grise</strong> (certificat d'immatriculation) — le contrôle
        ne peut pas être réalisé sans ce document.
      </div>
      <p style="color:#1A2420; line-height:1.6;">
        Un fichier calendrier est joint à cet email : ouvrez-le pour ajouter directement ce rendez-vous à votre
        agenda (Google Calendar, Outlook, Apple Calendar...).
      </p>
      <p style="color:#1A2420; line-height:1.6;">
        Vous pouvez à tout moment retrouver ce rendez-vous depuis <strong>« Suivre un RDV »</strong> sur la page
        d'accueil de Créneau CT, avec votre référence et l'email utilisé pour réserver. En cas de changement de
        dernière minute, vous pourrez y <strong>modifier directement votre créneau</strong> pour un autre horaire
        disponible, sans avoir à nous contacter.
      </p>
      ${bouton('Consulter ou modifier mon RDV', `${SITE_URL}/suivi`)}
    `),
  };
}

export function emailRappelRendezVous({ clientNom, centreNom, adresse, heure, typeVehiculeLabel }) {
  return {
    subject: `Rappel : votre contrôle technique demain à ${heure}`,
    html: enveloppe(`
      <h1 style="color:#1B3A5C; font-size:20px; margin:0 0 16px;">C'est demain ! ⏰</h1>
      <p style="color:#1A2420; line-height:1.6;">Bonjour ${clientNom},</p>
      <p style="color:#1A2420; line-height:1.6;">
        Petit rappel : vous avez rendez-vous <strong>demain à ${heure}</strong> chez <strong>${centreNom}</strong>,
        ${adresse}${typeVehiculeLabel ? ` (${typeVehiculeLabel})` : ''}.
      </p>
      <div style="background:#FBEEE1; border-left:3px solid #C1611E; padding:12px 16px; margin:16px 0; color:#1A2420; line-height:1.6;">
        ⚠️ Arrivez <strong>10 minutes avant l'heure</strong> — tout retard peut entraîner un refus de prise en charge.<br/>
        📄 N'oubliez pas votre <strong>carte grise</strong>.
      </div>
      ${bouton('Voir mon rendez-vous', `${SITE_URL}/suivi`)}
    `),
  };
}
