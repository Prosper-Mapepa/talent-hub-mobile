import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Job, Application, PaginatedResponse } from '../../types';
import apiService from '../../services/api';

interface JobsState {
  jobs: Job[];
  currentJob: Job | null;
  applications: Application[];
  isLoading: boolean;
  error: string | null;
  totalJobs: number;
  currentPage: number;
  hasMore: boolean;
  filters: {
    search: string;
    type: string;
    experienceLevel: string;
    location: string;
  };
}

const initialState: JobsState = {
  jobs: [],
  currentJob: null,
  applications: [],
  isLoading: false,
  error: null,
  totalJobs: 0,
  currentPage: 1,
  hasMore: true,
  filters: {
    search: '',
    type: 'all',
    experienceLevel: 'all',
    location: 'all',
  },
};

// Async thunks
export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (params: {
    page?: number;
    search?: string;
    type?: string;
    experienceLevel?: string;
    location?: string;
    refresh?: boolean;
  } = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { jobs: JobsState };
      const { filters, currentPage } = state.jobs;
      
      const requestParams = {
        page: params?.refresh ? 1 : params?.page || currentPage,
        limit: 10,
        search: params?.search || filters.search,
        type: params?.type || filters.type,
        experienceLevel: params?.experienceLevel || filters.experienceLevel,
        location: params?.location || filters.location,
      };

      const response = await apiService.getJobs(requestParams);
      console.log('API Service response:', response);
      return { response, refresh: params?.refresh || false };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch jobs');
    }
  }
);

export const fetchJobById = createAsyncThunk(
  'jobs/fetchJobById',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const job = await apiService.getJobById(jobId);
      return job;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch job');
    }
  }
);

export const applyForJob = createAsyncThunk(
  'jobs/applyForJob',
  async ({ jobId, applicationData }: {
    jobId: string;
    applicationData: {
      coverLetter?: string;
      resume?: string;
    };
  }, { rejectWithValue }) => {
    try {
      const application = await apiService.applyForJob(jobId, applicationData);
      // Return the application with the jobId included for tracking
      return { ...application, jobId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply for job');
    }
  }
);

export const fetchMyApplications = createAsyncThunk(
  'jobs/fetchMyApplications',
  async (_, { rejectWithValue }) => {
    try {
      const applications = await apiService.getMyApplications();
      return applications;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch applications');
    }
  }
);

export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData: {
    title: string;
    description: string;
    type: string;
    experienceLevel: string;
    location: string;
    salary?: string;
    requirements: string[];
    responsibilities: string[];
    benefits: string[];
  }, { rejectWithValue }) => {
    try {
      const job = await apiService.createJob(jobData);
      return job;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create job');
    }
  }
);

export const updateJob = createAsyncThunk(
  'jobs/updateJob',
  async ({ jobId, jobData }: { jobId: string; jobData: Partial<Job> }, { rejectWithValue }) => {
    try {
      const job = await apiService.updateJob(jobId, jobData);
      return job;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update job');
    }
  }
);

export const deleteJob = createAsyncThunk(
  'jobs/deleteJob',
  async (jobId: string, { rejectWithValue }) => {
    try {
      await apiService.deleteJob(jobId);
      return jobId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete job');
    }
  }
);

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<JobsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1;
      state.hasMore = true;
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        type: 'all',
        experienceLevel: 'all',
        location: 'all',
      };
      state.currentPage = 1;
      state.hasMore = true;
    },
    setCurrentJob: (state, action: PayloadAction<Job | null>) => {
      state.currentJob = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetJobs: (state) => {
      state.jobs = [];
      state.currentPage = 1;
      state.hasMore = true;
      state.totalJobs = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Jobs
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        const { response, refresh } = action.payload;
        
        console.log('Redux fetchJobs fulfilled:', response);
        console.log('Jobs data:', response);
        
        // Always replace jobs array to prevent duplicates
          state.jobs = response;
        
        state.totalJobs = response.length;
        state.currentPage = 1;
        state.hasMore = false; // Since we're not paginating for now
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Job by ID
      .addCase(fetchJobById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentJob = action.payload;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Apply for Job
      .addCase(applyForJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(applyForJob.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the job to show it has been applied to
        // The application object should contain jobId, but we'll also check the jobId from the thunk
        const application = action.payload;
        const jobId = application.jobId;
        
        if (jobId) {
          const jobIndex = state.jobs.findIndex(job => job.id === jobId);
        if (jobIndex !== -1) {
            // Initialize applications array if it doesn't exist
            if (!state.jobs[jobIndex].applications) {
              state.jobs[jobIndex].applications = [];
            }
            state.jobs[jobIndex].applications.push(application);
        }
          if (state.currentJob?.id === jobId) {
            if (!state.currentJob.applications) {
              state.currentJob.applications = [];
            }
            state.currentJob.applications.push(application);
          }
        }
      })
      .addCase(applyForJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch My Applications
      .addCase(fetchMyApplications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyApplications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applications = action.payload;
      })
      .addCase(fetchMyApplications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Job
      .addCase(createJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs.unshift(action.payload);
      })
      .addCase(createJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Job
      .addCase(updateJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        state.isLoading = false;
        const jobIndex = state.jobs.findIndex(job => job.id === action.payload.id);
        if (jobIndex !== -1) {
          state.jobs[jobIndex] = action.payload;
        }
        if (state.currentJob?.id === action.payload.id) {
          state.currentJob = action.payload;
        }
      })
      .addCase(updateJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete Job
      .addCase(deleteJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = state.jobs.filter(job => job.id !== action.payload);
        if (state.currentJob?.id === action.payload) {
          state.currentJob = null;
        }
      })
      .addCase(deleteJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearFilters, setCurrentJob, clearError, resetJobs } = jobsSlice.actions;
export default jobsSlice.reducer; 