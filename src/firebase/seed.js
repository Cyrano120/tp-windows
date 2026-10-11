import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

const produits = [
  { nom: "Chemise élégante", categorie: "Homme", prix: 15000, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop", tailles: ["S", "M", "L", "XL"] },
  { nom: "Robe fleurie", categorie: "Femme", prix: 22000, image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=400&fit=crop", tailles: ["S", "M", "L"] },
  { nom: "Jean slim", categorie: "Homme", prix: 18000, image: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&h=400&fit=crop", tailles: ["38", "40", "42"] },
  { nom: "Sac à main", categorie: "Accessoires", prix: 25000, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop", tailles: [] },
  { nom: "Montre connectée", categorie: "Accessoires", prix: 35000, image: "https://images.unsplash.com/photo-1546868871-af0de0ae72ba?w=400&h=400&fit=crop", tailles: [] },
  { nom: "T-shirt design", categorie: "Homme", prix: 8000, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop", tailles: ["S", "M", "L", "XL"] },
  { nom: "Jupe courte", categorie: "Femme", prix: 12000, image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&h=400&fit=crop", tailles: ["S", "M", "L"] },
  { nom: "Costume cravate", categorie: "Homme", prix: 45000, image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop", tailles: ["M", "L", "XL"] },
  { nom: "Chaussures sport", categorie: "Homme", prix: 28000, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", tailles: ["40", "41", "42", "43"] },
  { nom: "Veste en cuir", categorie: "Femme", prix: 55000, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop", tailles: ["S", "M", "L"] },
];

export async function seedFirestore() {
  for (const p of produits) {
    await addDoc(collection(db, "produits"), p);
  }
  console.log(`${produits.length} produits ajoutés à Firestore !`);
}
