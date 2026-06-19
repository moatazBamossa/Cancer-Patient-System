import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { rpcCall } from '../../utils/rpcCall';

export interface Patient {
  patient_id: string;
  national_id: string;
  full_name: string;
  birth_date: string;
  gender: string;
  phone: string;
  mobile_number: string;
  blood_type: string;
  status: string;
  nationality: string;
  email: string;
  created_at: string;
}

interface PatientsState {
  list: Patient[];
  searchResults: Patient[];
  selectedPatient: any | null; // Typed loosely for now (contains patient, contacts, diagnoses)
  loading: boolean;
  error: string | null;
}

const initialState: PatientsState = {
  list: [],
  searchResults: [],
  selectedPatient: null,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchAllPatients = createAsyncThunk(
  'patients/fetchAll',
  async ({ limit = 20, offset = 0 }: { limit?: number; offset?: number }) => {
    return await rpcCall<Patient[]>('get_all_patients', { p_limit: limit, p_offset: offset });
  }
);

export const fetchPatientDetails = createAsyncThunk(
  'patients/fetchDetails',
  async (patientId: string | number) => {
    return await rpcCall<any>('get_patient_details', { p_patient_id: patientId });
  }
);

export const searchPatients = createAsyncThunk(
  'patients/search',
  async (query: string) => {
    return await rpcCall<Patient[]>('search_patients', { p_query: query });
  }
);

const patientsSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    clearSearchResults(state) {
      state.searchResults = [];
    },
    clearSelectedPatient(state) {
      state.selectedPatient = null;
    }
  },
  extraReducers: (builder) => {
    // fetchAllPatients
    builder.addCase(fetchAllPatients.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAllPatients.fulfilled, (state, action) => {
      state.loading = false;
      state.list = action.payload || [];
    });
    builder.addCase(fetchAllPatients.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch patients';
    });

    // fetchPatientDetails
    builder.addCase(fetchPatientDetails.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPatientDetails.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedPatient = action.payload;
    });
    builder.addCase(fetchPatientDetails.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch details';
    });

    // searchPatients
    builder.addCase(searchPatients.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(searchPatients.fulfilled, (state, action) => {
      state.loading = false;
      state.searchResults = action.payload || [];
    });
    builder.addCase(searchPatients.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Search failed';
    });
  },
});

export const { clearSearchResults, clearSelectedPatient } = patientsSlice.actions;
export default patientsSlice.reducer;
