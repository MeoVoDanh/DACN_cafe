import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "./api";

const initialState = {
  availableShifts: [],
  myShifts: [],
  isLoading: false,
  error: null,
  message: null,
};

export const fetchAvailableShifts = createAsyncThunk(
  "employeeShift/fetchAvailableShifts",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/calam/con-trong");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Không lấy được danh sách ca trống";

      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const fetchMyShifts = createAsyncThunk(
  "employeeShift/fetchMyShifts",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/canhan/ca-lam");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Không lấy được ca làm của tôi";

      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const registerShift = createAsyncThunk(
  "employeeShift/registerShift",
  async (maCa, thunkAPI) => {
    try {
      const response = await api.patch(`/calam/${maCa}/dang-ky`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Đăng ký ca thất bại";

      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const cancelShift = createAsyncThunk(
  "employeeShift/cancelShift",
  async (maCa, thunkAPI) => {
    try {
      const response = await api.patch(`/calam/${maCa}/huy-dang-ky`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Hủy đăng ký ca thất bại";

      return thunkAPI.rejectWithValue(message);
    }
  },
);

const employeeShiftSlice = createSlice({
  name: "employeeShift",
  initialState,
  reducers: {
    clearShiftMessage: (state) => {
      state.message = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableShifts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAvailableShifts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableShifts = action.payload;
      })
      .addCase(fetchAvailableShifts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchMyShifts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyShifts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myShifts = action.payload;
      })
      .addCase(fetchMyShifts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(registerShift.fulfilled, (state, action) => {
        state.message = action.payload.message;
      })
      .addCase(registerShift.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(cancelShift.fulfilled, (state, action) => {
        state.message = action.payload.message;
      })
      .addCase(cancelShift.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearShiftMessage } = employeeShiftSlice.actions;
export default employeeShiftSlice.reducer;
