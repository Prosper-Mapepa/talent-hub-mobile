import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Business, Job } from '../../types';
import apiService from '../../services/api';

interface BusinessesState {
  profile: Business | null;
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
}

const initialState: BusinessesState = {
  profile: null,
  jobs: [],
  isLoading: false,
  error: null,
};

export const fetchBusinessProfile = createAsyncThunk(
  'businesses/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const profile = await apiService.getBusinessProfile();
      return profile;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateBusinessProfile = createAsyncThunk(
  'businesses/updateProfile',
  async (profileData: Partial<Business>, { rejectWithValue }) => {
    try {
      const profile = await apiService.updateBusinessProfile(profileData);
      return profile;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const fetchBusinessJobs = createAsyncThunk(
  'businesses/fetchJobs',
  async (_, { rejectWithValue }) => {
    try {
      const jobs = await apiService.getBusinessJobs();
      return jobs;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch jobs');
    }
  }
);

const businessesSlice = createSlice({
  name: 'businesses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBusinessProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBusinessProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchBusinessProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateBusinessProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBusinessProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateBusinessProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchBusinessJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBusinessJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = action.payload;
      })
      .addCase(fetchBusinessJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = businessesSlice.actions;
export default businessesSlice.reducer; 