import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth.slice';
import orderReducer from './slices/order.slice';
import earningsReducer from './slices/earnings.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    order: orderReducer,
    earnings: earningsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 