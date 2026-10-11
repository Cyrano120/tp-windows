import { createSlice } from "@reduxjs/toolkit";

const avisData = [
  { id: "1", produitId: "1", auteur: "Paul D.", note: 5, texte: "Excellente qualité, conforme à la description.", date: "2026-05-10" },
  { id: "2", produitId: "1", auteur: "Marie L.", note: 4, texte: "Bien mais la taille est légèrement grande.", date: "2026-04-28" },
  { id: "3", produitId: "2", auteur: "Sophie K.", note: 5, texte: "Robe magnifique ! Reçue en 2 jours.", date: "2026-05-05" },
  { id: "4", produitId: "5", auteur: "Thomas M.", note: 5, texte: "Montre au top, batterie longue durée.", date: "2026-05-12" },
  { id: "5", produitId: "10", auteur: "Alex N.", note: 4, texte: "Chaussures confortables, bon rapport qualité-prix.", date: "2026-05-01" },
];

const initialState = { items: avisData };

const avisSlice = createSlice({
  name: "avis",
  initialState,
  reducers: {
    ajouterAvis: (state, action) => {
      state.items.unshift({ id: Date.now().toString(), ...action.payload, date: new Date().toISOString().split("T")[0] });
    },
  },
});

export const { ajouterAvis } = avisSlice.actions;
export default avisSlice.reducer;
