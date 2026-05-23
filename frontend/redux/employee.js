import { createSlice } from '@reduxjs/toolkit';

const employeeSlice = createSlice({
    name: 'employee',
    initialState: { selected: null },
    reducers: {
        setEmployeeDetail: (state, action) => {
            state.selected = action.payload;
        },
    },
});

export const { setEmployeeDetail } = employeeSlice.actions;
export default employeeSlice.reducer;