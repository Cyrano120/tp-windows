import { createSlice } from "@reduxjs/toolkit";

const initialState = { items: [], loading: false };

const offresSlice = createSlice({
  name: "offres",
  initialState,
  reducers: {
    setOffres: (state, action) => { state.items = action.payload; },
    addOffre: (state, action) => { state.items.unshift(action.payload); },
    updateOffreStatus: (state, action) => {
      const idx = state.items.findIndex((o) => o.id === action.payload.id);
      if (idx !== -1) state.items[idx].status = action.payload.status;
    },
    setLoading: (state, action) => { state.loading = action.payload; },
  },
});

export const { setOffres, addOffre, updateOffreStatus, setLoading } = offresSlice.actions;
export default offresSlice.reducer;
