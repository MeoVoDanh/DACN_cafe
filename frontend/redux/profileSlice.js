import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "./api";

const initialState = {
  profile: null,
  notifications: [],
  isLoading: false,
  error: null,
};

export const fetchProfile = createAsyncThunk(
  "profile/fetchProfile",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/canhan/thong-tin");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Không lấy được thông tin cá nhân";

      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const fetchNotifications = createAsyncThunk(
  "profile/fetchNotifications",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/canhan/thong-bao");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Không lấy được danh sách thông báo";

      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const markAllNotificationsRead = createAsyncThunk(
  "profile/markAllNotificationsRead",
  async (_, thunkAPI) => {
    try {
      const response = await api.patch("/canhan/thong-bao/doc-het");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Không thể đánh dấu đọc tất cả thông báo";

      return thunkAPI.rejectWithValue(message);
    }
  },
);

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfileError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((item) => ({
          ...item,
          trangThai: "Đã đọc",
        }));
      })
      .addCase(markAllNotificationsRead.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearProfileError } = profileSlice.actions;
export default profileSlice.reducer;
