export const FRAIS_LIVRAISON = 1500;
export const SEUIL_LIVRAISON_GRATUITE = 50000;

/**
 * Règle métier unique pour le calcul des totaux (panier + commande).
 * Le prix utilisé est toujours celui du catalogue, jamais celui envoyé par le client.
 */
export function calculerTotaux(items) {
  const sousTotal = items.reduce((sum, i) => sum + Number(i.prix) * Number(i.quantity), 0);
  const livraison = sousTotal >= SEUIL_LIVRAISON_GRATUITE || sousTotal === 0 ? 0 : FRAIS_LIVRAISON;
  return { sousTotal, livraison, total: sousTotal + livraison };
}
