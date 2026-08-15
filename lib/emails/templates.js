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

export function emailRappelCommissionMensuelle({ nomControleur, nomCentre, mois, montant, dateLimite }) {
  return {
    subject: `Commission de ${mois} à régler avant le ${dateLimite}`,
    html: enveloppe(`
      <h1 style="color:#1B3A5C; font-size:20px; margin:0 0 16px;">Récapitulatif du mois écoulé</h1>
      <p style="color:#1A2420; line-height:1.6;">Bonjour ${nomControleur},</p>
      <p style="color:#1A2420; line-height:1.6;">
        Voici le récapitulatif de la commission générée par <strong>${nomCentre}</strong> sur ${mois} :
      </p>
      <div style="background:#F4F5F1; border-radius:6px; padding:16px; margin:16px 0; text-align:center;">
        <div style="font-size:28px; font-weight:bold; color:#1B3A5C;">${montant.toFixed(2)} €</div>
        <div style="color:#5B665F; font-size:14px; margin-top:4px;">à régler avant le ${dateLimite}</div>
      </div>
      <p style="color:#1A2420; line-height:1.6;">
        Retrouvez le détail complet de cette facturation, ainsi que les coordonnées de paiement, depuis votre
        espace professionnel.
      </p>
      ${bouton('Voir mes factures', `${SITE_URL}/pro/factures`)}
      <p style="color:#5B665F; line-height:1.6; font-size:13px; margin-top:20px;">
        Une question sur ce montant ? Écrivez-nous à contact@creneauct.fr.
      </p>
    `),
  };
}

export function emailPremiumActive({ nomControleur, nomCentre, montantProrata, joursRestants, moisLisible }) {
  return {
    subject: `${nomCentre} est maintenant en statut Premium ★`,
    html: enveloppe(`
      <h1 style="color:#1B3A5C; font-size:20px; margin:0 0 16px;">Statut Premium activé ★</h1>
      <p style="color:#1A2420; line-height:1.6;">Bonjour ${nomControleur},</p>
      <p style="color:#1A2420; line-height:1.6;">
        Le statut Premium de <strong>${nomCentre}</strong> est désormais actif. Il apparaît dès maintenant en tête
        des résultats de recherche, avec un badge doré visible par les clients.
      </p>
      <div style="background:#F4F5F1; border-radius:6px; padding:16px; margin:16px 0;">
        <p style="margin:0 0 8px; color:#1A2420;"><strong>Ce mois-ci (${moisLisible})</strong>, au prorata des ${joursRestants} jours restants :</p>
        <div style="font-size:24px; font-weight:bold; color:#1B3A5C;">${montantProrata.toFixed(2)} € TTC</div>
      </div>
      <p style="color:#1A2420; line-height:1.6;">
        À partir du mois prochain, le tarif plein sera de <strong>30 € TTC par mois</strong>, facturé exactement comme
        votre commission (à régler avant le 10 du mois suivant).
      </p>
      <p style="color:#1A2420; line-height:1.6;">
        Vous pouvez arrêter votre abonnement Premium à tout moment, sans engagement, directement depuis l'onglet
        « Premium » de votre espace — le mois en cours sera alors lui aussi calculé au prorata du nombre de jours
        réellement actifs.
      </p>
      ${bouton('Voir mon statut Premium', `${SITE_URL}/pro/premium`)}
    `),
  };
}

export function emailPremiumDemande({ nomControleur, nomCentre }) {
  return {
    subject: `Nouvelle demande de statut Premium — ${nomCentre}`,
    html: enveloppe(`
      <h1 style="color:#1B3A5C; font-size:20px; margin:0 0 16px;">Nouvelle demande Premium</h1>
      <p style="color:#1A2420; line-height:1.6;">
        <strong>${nomControleur}</strong> (${nomCentre}) souhaite activer le statut Premium.
      </p>
      <p style="color:#1A2420; line-height:1.6;">
        Activez-le depuis l'espace admin, rubrique « Centres & utilisateurs », une fois le règlement convenu.
      </p>
    `),
  };
}

export function emailPremiumArrete({ nomControleur, nomCentre, montantProrata, joursActifs, moisLisible }) {
  return {
    subject: `Statut Premium arrêté — ${nomCentre}`,
    html: enveloppe(`
      <h1 style="color:#1B3A5C; font-size:20px; margin:0 0 16px;">Statut Premium arrêté</h1>
      <p style="color:#1A2420; line-height:1.6;">Bonjour ${nomControleur},</p>
      <p style="color:#1A2420; line-height:1.6;">
        Le statut Premium de <strong>${nomCentre}</strong> vient d'être arrêté, à votre demande. Le badge et la
        mise en avant dans les résultats de recherche ont été retirés immédiatement.
      </p>
      <div style="background:#F4F5F1; border-radius:6px; padding:16px; margin:16px 0;">
        <p style="margin:0 0 8px; color:#1A2420;"><strong>${moisLisible}</strong>, au prorata des ${joursActifs} jour(s) où le Premium était actif :</p>
        <div style="font-size:24px; font-weight:bold; color:#1B3A5C;">${montantProrata.toFixed(2)} € TTC</div>
      </div>
      <p style="color:#1A2420; line-height:1.6;">
        Ce montant sera à régler avant le 10 du mois suivant, comme d'habitude. Vous pourrez réactiver le Premium
        à tout moment depuis votre espace.
      </p>
    `),
  };
}

export function emailMotDePasseModifie({ nom }) {
  return {
    subject: 'Votre mot de passe Créneau CT a été modifié',
    html: enveloppe(`
      <h1 style="color:#1B3A5C; font-size:20px; margin:0 0 16px;">Mot de passe modifié 🔒</h1>
      <p style="color:#1A2420; line-height:1.6;">Bonjour ${nom},</p>
      <p style="color:#1A2420; line-height:1.6;">
        Le mot de passe de votre compte Créneau CT vient d'être modifié à l'instant.
      </p>
      <div style="background:#FBEAE6; border-left:3px solid #B3402E; padding:12px 16px; margin:16px 0; color:#1A2420; line-height:1.6;">
        Si vous n'êtes pas à l'origine de ce changement, contactez-nous immédiatement à
        <strong>contact@creneauct.fr</strong>.
      </div>
    `),
  };
}

export function emailChangementRdvCentre({ nomControleur, type, clientNom, dateLisible, heure, ancienneDateLisible, ancienneHeure, reference }) {
  const estAnnulation = type === 'annulation';
  return {
    subject: estAnnulation
      ? `Rendez-vous annulé par le client — ${reference}`
      : `Rendez-vous déplacé par le client — ${reference}`,
    html: enveloppe(`
      <h1 style="color:#1B3A5C; font-size:20px; margin:0 0 16px;">
        ${estAnnulation ? 'Un rendez-vous a été annulé ❌' : 'Un rendez-vous a été déplacé 🔄'}
      </h1>
      <p style="color:#1A2420; line-height:1.6;">Bonjour ${nomControleur},</p>
      <p style="color:#1A2420; line-height:1.6;">
        ${clientNom} vient ${estAnnulation ? "d'annuler" : 'de déplacer'} son rendez-vous
        ${estAnnulation ? `initialement prévu le <strong>${ancienneDateLisible} à ${ancienneHeure}</strong>.` : ':'}
      </p>
      ${!estAnnulation ? `
      <table style="width:100%; border-collapse:collapse; margin:16px 0;">
        <tr><td style="padding:6px 0; color:#5B665F;">Ancien horaire</td><td style="padding:6px 0; color:#1A2420;"><s>${ancienneDateLisible} à ${ancienneHeure}</s></td></tr>
        <tr><td style="padding:6px 0; color:#5B665F;">Nouvel horaire</td><td style="padding:6px 0; font-weight:bold; color:#1A2420;">${dateLisible} à ${heure}</td></tr>
      </table>
      ` : ''}
      <p style="color:#1A2420; line-height:1.6;">
        ${estAnnulation
          ? "Ce créneau est de nouveau disponible à la réservation sur Créneau CT."
          : "Votre planning a été mis à jour automatiquement."}
      </p>
      <p style="color:#5B665F; line-height:1.6; font-size:13px;">Référence : ${reference}</p>
      ${bouton('Consulter mon planning', `${SITE_URL}/pro/dashboard`)}
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

export function emailVerificationPassage({ clientNom, centreNom, dateLisible, reference }) {
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
        Votre avis aide les prochains automobilistes à choisir leur centre en toute confiance — ça prend moins
        d'une minute :
      </p>
      ${bouton('Laisser mon avis', `${SITE_URL}/avis/${reference}`)}
      <p style="color:#1A2420; line-height:1.6; margin-top:16px;">
        Si le rendez-vous n'a pas pu avoir lieu, ou si vous rencontrez le moindre souci, répondez simplement à
        cet email ou contactez-nous — nous reviendrons vers vous rapidement.
      </p>
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
