import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:1234/nhanvien'; 

export const fetchAllEmployees = createAsyncThunk('employees/fetchAll', async () => {
    // Nếu có dùng session/cookie ở backend thì thêm { withCredentials: true }
    const response = await axios.get(API_URL, { withCredentials: true });
    return response.data;
});

export const updateEmployee = createAsyncThunk('employees/update', async ({ id, data }, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${API_URL}/update/${id}`, data, { withCredentials: true });
        return { id, data };
    } catch (err) {
        return rejectWithValue(err.response?.data?.error || err.message);
    }
});

export const createEmployee = createAsyncThunk('employees/create', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post(API_URL, data, { withCredentials: true });
        return response.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.error || err.response?.data?.message || err.message);
    }
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