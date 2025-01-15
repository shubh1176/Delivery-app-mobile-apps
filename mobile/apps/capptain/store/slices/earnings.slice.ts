import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

interface EarningsSummary {
  totalEarnings: number;
  totalIncentives: number;
  grandTotal: number;
  orderCount: number;
}

interface Transaction {
  type: 'credit' | 'debit' | 'withdrawal';
  amount: number;
  description: string;
  timestamp: string;
  status?: 'pending' | 'completed' | 'failed';
}

interface Incentive {
  amount: number;
  description: string;
  timestamp: string;
}

interface EarningsState {
  summary: EarningsSummary | null;
  transactions: Transaction[];
  incentives: Incentive[];
  isLoading: boolean;
  error: string | null;
}

const initialState: EarningsState = {
  summary: null,
  transactions: [],
  incentives: [],
  isLoading: false,
  error: null,
};

export const getEarningsSummary = createAsyncThunk(
  'earnings/getEarningsSummary',
  async (params: { startDate: string; endDate: string }, { rejectWithValue }) => {
    try {
      const response = await api.get('/partner/earnings/summary', {
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch earnings summary');
    }
  }
);

export const getTransactionHistory = createAsyncThunk(
  'earnings/getTransactionHistory',
  async (params: { page: number; limit: number }, { rejectWithValue }) => {
    try {
      const response = await api.get('/partner/earnings/transactions', {
        params: {
          page: params.page,
          limit: params.limit,
        },
      });
      return response.data.data.transactions;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transaction history');
    }
  }
);

export const getIncentives = createAsyncThunk(
  'earnings/getIncentives',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/partner/earnings/incentives');
      return response.data.data.incentives;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch incentives');
    }
  }
);

const earningsSlice = createSlice({
  name: 'earnings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Earnings Summary
      .addCase(getEarningsSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getEarningsSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload;
      })
      .addCase(getEarningsSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get Transaction History
      .addCase(getTransactionHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTransactionHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload;
      })
      .addCase(getTransactionHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get Incentives
      .addCase(getIncentives.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getIncentives.fulfilled, (state, action) => {
        state.isLoading = false;
        state.incentives = action.payload;
      })
      .addCase(getIncentives.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = earningsSlice.actions;
export default earningsSlice.reducer; 