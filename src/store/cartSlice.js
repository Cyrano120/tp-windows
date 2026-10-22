import { createSlice } from "@reduxjs/toolkit";
import { chargerPanier } from "./persistence";

const initialState = {
  items: chargerPanier(),
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const produit = action.payload;
      const existing = state.items.find((i) => i.id === produit.id && (i.taille || "") === (produit.taille || ""));
      // `Number(stock) || 1` ferait passer un stock de 0 pour un stock inconnu.
      const stock = Number.isFinite(Number(produit.stock)) ? Number(produit.stock) : 1;
      if (stock <= 0) return;
      if (existing) {
        existing.quantity = Math.min(existing.quantity + 1, stock);
      } else {
        state.items.push({ ...produit, quantity: 1 });
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((i) => !(i.id === action.payload.id && (i.taille || "") === (action.payload.taille || "")));
    },
    updateQuantity: (state, action) => {
      const item = state.items.find((i) => i.id === action.payload.id && (i.taille || "") === (action.payload.taille || ""));
      if (item) {
        const stock = Number.isFinite(Number(item.stock)) ? Number(item.stock) : 99;
        item.quantity = Math.max(1, Math.min(Number(action.payload.quantity) || 1, stock));
      }
    },
    clearCart: () => ({ items: [] }),
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
