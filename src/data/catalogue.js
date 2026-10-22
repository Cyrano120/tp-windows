/**
 * Catalogue de démonstration — source unique de vérité.
 * Les produits créés par les vendeurs (Firestore) sont fusionnés à l'exécution.
 */
export const PRODUITS = [
  {
    id: "1", nom: "Chemise élégante", categorie: "Homme", prix: 15000,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&h=900&fit=crop",
    tailles: ["S", "M", "L", "XL"], etat: "Très bon état", marque: "Zara",
    desc: "Chemise en coton premium, idéale pour les occasions spéciales. Coupe moderne et confortable.",
    vendeur: "Alice Mode", ville: "Libreville", note: 4.8, nbAvis: 23, stock: 4,
  },
  {
    id: "2", nom: "Robe fleurie", categorie: "Femme", prix: 22000,
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=700&h=900&fit=crop",
    tailles: ["S", "M", "L"], etat: "Neuf avec étiquette", marque: "H&M",
    desc: "Robe légère à motif floral parfaite pour l'été. Tissu respirant.",
    vendeur: "Style Féminin", ville: "Port-Gentil", note: 4.9, nbAvis: 31, stock: 2,
  },
  {
    id: "3", nom: "Jean slim", categorie: "Homme", prix: 18000,
    image: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=700&h=900&fit=crop",
    tailles: ["38", "40", "42"], etat: "Bon état", marque: "Levi's",
    desc: "Jean slim stretch noir. Confort optimal.",
    vendeur: "Jean K.", ville: "Franceville", note: 4.6, nbAvis: 15, stock: 3,
  },
  {
    id: "4", nom: "Sac à main", categorie: "Accessoires", prix: 25000,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700&h=900&fit=crop",
    tailles: [], etat: "Très bon état", marque: "Michael Kors",
    desc: "Sac en cuir véritable. Compartiments multiples.",
    vendeur: "Accessoires Plus", ville: "Libreville", note: 4.7, nbAvis: 19, stock: 1,
  },
  {
    id: "5", nom: "Montre connectée", categorie: "Accessoires", prix: 35000,
    image: "https://images.unsplash.com/photo-1546868871-af0de0ae72ba?w=700&h=900&fit=crop",
    tailles: [], etat: "Comme neuf", marque: "Samsung",
    desc: "Écran AMOLED, suivi d'activité, notifications.",
    vendeur: "Tech Wear", ville: "Libreville", note: 4.5, nbAvis: 42, stock: 2,
  },
  {
    id: "6", nom: "T-shirt design", categorie: "Homme", prix: 8000,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&h=900&fit=crop",
    tailles: ["S", "M", "L", "XL"], etat: "Neuf sans étiquette", marque: "Urban Style",
    desc: "100% coton bio, motif original.",
    vendeur: "Urban Style", ville: "Oyem", note: 4.4, nbAvis: 8, stock: 6,
  },
  {
    id: "7", nom: "Jupe courte", categorie: "Femme", prix: 12000,
    image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=700&h=900&fit=crop",
    tailles: ["S", "M", "L"], etat: "Très bon état", marque: "Zara",
    desc: "Jupe en denim léger, look casual.",
    vendeur: "Style Féminin", ville: "Port-Gentil", note: 4.3, nbAvis: 11, stock: 2,
  },
  {
    id: "8", nom: "Costume cravate", categorie: "Homme", prix: 45000,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=700&h=900&fit=crop",
    tailles: ["M", "L", "XL"], etat: "Très bon état", marque: "Celio",
    desc: "Costume complet avec cravate assortie.",
    vendeur: "Alice Mode", ville: "Libreville", note: 4.9, nbAvis: 27, stock: 1,
  },
  {
    id: "9", nom: "Lunettes de soleil", categorie: "Accessoires", prix: 15000,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=700&h=900&fit=crop",
    tailles: [], etat: "Bon état", marque: "Ray-Ban",
    desc: "Polarisées anti-UV, monture légère.",
    vendeur: "Accessoires Plus", ville: "Libreville", note: 4.2, nbAvis: 6, stock: 2,
  },
  {
    id: "10", nom: "Chaussures sport", categorie: "Homme", prix: 28000,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&h=900&fit=crop",
    tailles: ["40", "41", "42", "43"], etat: "Comme neuf", marque: "Nike",
    desc: "Semelle amortissante, design moderne.",
    vendeur: "Urban Style", ville: "Oyem", note: 4.6, nbAvis: 34, stock: 3,
  },
  {
    id: "11", nom: "Veste en cuir", categorie: "Femme", prix: 55000,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&h=900&fit=crop",
    tailles: ["S", "M", "L"], etat: "Très bon état", marque: "Mango",
    desc: "Cuir véritable, doublure soyeuse.",
    vendeur: "Style Féminin", ville: "Port-Gentil", note: 4.8, nbAvis: 16, stock: 1,
  },
  {
    id: "12", nom: "Casquette street", categorie: "Accessoires", prix: 7000,
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=700&h=900&fit=crop",
    tailles: [], etat: "Neuf sans étiquette", marque: "New Era",
    desc: "Ajustable, broderie originale.",
    vendeur: "Urban Style", ville: "Oyem", note: 4.1, nbAvis: 5, stock: 8,
  },
];

export const CATEGORIES = ["Toutes", "Homme", "Femme", "Accessoires"];
export const TAILLES = ["XS", "S", "M", "L", "XL", "38", "40", "41", "42", "43"];
export const ETATS = ["Neuf avec étiquette", "Neuf sans étiquette", "Comme neuf", "Très bon état", "Bon état"];

/** Garantit la présence des champs attendus par l'UI, quel que soit le produit (démo ou Firestore). */
export function normaliserProduit(p) {
  return {
    ...p,
    tailles: Array.isArray(p.tailles) ? p.tailles : [],
    etat: p.etat || "Bon état",
    marque: p.marque || "",
    vendeur: p.vendeur || p.vendeurNom || "Vendeur Cyrano",
    ville: p.ville || "",
    note: Number(p.note) || 0,
    nbAvis: Number(p.nbAvis ?? p.avis) || 0,
    stock: Number.isFinite(Number(p.stock)) ? Number(p.stock) : 1,
    desc: p.desc || "Aucune description fournie par le vendeur.",
  };
}

export function trouverProduit(id, produitsFirestore = []) {
  const local = PRODUITS.find((p) => String(p.id) === String(id));
  if (local) return normaliserProduit(local);
  const distant = produitsFirestore.find((p) => String(p.id) === String(id));
  return distant ? normaliserProduit(distant) : null;
}
