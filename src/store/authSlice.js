import { createSlice } from "@reduxjs/toolkit";

const initialState = { user: null, isAdmin: false };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAdmin = action.payload?.role === "admin";
    },
    logout: () => initialState,
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
