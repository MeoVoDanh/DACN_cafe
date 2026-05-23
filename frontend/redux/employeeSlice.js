import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "./api";

const initialState = {
  employees: [],
  selectedEmployee: null,
  isLoading: false,
  error: null,
  message: null,
};

export const fetchEmployees = createAsyncThunk(
  "employee/fetchEmployees",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/nhanvien");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Không lấy được danh sách nhân viên";

      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const createEmployee = createAsyncThunk(
  "employee/createEmployee",
  async (employeeData, thunkAPI) => {
    try {
      const response = await api.post("/nhanvien", employeeData);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Không thêm được nhân viên";

      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const updateEmployee = createAsyncThunk(
  "employee/updateEmployee",
  async ({ maNhanVien, employeeData }, thunkAPI) => {
    try {
      const response = await api.put(`/nhanvien/${maNhanVien}`, employeeData);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Không cập nhật được nhân viên";

      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const deleteEmployee = createAsyncThunk(
  "employee/deleteEmployee",
  async (maNhanVien, thunkAPI) => {
    try {
      await api.delete(`/nhanvien/${maNhanVien}`);
      return maNhanVien;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Không xóa được nhân viên";

      return thunkAPI.rejectWithValue(message);
    }
  },
);

const employeeSlice = createSlice({
  name: "employee",
  initialState,
  reducers: {
    clearEmployeeError: (state) => {
      state.error = null;
    },
    clearEmployeeMessage: (state) => {
      state.message = null;
    },
    setSelectedEmployee: (state, action) => {
      state.selectedEmployee = action.payload;
    },
    clearSelectedEmployee: (state) => {
      state.selectedEmployee = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(createEmployee.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message || "Thêm nhân viên thành công";
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(updateEmployee.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message =
          action.payload.message || "Cập nhật nhân viên thành công";
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(deleteEmployee.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employees = state.employees.filter(
          (item) => item.MaNhanVien !== action.payload,
        );
        state.message = "Xóa nhân viên thành công";
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearEmployeeError,
  clearEmployeeMessage,
  setSelectedEmployee,
  clearSelectedEmployee,
} = employeeSlice.actions;

export default employeeSlice.reducer;
