import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "./api";

const initialState = {
  invoices: [],
  drinks: [],
  selectedInvoice: null,
  isLoading: false,
  error: null,
  message: null,
};

export const fetchInvoices = createAsyncThunk(
  "invoice/fetchInvoices",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/hoadon");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Không lấy được danh sách hóa đơn";

      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const fetchDrinksForInvoice = createAsyncThunk(
  "invoice/fetchDrinksForInvoice",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/douong");

      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi lấy danh sách đồ uống",
      );
    }
  },
);

export const createInvoice = createAsyncThunk(
  "invoice/createInvoice",
  async (invoiceData, thunkAPI) => {
    try {
      const response = await api.post("/hoadon", invoiceData);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Tạo hóa đơn thất bại";

      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const payInvoice = createAsyncThunk(
  "invoice/payInvoice",
  async (maHoaDon, thunkAPI) => {
    try {
      const response = await api.patch(`/hoadon/${maHoaDon}/thanh-toan`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Thanh toán hóa đơn thất bại";

      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const updateInvoice = createAsyncThunk(
  "invoice/updateInvoice",
  async ({ maHoaDon, invoiceData }, thunkAPI) => {
    try {
      const response = await api.put(`/hoadon/${maHoaDon}`, invoiceData);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Cập nhật hóa đơn thất bại";

      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const cancelInvoice = createAsyncThunk(
  "invoice/cancelInvoice",
  async (maHoaDon, thunkAPI) => {
    try {
      const response = await api.patch(`/hoadon/${maHoaDon}/huy`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Hủy hóa đơn thất bại";

      return thunkAPI.rejectWithValue(message);
    }
  },
);

const invoiceSlice = createSlice({
  name: "invoice",
  initialState,
  reducers: {
    clearInvoiceMessage: (state) => {
      state.message = null;
      state.error = null;
    },
    clearSelectedInvoice: (state) => {
      state.selectedInvoice = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchDrinksForInvoice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDrinksForInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.drinks = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchDrinksForInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Lỗi lấy danh sách đồ uống";
        state.drinks = [];
      })

      .addCase(createInvoice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message || "Tạo hóa đơn thành công";
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(payInvoice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(payInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message || "Thanh toán thành công";
      })
      .addCase(payInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(updateInvoice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message || "Cập nhật hóa đơn thành công";
      })
      .addCase(updateInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(cancelInvoice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message || "Hủy hóa đơn thành công";
      })
      .addCase(cancelInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearInvoiceMessage, clearSelectedInvoice } =
  invoiceSlice.actions;

export default invoiceSlice.reducer;
