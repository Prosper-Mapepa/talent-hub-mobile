import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../../types';
import apiService from '../../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      console.log('Login thunk: Starting login with credentials:', credentials);
      const response = await apiService.login(credentials);
      console.log('Login thunk: API response received:', response);
      
      // The API service already extracts response.data.data, so response is the actual data
      const { access_token, user, student, business } = response;
      console.log('Login thunk: Extracted data:', { access_token: !!access_token, user, student, business });
      
      const userWithIds = {
        ...user,
        studentId: student?.id,
        businessId: business?.id,
      };
      console.log('Login thunk: User with IDs:', userWithIds);
      
      await AsyncStorage.setItem('authToken', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userWithIds));
      console.log('Login thunk: Data stored in AsyncStorage');
      
      return {
        token: access_token,
        user: userWithIds,
        student,
        business,
      };
    } catch (error: any) {
      console.error('Login thunk: Error during login:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Login failed');
    }
  }
);

export const registerStudent = createAsyncThunk(
  'auth/registerStudent',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const response = await apiService.registerStudent(credentials);
      console.log('Student registration response:', response);
      // The API service already extracts response.data.data, so response is the actual data
      const { access_token, user, student } = response;
      await AsyncStorage.setItem('authToken', access_token);
      await AsyncStorage.setItem('user', JSON.stringify({ 
        ...user, 
        studentId: student?.id 
      }));
      
      // If user agreed to terms during registration, automatically accept EULA
      if (credentials.agreedToTerms) {
        try {
          const eula = await apiService.getCurrentEula();
          await apiService.acceptEula(eula.version);
          console.log('EULA accepted automatically after registration');
        } catch (error: any) {
          // Log error but don't fail registration - EulaGuard will show EULA if needed
          console.error('Error auto-accepting EULA after registration:', error);
        }
      }
      
      return { 
        token: access_token, 
        user: { 
          ...user, 
          studentId: student?.id 
        }, 
        student 
      };
    } catch (error: any) {
      console.log('Student registration error:', error.response?.data?.message || error.message);
      // Handle error message - can be string or array
      const errorMessage = error.response?.data?.message;
      const formattedError = Array.isArray(errorMessage) 
        ? errorMessage[0] || errorMessage.join(', ')
        : errorMessage || error.message || 'Registration failed';
      return rejectWithValue(formattedError);
    }
  }
);

export const registerBusiness = createAsyncThunk(
  'auth/registerBusiness',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const response = await apiService.registerBusiness(credentials);
      console.log('Business registration response:', response);
      // The API service already extracts response.data.data, so response is the actual data
      const { access_token, user, business } = response;
      await AsyncStorage.setItem('authToken', access_token);
      await AsyncStorage.setItem('user', JSON.stringify({ 
        ...user, 
        businessId: business?.id 
      }));
      
      // If user agreed to terms during registration, automatically accept EULA
      // Note: This happens AFTER token is saved to AsyncStorage, so it should work
      if (credentials.agreedToTerms) {
        try {
          // Small delay to ensure AsyncStorage write is complete
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const eula = await apiService.getCurrentEula();
          await apiService.acceptEula(eula.version);
          console.log('EULA accepted automatically after registration');
        } catch (error: any) {
          // Log error but don't fail registration - EulaGuard will show EULA if needed
          console.error('Error auto-accepting EULA after registration:', error);
          // If 401, the token might not be available yet - EulaGuard will handle it
          if (error.response?.status === 401) {
            console.log('Token not available for EULA acceptance yet - will be handled by EulaGuard');
          }
        }
      }
      
      return { 
        token: access_token, 
        user: { 
          ...user, 
          businessId: business?.id 
        }, 
        business 
      };
    } catch (error: any) {
      console.log('Business registration error:', error.response?.data?.message || error.message);
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.logout();
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    } catch (error: any) {
      // Even if logout API fails, clear local storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }
  }
);

// Note: getCurrentUser thunk removed since /users/{id} endpoint requires admin access

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { dispatch }) => {
    try {
      console.log('InitializeAuth: Starting authentication initialization');
      const token = await AsyncStorage.getItem('authToken');
      const userStr = await AsyncStorage.getItem('user');
      
      console.log('InitializeAuth: Retrieved from AsyncStorage:', { 
        hasToken: !!token, 
        hasUser: !!userStr,
        userStr: userStr ? 'present' : 'missing'
      });
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        console.log('InitializeAuth: Parsed user:', user);
        dispatch(setAuth({ user, token }));
        console.log('InitializeAuth: Dispatched setAuth');
        // Note: Token validation removed since getCurrentUser requires admin access
      } else {
        console.log('InitializeAuth: No token or user found, skipping authentication');
      }
    } catch (error) {
      console.error('InitializeAuth: Error during initialization:', error);
      // Clear invalid auth data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: User; token: string }>) => {
      console.log('Auth slice: setAuth called with:', action.payload);
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      console.log('Auth slice: setAuth completed, new state:', { 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      });
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        // Don't set isLoading to true during login - prevents navigation reset
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log('Auth slice: Login fulfilled with payload:', action.payload);
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        console.log('Auth slice: State updated, user:', state.user);
      })
      .addCase(login.rejected, (state, action) => {
        // Don't change isLoading on login failure - keeps navigation state
        state.error = action.payload as string;
      })
      // Register
      .addCase(registerStudent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerStudent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerStudent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(registerBusiness.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerBusiness.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerBusiness.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Note: getCurrentUser cases removed since the thunk was removed
      // Initialize Auth
      .addCase(initializeAuth.fulfilled, (state) => {
        state.isLoading = false;
      });
  },
});

export const { setAuth, clearAuth, setError, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer; 