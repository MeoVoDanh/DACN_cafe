import { configureStore } from '@reduxjs/toolkit';
import dsEmployeeReducer from './DS_employee';
import employeeReducer from './employee';

const store = configureStore({
  reducer: {
    dsEmployee: dsEmployeeReducer, // Key này phải khớp với state.dsEmployee
    employee: employeeReducer,     // Key này phải khớp với state.employee
  },
});

export default store;