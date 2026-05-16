import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://10.106.36.45:3000/nhanvien'; 

export const fetchAllEmployees = createAsyncThunk('employees/fetchAll', async () => {
    const response = await axios.get(API_URL);
    return response.data;
});

const dsEmployeeSlice = createSlice({
    name: 'dsEmployee',
    initialState: { items: [], status: 'idle' },
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchAllEmployees.fulfilled, (state, action) => {
            state.items = action.payload;
        });
    },
});

export default dsEmployeeSlice.reducer;