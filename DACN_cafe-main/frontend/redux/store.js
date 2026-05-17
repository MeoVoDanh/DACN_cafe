import { configureStore } from '@reduxjs/toolkit';
import dsEmployeeReducer from './DS_employee';
import employeeReducer from './employee';
import authReducer from './authSlice';

const store = configureStore({
  reducer: {
    dsEmployee: dsEmployeeReducer, // Key này phải khớp với state.dsEmployee
    employee: employeeReducer,     // Key này phải khớp với state.employee
    auth: authReducer,             // State quản lý đăng nhập xác thực
  },
});

export default store;