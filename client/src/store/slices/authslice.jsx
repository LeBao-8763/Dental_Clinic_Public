import { createSlice } from "@reduxjs/toolkit";

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

const initialState = {
  user: user || null,
  accessToken: token || null,
  sessionExpired: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.sessionExpired = false;

      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
    },

    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.sessionExpired = false;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },

    sessionExpired: (state) => {
      state.user = null;
      state.accessToken = null;
      state.sessionExpired = true;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});

export const { loginSuccess, logout, sessionExpired } = authSlice.actions;
export default authSlice.reducer;
