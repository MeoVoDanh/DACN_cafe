import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import employeeReducer from "./employeeSlice";
import profileReducer from "./profileSlice";
import employeeShiftReducer from "./employeeShiftSlice";
import invoiceReducer from "./invoiceSlice";
import menuReducer from "./menuSlice";
import shiftReducer from "./shiftSlice";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    employee: employeeReducer,
    profile: profileReducer,
    employeeShift: employeeShiftReducer,
    invoice: invoiceReducer,
    menu: menuReducer,
    shift: shiftReducer,
  },
});
