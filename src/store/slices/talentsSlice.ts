import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../services/api';
import { Talent } from '../../types';

interface TalentsState {
  talents: Talent[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TalentsState = {
  talents: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchStudentTalents = createAsyncThunk(
  'talents/fetchStudentTalents',
  async (studentId: string) => {
    const response = await apiService.getStudentTalents(studentId);
    return response;
  }
);

export const fetchAllTalents = createAsyncThunk(
  'talents/fetchAllTalents',
  async () => {
    const response = await apiService.getAllTalents();
    return response;
  }
);

export const addTalent = createAsyncThunk(
  'talents/addTalent',
  async ({ studentId, talentData, files }: {
    studentId: string;
    talentData: { title: string; category: string; description: string };
    files?: any[];
  }) => {
    const response = await apiService.addTalent(studentId, talentData, files);
    return response;
  }
);

export const updateTalent = createAsyncThunk(
  'talents/updateTalent',
  async ({ studentId, talentId, talentData, files, existingFiles }: {
    studentId: string;
    talentId: string;
    talentData: { title: string; category: string; description: string };
    files?: any[];
    existingFiles?: string[];
  }) => {
    const response = await apiService.updateTalent(studentId, talentId, talentData, files, existingFiles);
    return response;
  }
);

export const deleteTalent = createAsyncThunk(
  'talents/deleteTalent',
  async ({ studentId, talentId }: { studentId: string; talentId: string }) => {
    await apiService.deleteTalent(studentId, talentId);
    return talentId;
  }
);

const talentsSlice = createSlice({
  name: 'talents',
  initialState,
  reducers: {
    clearTalents: (state) => {
      state.talents = [];
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch student talents
    builder
      .addCase(fetchStudentTalents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentTalents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.talents = action.payload;
      })
      .addCase(fetchStudentTalents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch talents';
      });

    // Fetch all talents
    builder
      .addCase(fetchAllTalents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllTalents.fulfilled, (state, action) => {
        state.isLoading = false;
        // Ensure payload is always an array
        const talents = Array.isArray(action.payload) ? action.payload : [];
        console.log(`Setting ${talents.length} talents in Redux store`);
        state.talents = talents;
      })
      .addCase(fetchAllTalents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch talents';
      });

    // Add talent
    builder
      .addCase(addTalent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addTalent.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add new talent at the beginning (most recent first)
        state.talents.unshift(action.payload);
      })
      .addCase(addTalent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to add talent';
      });

    // Update talent
    builder
      .addCase(updateTalent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTalent.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.talents.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.talents[index] = action.payload;
        }
      })
      .addCase(updateTalent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update talent';
      });

    // Delete talent
    builder
      .addCase(deleteTalent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTalent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.talents = state.talents.filter(t => t.id !== action.payload);
      })
      .addCase(deleteTalent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delete talent';
      });
  },
});

export const { clearTalents, setError } = talentsSlice.actions;
export default talentsSlice.reducer; 