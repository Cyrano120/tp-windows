import { createSlice } from "@reduxjs/toolkit";

const initialState = { user: null, isAdmin: false, ready: false };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAdmin = action.payload?.role === "admin";
      state.ready = true;
    },
    setReady: (state) => {
      state.ready = true;
    },
    logout: () => ({ ...initialState, ready: true }),
  },
});

export const { setUser, setReady, logout } = authSlice.actions;
export default authSlice.reducer;
