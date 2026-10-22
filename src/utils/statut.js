/**
 * Transforme un statut métier en classe CSS stable :
 * accents supprimés, espaces remplacés par des tirets.
 * « En cours » -> "en-cours", « Expédiée » -> "expediee".
 */
export function statutSlug(statut = "") {
  return String(statut)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
