import { describe, expect, it } from "vitest";
import { calculerTotaux, FRAIS_LIVRAISON, SEUIL_LIVRAISON_GRATUITE } from "../utils/totaux";
import { normaliserProduit } from "../data/catalogue";
import cartReducer, { addToCart, updateQuantity } from "../store/cartSlice";

describe("calcul des totaux", () => {
  it("retourne 0 pour un panier vide", () => {
    expect(calculerTotaux([])).toEqual({ sousTotal: 0, livraison: 0, total: 0 });
  });

  it("ajoute les frais de livraison sous le seuil", () => {
    const { sousTotal, livraison, total } = calculerTotaux([{ prix: 10000, quantity: 2 }]);
    expect(sousTotal).toBe(20000);
    expect(livraison).toBe(FRAIS_LIVRAISON);
    expect(total).toBe(21500);
  });

  it("offre la livraison au seuil", () => {
    const { livraison, total } = calculerTotaux([{ prix: SEUIL_LIVRAISON_GRATUITE, quantity: 1 }]);
    expect(livraison).toBe(0);
    expect(total).toBe(SEUIL_LIVRAISON_GRATUITE);
  });

  it("ignore les valeurs non numériques", () => {
    const { sousTotal } = calculerTotaux([{ prix: "15000", quantity: "2" }]);
    expect(sousTotal).toBe(30000);
  });
});

describe("normalisation produit", () => {
  it("fournit des valeurs par défaut sûres", () => {
    const p = normaliserProduit({ id: "x", nom: "Test", prix: 1000, vendeurNom: "Boutique" });
    expect(p.vendeur).toBe("Boutique");
    expect(p.tailles).toEqual([]);
    expect(p.stock).toBe(1);
    expect(p.etat).toBe("Bon état");
    expect(p.note).toBe(0);
  });

  it("conserve les tailles valides", () => {
    const p = normaliserProduit({ tailles: ["S", "M"], stock: 3, note: "4.5" });
    expect(p.tailles).toEqual(["S", "M"]);
    expect(p.stock).toBe(3);
    expect(p.note).toBe(4.5);
  });
});

describe("panier", () => {
  it("fusionne les mêmes articles de même taille", () => {
    let state = cartReducer(undefined, addToCart({ id: "1", nom: "A", prix: 100, taille: "M", stock: 5 }));
    state = cartReducer(state, addToCart({ id: "1", nom: "A", prix: 100, taille: "M", stock: 5 }));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it("sépare les tailles différentes", () => {
    let state = cartReducer(undefined, addToCart({ id: "1", nom: "A", prix: 100, taille: "M", stock: 5 }));
    state = cartReducer(state, addToCart({ id: "1", nom: "A", prix: 100, taille: "L", stock: 5 }));
    expect(state.items).toHaveLength(2);
  });

  it("ne dépasse pas le stock", () => {
    let state = cartReducer(undefined, addToCart({ id: "2", nom: "B", prix: 100, taille: "", stock: 2 }));
    state = cartReducer(state, updateQuantity({ id: "2", taille: "", quantity: 99 }));
    expect(state.items[0].quantity).toBe(2);
  });

  it("refuse un article en rupture de stock", () => {
    const state = cartReducer(undefined, addToCart({ id: "3", nom: "C", prix: 100, taille: "", stock: 0 }));
    expect(state.items).toHaveLength(0);
  });

  it("plafonne les ajouts successifs au stock réel", () => {
    let state = cartReducer(undefined, addToCart({ id: "4", nom: "D", prix: 100, taille: "", stock: 2 }));
    state = cartReducer(state, addToCart({ id: "4", nom: "D", prix: 100, taille: "", stock: 2 }));
    state = cartReducer(state, addToCart({ id: "4", nom: "D", prix: 100, taille: "", stock: 2 }));
    expect(state.items[0].quantity).toBe(2);
  });
});
