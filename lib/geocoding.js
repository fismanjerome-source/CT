// lib/geocoding.js — convertit une adresse française en coordonnées GPS,
// via l'API officielle du gouvernement (gratuite, aucune clé nécessaire).
// Documentation : https://adresse.data.gouv.fr/api-doc/adresse
//
// Utilisation prévue : lors de l'ajout d'un nouveau centre (par exemple
// dans un futur formulaire admin "Ajouter un centre"), appeler cette
// fonction avec l'adresse complète pour obtenir latitude/longitude à
// enregistrer sur le centre.

export async function geocoderAdresse(adresse, codePostal, ville) {
  const q = encodeURIComponent(`${adresse} ${codePostal} ${ville}`);
  const url = `https://api-adresse.data.gouv.fr/search/?q=${q}&limit=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;
    const [longitude, latitude] = feature.geometry.coordinates;
    return { latitude, longitude };
  } catch {
    return null;
  }
}
