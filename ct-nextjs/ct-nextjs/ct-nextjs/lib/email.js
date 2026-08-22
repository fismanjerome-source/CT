// lib/email.js — envoi d'email transactionnel via Resend (API REST directe,
// pas de SDK pour rester léger). Si RESEND_API_KEY n'est pas configurée
// (en local, ou avant que vous ayez créé votre compte Resend), l'envoi est
// simplement ignoré avec un message dans les logs — rien ne casse.

export async function envoyerEmail({ to, subject, html, attachments }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'Créneau CT <onboarding@resend.dev>';

  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY non configurée — email à ${to} ("${subject}") non envoyé.`);
    return { envoye: false };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        ...(attachments ? { attachments } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error(`[email] Échec de l'envoi à ${to} :`, detail);
      return { envoye: false };
    }
    return { envoye: true };
  } catch (e) {
    console.error(`[email] Erreur réseau lors de l'envoi à ${to} :`, e.message);
    return { envoye: false };
  }
}
