import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunk action để gọi API đăng nhập kiểm tra với SQL thông qua backend
export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      // Thay đổi localhost thành IP máy tính nếu chạy trên thiết bị thật (VD: http://192.168.1.x:1234/auth/login)
      const response = await axios.post(
        "http://localhost:1234/auth/login",
        {
          tenDangNhap: username,
          MatKhau: password,
        },
        { withCredentials: true }
      );
      
      const user = response.data.user;
      
      // So sánh vai trò (trong SQL là vaiTro)
      if (user && user.role === "Admin") {
        return user;
      } else {
        return rejectWithValue("Chỉ tài khoản Admin mới được phép đăng nhập vào hệ thống!");
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        return rejectWithValue(`Đăng nhập thất bại: ${error.response.data.message}`);
      } else {
        return rejectWithValue("Không thể kết nối đến máy chủ backend.");
      }
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
