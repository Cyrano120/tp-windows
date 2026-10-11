import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import productsReducer from "./productsSlice";
import cartReducer from "./cartSlice";
import ordersReducer from "./ordersSlice";
import favoritesReducer from "./favoritesSlice";
import messagesReducer from "./messagesSlice";
import avisReducer from "./avisSlice";
import offresReducer from "./offresSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    orders: ordersReducer,
    favorites: favoritesReducer,
    messages: messagesReducer,
    avis: avisReducer,
    offres: offresReducer,
  },
});
