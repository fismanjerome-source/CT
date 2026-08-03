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

export function emailDetailsEspacePro({ nom, nomCentre }) {
  return {
    subject: 'Votre espace professionnel Créneau CT, en détail',
    html: enveloppe(`
      <h1 style="color:#1B3A5C; font-size:20px; margin:0 0 16px;">Un peu plus loin, ${nom}</h1>
      <p style="color:#1A2420; line-height:1.6;">
        Votre compte pour <strong>${nomCentre}</strong> est actif depuis une heure maintenant — voici ce que vous
        pouvez faire dans votre espace, en un coup d'œil.
      </p>
      <p style="color:#1A2420; line-height:1.6; background:#E5F1E7; border-radius:6px; padding:12px 16px;">
        💶 <strong>C'est entièrement gratuit.</strong> Aucun abonnement, aucun frais fixe, aucune carte bancaire à
        renseigner. Vous ne payez une commission que sur les rendez-vous réellement honorés.
      </p>
      <ul style="color:#1A2420; line-height:1.8; padding-left:20px;">
        <li>Ouvrez vos créneaux disponibles, y compris ceux de dernière minute</li>
        <li>Synchronisez votre agenda existant (Google, Outlook...) pour éviter tout double rendez-vous</li>
        <li>Fixez vos tarifs et vos promotions librement, créneau par créneau si besoin</li>
        <li>Suivez vos commissions et vos factures, mois par mois, en toute transparence</li>
        <li>Retrouvez des fiches pratiques utiles dans l'onglet « Juridique » (convention collective, congé paternité...)</li>
      </ul>
      <p style="color:#1A2420; line-height:1.6;">
        📱 <strong>Une application mobile est aussi disponible</strong>, sur smartphone et tablette — l'installation
        est expliquée en quelques secondes dans l'onglet « Paramètres » de votre espace.
      </p>
      ${bouton('Accéder à mon tableau de bord', `${SITE_URL}/pro/dashboard`)}
      <p style="color:#5B665F; line-height:1.6; font-size:13px; margin-top:20px;">
        Une question ? Une vraie personne vous répond à contact@creneauct.fr.
      </p>
    `),
  };
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

export function emailNouvelleReservationCentre({ nomControleur, clientNom, clientTelephone, clientEmail, dateLisible, heure, typeVehiculeLabel, immatriculation, reference, prixPaye }) {
  return {
    subject: `Nouvelle réservation — ${dateLisible} à ${heure}`,
    html: enveloppe(`
      <h1 style="color:#1B3A5C; font-size:20px; margin:0 0 16px;">Nouvelle réservation 📅</h1>
      <p style="color:#1A2420; line-height:1.6;">Bonjour ${nomControleur},</p>
      <p style="color:#1A2420; line-height:1.6;">Un client vient de réserver un créneau chez vous :</p>
      <table style="width:100%; border-collapse:collapse; margin:16px 0;">
        <tr><td style="padding:6px 0; color:#5B665F;">Date</td><td style="padding:6px 0; font-weight:bold; color:#1A2420;">${dateLisible} à ${heure}</td></tr>
        <tr><td style="padding:6px 0; color:#5B665F;">Client</td><td style="padding:6px 0; font-weight:bold; color:#1A2420;">${clientNom}</td></tr>
        <tr><td style="padding:6px 0; color:#5B665F;">Téléphone</td><td style="padding:6px 0; color:#1A2420;">${clientTelephone}</td></tr>
        <tr><td style="padding:6px 0; color:#5B665F;">Email</td><td style="padding:6px 0; color:#1A2420;">${clientEmail}</td></tr>
        ${typeVehiculeLabel ? `<tr><td style="padding:6px 0; color:#5B665F;">Véhicule</td><td style="padding:6px 0; color:#1A2420;">${typeVehiculeLabel}</td></tr>` : ''}
        <tr><td style="padding:6px 0; color:#5B665F;">Immatriculation</td><td style="padding:6px 0; font-family:monospace; color:#1A2420;">${immatriculation}</td></tr>
        <tr><td style="padding:6px 0; color:#5B665F;">Référence</td><td style="padding:6px 0; font-family:monospace; color:#1A2420;">${reference}</td></tr>
        ${prixPaye != null ? `<tr><td style="padding:6px 0; color:#5B665F;">Prix</td><td style="padding:6px 0; font-weight:bold; color:#1A2420;">${prixPaye.toFixed(2)} €</td></tr>` : ''}
      </table>
      <p style="color:#1A2420; line-height:1.6;">
        Retrouvez ce rendez-vous, et l'ensemble de votre planning, depuis votre espace professionnel.
      </p>
      ${bouton('Accéder à mon planning', `${SITE_URL}/pro/dashboard`)}
      <p style="color:#5B665F; line-height:1.6; font-size:13px; margin-top:20px;">
        Un empêchement, un client absent le jour J ? Signalez-le depuis l'onglet « Client absent » de votre espace.
      </p>
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

export function emailVerificationPassage({ clientNom, centreNom, dateLisible }) {
  return {
    subject: 'Votre contrôle technique s\'est-il bien passé ?',
    html: enveloppe(`
      <h1 style="color:#1B3A5C; font-size:20px; margin:0 0 16px;">Comment ça s'est passé ? 🚗</h1>
      <p style="color:#1A2420; line-height:1.6;">Bonjour ${clientNom},</p>
      <p style="color:#1A2420; line-height:1.6;">
        Vous aviez rendez-vous le <strong>${dateLisible}</strong> chez <strong>${centreNom}</strong> pour votre
        contrôle technique. Nous espérons que tout s'est bien déroulé !
      </p>
      <p style="color:#1A2420; line-height:1.6;">
        Si le rendez-vous n'a pas pu avoir lieu, ou si vous rencontrez le moindre souci, répondez simplement à
        cet email ou contactez-nous — nous reviendrons vers vous rapidement.
      </p>
      ${bouton('Nous contacter', `${SITE_URL}/contact`)}
    `),
  };
}

export function emailRdvNonHonore({ clientNom, centreNom, dateLisible, heure }) {
  return {
    subject: 'Votre rendez-vous n\'a pas été honoré',
    html: enveloppe(`
      <h1 style="color:#1B3A5C; font-size:20px; margin:0 0 16px;">Rendez-vous non honoré</h1>
      <p style="color:#1A2420; line-height:1.6;">Bonjour ${clientNom},</p>
      <p style="color:#1A2420; line-height:1.6;">
        Le centre <strong>${centreNom}</strong> nous a signalé que vous ne vous êtes pas présenté(e) au
        rendez-vous du <strong>${dateLisible} à ${heure}</strong>.
      </p>
      <div style="background:#FBEAE6; border-left:3px solid #B3402E; padding:12px 16px; margin:16px 0; color:#1A2420; line-height:1.6;">
        Un rendez-vous non honoré et non annulé prive un autre automobiliste d'un créneau disponible. Nous
        rappelons qu'il est possible d'annuler gratuitement, à tout moment et sans justificatif, depuis
        « Suivre un RDV » sur notre site. En cas de rendez-vous non honorés répétés, Créneau CT se réserve le
        droit de ne plus accepter de nouvelles réservations de votre part.
      </div>
      <p style="color:#1A2420; line-height:1.6;">
        Si vous pensez qu'il s'agit d'une erreur, ou que vous étiez bien présent(e), répondez à cet email ou
        contactez-nous rapidement — nous étudierons votre situation avec plaisir.
      </p>
      ${bouton('Nous contacter', `${SITE_URL}/contact`)}
    `),
  };
}
