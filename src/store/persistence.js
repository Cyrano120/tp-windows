const CART_KEY = "cyrano.cart.v1";
const FAVS_KEY = "cyrano.favoris.v1";

function lire(cle, fallback) {
  try {
    const brut = localStorage.getItem(cle);
    return brut ? JSON.parse(brut) : fallback;
  } catch {
    return fallback;
  }
}

export function chargerPanier() {
  const items = lire(CART_KEY, []);
  return Array.isArray(items) ? items.filter((i) => i && i.id && i.prix >= 0) : [];
}

export function chargerFavoris() {
  const items = lire(FAVS_KEY, []);
  return Array.isArray(items) ? items.filter((i) => i && i.id) : [];
}

export function sauvegarderEtat(state) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(state.cart.items));
    localStorage.setItem(FAVS_KEY, JSON.stringify(state.favorites.items));
  } catch {
    /* stockage indisponible (navigation privée) : on ignore */
  }
}
