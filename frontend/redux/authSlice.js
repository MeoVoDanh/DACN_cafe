import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { setStorageItem, removeStorageItem } from "./storage";
import api from "./api";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ tenDangNhap, matKhau }, thunkAPI) => {
    try {
      const response = await api.post("/auth/login", {
        tenDangNhap,
        matKhau,
      });

      const { token, user } = response.data;

      await setStorageItem("token", token);
      await setStorageItem("user", JSON.stringify(user));

      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Không thể kết nối với backend";

      return thunkAPI.rejectWithValue(message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;

      removeStorageItem("token");
      removeStorageItem("user");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, logout } = authSlice.actions;
export default authSlice.reducer;
