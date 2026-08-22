// lib/telegram.js — notification admin en temps réel via un bot Telegram.
// Nécessite TELEGRAM_BOT_TOKEN et TELEGRAM_CHAT_ID. Si absents, ignoré
// silencieusement (log uniquement) — jamais bloquant pour l'utilisateur.

export async function envoyerNotificationTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID non configurés — notification non envoyée.');
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
  } catch (e) {
    console.error('[telegram] Erreur envoi notification :', e.message);
  }
}
