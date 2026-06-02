import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "./api";

const initialState = {
  drinks: [],
  categories: [],
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

export const fetchCategories = createAsyncThunk(
  "menu/fetchCategories",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/danhmuc");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Không lấy được danh mục",
      );
    }
  },
);

export const createCategory = createAsyncThunk(
  "menu/createCategory",
  async (data, thunkAPI) => {
    try {
      const response = await api.post("/danhmuc", data);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Thêm danh mục thất bại",
      );
    }
  },
);

export const updateCategory = createAsyncThunk(
  "menu/updateCategory",
  async ({ maDanhMuc, data }, thunkAPI) => {
    try {
      const response = await api.put(`/danhmuc/${maDanhMuc}`, data);
      return { maDanhMuc, ...response.data, newName: data.tenDanhMuc };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Cập nhật danh mục thất bại",
      );
    }
  },
);

export const deleteCategory = createAsyncThunk(
  "menu/deleteCategory",
  async (maDanhMuc, thunkAPI) => {
    try {
      const response = await api.delete(`/danhmuc/${maDanhMuc}`);
      return { maDanhMuc, message: response.data?.message || "Xóa danh mục thành công" };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Xóa danh mục thất bại",
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
      })
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.message = action.payload.message || "Thêm danh mục thành công";
        if (action.payload.maDanhMuc) {
          state.categories.push({
            maDanhMuc: action.payload.maDanhMuc,
            tenDanhMuc: action.payload.tenDanhMuc,
          });
        }
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.message = action.payload.message || "Cập nhật danh mục thành công";
        state.categories = state.categories.map((c) =>
          c.maDanhMuc === action.payload.maDanhMuc
            ? { ...c, tenDanhMuc: action.payload.newName }
            : c
        );
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.message = action.payload.message || "Xóa danh mục thành công";
        state.categories = state.categories.filter(
          (c) => c.maDanhMuc !== action.payload.maDanhMuc
        );
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearMenuMessage } = menuSlice.actions;
export default menuSlice.reducer;
