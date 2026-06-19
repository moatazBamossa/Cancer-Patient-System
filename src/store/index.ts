import { configureStore } from '@reduxjs/toolkit';
import patientsReducer from './slices/patientsSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patients: patientsReducer,
    // Future slices (diagnoses, treatments, etc.) will be added here
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
