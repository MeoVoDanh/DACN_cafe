import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "./api";

const initialState = {
  drinks: [],
  isLoading: false,
  error: null,
  message: null,
};

export const fetchDrinks = createAsyncThunk(
  "menu/fetchDrinks",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/douong");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Không lấy được menu",
      );
    }
  },
);

export const createDrink = createAsyncThunk(
  "menu/createDrink",
  async (data, thunkAPI) => {
    try {
      const response = await api.post("/douong", data);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Thêm đồ uống thất bại",
      );
    }
  },
);

export const updateDrink = createAsyncThunk(
  "menu/updateDrink",
  async ({ maDoUong, data }, thunkAPI) => {
    try {
      const response = await api.put(`/douong/${maDoUong}`, data);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Cập nhật đồ uống thất bại",
      );
    }
  },
);

export const deleteDrink = createAsyncThunk(
  "menu/deleteDrink",
  async (maDoUong, thunkAPI) => {
    try {
      await api.delete(`/douong/${maDoUong}`);
      return maDoUong;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Xóa đồ uống thất bại",
      );
    }
  },
);

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    clearMenuMessage: (state) => {
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDrinks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDrinks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.drinks = action.payload;
      })
      .addCase(fetchDrinks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(createDrink.fulfilled, (state, action) => {
        state.message = action.payload.message || "Thêm đồ uống thành công";
      })
      .addCase(createDrink.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(updateDrink.fulfilled, (state, action) => {
        state.message = action.payload.message || "Cập nhật đồ uống thành công";
      })
      .addCase(updateDrink.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(deleteDrink.fulfilled, (state, action) => {
        state.drinks = state.drinks.filter(
          (item) => item.maDoUong !== action.payload,
        );
        state.message = "Xóa đồ uống thành công";
      })
      .addCase(deleteDrink.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearMenuMessage } = menuSlice.actions;
export default menuSlice.reducer;
