import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export interface Order {
  id: string;
  type: 'courier' | 'pickup-drop';
  status: string;
  pickup: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  drops: Array<{
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    status: string;
  }>;
  pricing: {
    base: number;
    distance: number;
    total: number;
  };
  createdAt: string;
}

interface OrderState {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  loading: false,
  error: null,
};

export const getOrders = createAsyncThunk(
  'order/getOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/partner/orders');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const acceptOrder = createAsyncThunk(
  'order/acceptOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/partner/orders/${orderId}/accept`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept order');
    }
  }
);

export const rejectOrder = createAsyncThunk(
  'order/rejectOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/partner/orders/${orderId}/reject`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject order');
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(getOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(acceptOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(rejectOrder.fulfilled, (state, action) => {
        state.orders = state.orders.filter(order => order.id !== action.payload.id);
      });
  },
});

export default orderSlice.reducer; 