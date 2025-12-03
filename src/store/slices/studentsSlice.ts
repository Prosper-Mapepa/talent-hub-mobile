import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Student, Skill, Project, Achievement } from '../../types';
import apiService from '../../services/api';

interface StudentsState {
  profile: Student | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: StudentsState = {
  profile: null,
  isLoading: false,
  error: null,
};

export const fetchStudentProfile = createAsyncThunk(
  'students/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const profile = await apiService.getStudentProfile();
      return profile;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateStudentProfile = createAsyncThunk(
  'students/updateProfile',
  async (profileData: Partial<Student>, { rejectWithValue }) => {
    try {
      const profile = await apiService.updateStudentProfile(profileData);
      return profile;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const addSkill = createAsyncThunk(
  'students/addSkill',
  async (skillData: { name: string; proficiency: string; category: string }, { rejectWithValue }) => {
    try {
      const skill = await apiService.addSkill(skillData);
      return skill;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add skill');
    }
  }
);

export const addProject = createAsyncThunk(
  'students/addProject',
  async (projectData: {
    title: string;
    description: string;
    technologies: string[];
    githubUrl?: string;
    liveUrl?: string;
  } | {
    projectData: {
      title: string;
      description: string;
      technologies: string[];
      githubUrl?: string;
      liveUrl?: string;
    };
    files?: any[];
  }, { rejectWithValue }) => {
    try {
      let actualProjectData;
      let files;
      
      if ('projectData' in projectData) {
        actualProjectData = projectData.projectData;
        files = projectData.files;
      } else {
        actualProjectData = projectData;
        files = undefined;
      }
      
      const project = await apiService.addProject(actualProjectData, files);
      return project;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add project');
    }
  }
);

export const addAchievement = createAsyncThunk(
  'students/addAchievement',
  async (achievementData: {
    title: string;
    description: string;
    date: string;
  } | {
    achievementData: {
      title: string;
      description: string;
      date: string;
    };
    files?: any[];
  }, { rejectWithValue }) => {
    try {
      let actualAchievementData;
      let files;
      
      if ('achievementData' in achievementData) {
        actualAchievementData = achievementData.achievementData;
        files = achievementData.files;
      } else {
        actualAchievementData = achievementData;
        files = undefined;
      }
      
      const achievement = await apiService.addAchievement(actualAchievementData, files);
      return achievement;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add achievement');
    }
  }
);

export const updateSkill = createAsyncThunk(
  'students/updateSkill',
  async (skillData: { id: string; name: string; proficiency: string; category: string }, { rejectWithValue }) => {
    try {
      const skill = await apiService.updateSkill(skillData);
      return skill;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update skill');
    }
  }
);

// Note: Backend doesn't support updating projects - only adding
// export const updateProject = createAsyncThunk(...) - NOT IMPLEMENTED

// Note: Backend doesn't support updating achievements - only adding
// export const updateAchievement = createAsyncThunk(...) - NOT IMPLEMENTED

export const updateProject = createAsyncThunk(
  'students/updateProject',
  async (projectData: {
    id: string;
    title: string;
    description: string;
    technologies: string[];
    githubUrl?: string;
    liveUrl?: string;
  }, { rejectWithValue }) => {
    try {
      const project = await apiService.updateProject(projectData);
      return project;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update project');
    }
  }
);

export const updateAchievement = createAsyncThunk(
  'students/updateAchievement',
  async (achievementData: {
    id: string;
    title: string;
    description: string;
    date: string;
  }, { rejectWithValue }) => {
    try {
      const achievement = await apiService.updateAchievement(achievementData);
      return achievement;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update achievement');
    }
  }
);

export const deleteSkill = createAsyncThunk(
  'students/deleteSkill',
  async (skillId: string, { rejectWithValue }) => {
    try {
      await apiService.deleteSkill(skillId);
      return skillId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete skill');
    }
  }
);

// Note: Backend doesn't support deleting projects - only adding
// export const deleteProject = createAsyncThunk(...) - NOT IMPLEMENTED

// Note: Backend doesn't support deleting achievements - only adding
// export const deleteAchievement = createAsyncThunk(...) - NOT IMPLEMENTED

export const deleteProject = createAsyncThunk(
  'students/deleteProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      await apiService.deleteProject(projectId);
      return projectId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete project');
    }
  }
);

export const deleteAchievement = createAsyncThunk(
  'students/deleteAchievement',
  async (achievementId: string, { rejectWithValue }) => {
    try {
      await apiService.deleteAchievement(achievementId);
      return achievementId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete achievement');
    }
  }
);

const studentsSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchStudentProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateStudentProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateStudentProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateStudentProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addSkill.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.skills.push(action.payload);
        }
      })
      .addCase(addProject.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.projects.push(action.payload);
        }
      })
      .addCase(addAchievement.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.achievements.push(action.payload);
        }
      })
      .addCase(updateSkill.fulfilled, (state, action) => {
        if (state.profile) {
          const index = state.profile.skills.findIndex(skill => skill.id === action.payload.id);
          if (index !== -1) {
            state.profile.skills[index] = action.payload;
          }
        }
      })
      // Note: Backend doesn't support updating projects - only adding
      // .addCase(updateProject.fulfilled, ...) - NOT IMPLEMENTED
      
      // Note: Backend doesn't support updating achievements - only adding
      // .addCase(updateAchievement.fulfilled, ...) - NOT IMPLEMENTED
      
      .addCase(updateProject.fulfilled, (state, action) => {
        if (state.profile) {
          const index = state.profile.projects.findIndex(project => project.id === action.payload.id);
          if (index !== -1) {
            state.profile.projects[index] = action.payload;
          }
        }
      })
      .addCase(updateAchievement.fulfilled, (state, action) => {
        if (state.profile) {
          const index = state.profile.achievements.findIndex(achievement => achievement.id === action.payload.id);
          if (index !== -1) {
            state.profile.achievements[index] = action.payload;
          }
        }
      })
      .addCase(deleteSkill.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.skills = state.profile.skills.filter(skill => skill.id !== action.payload);
        }
      })
      // Note: Backend doesn't support deleting projects - only adding
      // .addCase(deleteProject.fulfilled, ...) - NOT IMPLEMENTED
      
      // Note: Backend doesn't support deleting achievements - only adding
      // .addCase(deleteAchievement.fulfilled, ...) - NOT IMPLEMENTED

      .addCase(deleteProject.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.projects = state.profile.projects.filter(project => project.id !== action.payload);
        }
      })
      
      .addCase(deleteAchievement.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.achievements = state.profile.achievements.filter(achievement => achievement.id !== action.payload);
        }
      });
  },
});

export const { clearError } = studentsSlice.actions;
export default studentsSlice.reducer; 