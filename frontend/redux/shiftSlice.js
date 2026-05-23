import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "./api";

const initialState = {
  shifts: [],
  pendingShifts: [],
  isLoading: false,
  error: null,
  message: null,
};

export const fetchShifts = createAsyncThunk(
  "shift/fetchShifts",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/calam");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Không lấy được danh sách ca",
      );
    }
  },
);

export const createShift = createAsyncThunk(
  "shift/createShift",
  async (data, thunkAPI) => {
    try {
      const response = await api.post("/calam", data);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Tạo ca thất bại",
      );
    }
  },
);

export const updateShift = createAsyncThunk(
  "shift/updateShift",
  async ({ maCa, data }, thunkAPI) => {
    try {
      const response = await api.put(`/calam/${maCa}`, data);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Cập nhật ca thất bại",
      );
    }
  },
);

export const deleteShift = createAsyncThunk(
  "shift/deleteShift",
  async (maCa, thunkAPI) => {
    try {
      await api.delete(`/calam/${maCa}`);
      return maCa;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Xóa ca thất bại",
      );
    }
  },
);

export const fetchShiftsByDate = createAsyncThunk(
  "shift/fetchShiftsByDate",
  async (dateString, thunkAPI) => {
    try {
      const response = await api.get(`/calam/ngay/${dateString}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Không lấy được danh sách ca theo ngày",
      );
    }
  },
);

export const saveShiftsByDate = createAsyncThunk(
  "shift/saveShiftsByDate",
  async ({ dateString, shiftsData }, thunkAPI) => {
    try {
      const response = await api.post(`/calam/ngay/${dateString}`, shiftsData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Lưu danh sách ca thất bại",
      );
    }
  },
);

export const fetchPendingShifts = createAsyncThunk(
  "shift/fetchPendingShifts",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/calam/cho-duyet");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Không lấy được danh sách ca chờ duyệt",
      );
    }
  },
);

export const pheDuyetCaLam = createAsyncThunk(
  "shift/pheDuyetCaLam",
  async ({ maCa, action }, thunkAPI) => {
    try {
      const response = await api.patch(`/calam/${maCa}/phe-duyet`, { action });
      return { maCa, action, data: response.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Phê duyệt ca trực thất bại",
      );
    }
  },
);

const shiftSlice = createSlice({
  name: "shift",
  initialState,
  reducers: {
    clearShiftMessage: (state) => {
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShifts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchShifts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.shifts = action.payload;
      })
      .addCase(fetchShifts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(createShift.fulfilled, (state, action) => {
        state.message = action.payload.message || "Tạo ca thành công";
      })
      .addCase(createShift.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(updateShift.fulfilled, (state, action) => {
        state.message = action.payload.message || "Cập nhật ca thành công";
      })
      .addCase(updateShift.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(deleteShift.fulfilled, (state, action) => {
        state.shifts = state.shifts.filter(
          (item) => item.maCa !== action.payload,
        );
        state.message = "Xóa ca thành công";
      })
      .addCase(deleteShift.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchShiftsByDate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchShiftsByDate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.shifts = action.payload;
      })
      .addCase(fetchShiftsByDate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(saveShiftsByDate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveShiftsByDate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message || "Lưu ca thành công";
      })
      .addCase(saveShiftsByDate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchPendingShifts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPendingShifts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingShifts = action.payload;
      })
      .addCase(fetchPendingShifts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(pheDuyetCaLam.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(pheDuyetCaLam.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingShifts = state.pendingShifts.filter(
          (item) => item.maCa !== action.payload.maCa
        );
        state.message = action.payload.data.message || "Xử lý phê duyệt thành công";
      })
      .addCase(pheDuyetCaLam.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearShiftMessage } = shiftSlice.actions;
export default shiftSlice.reducer;
