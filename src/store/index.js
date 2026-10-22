import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import productsReducer from "./productsSlice";
import cartReducer from "./cartSlice";
import ordersReducer from "./ordersSlice";
import favoritesReducer from "./favoritesSlice";
import messagesReducer from "./messagesSlice";
import offresReducer from "./offresSlice";
import { sauvegarderEtat } from "./persistence";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    orders: ordersReducer,
    favorites: favoritesReducer,
    messages: messagesReducer,
    offres: offresReducer,
  },
});

// Persiste panier + favoris entre deux visites (comme Vinted / Leboncoin).
let dernierPanier = store.getState().cart.items;
let derniersFavoris = store.getState().favorites.items;
store.subscribe(() => {
  const { cart, favorites } = store.getState();
  if (cart.items !== dernierPanier || favorites.items !== derniersFavoris) {
    dernierPanier = cart.items;
    derniersFavoris = favorites.items;
    sauvegarderEtat({ cart, favorites });
  }
});
