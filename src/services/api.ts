import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  UserRole,
  UserStatus,
  Job,
  Application,
  Conversation,
  Message,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  ApiResponse,
  PaginatedResponse,
  Student,
  Business,
  Achievement,
  Project,
  Talent
} from '../types';

// Dynamic API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in development mode
  if (__DEV__) {
    // For Android emulator, use 10.0.2.2
    // For iOS simulator, use localhost
    // For physical device, use the machine's local IP
    const platform = require('react-native').Platform.OS;
    if (platform === 'android') {
      // Check if running on emulator
      if (__DEV__) {
        return 'http://10.0.2.2:3001'; // Android emulator
      } else {
        return 'http://35.32.125.176:3001'; // Physical device
      }
    } else if (platform === 'ios') {
      return 'http://localhost:3001'; // iOS simulator
    }
  }
  
  // Production or fallback
  return process.env.API_BASE_URL || 'http://35.32.125.176:3001';
};

const API_BASE_URL = process.env.API_BASE_URL || 'http://35.32.125.176:3001';
console.log('API Service: Using base URL:', API_BASE_URL);

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        const url = (config.baseURL || '') + (config.url || '');
        console.log(`${config.method?.toUpperCase()} Request URL:`, url);
        if (config.method === 'post') {
          console.log('POST Request Data:', config.data);
        }
        
        const token = await AsyncStorage.getItem('authToken');
        console.log('API Interceptor: Retrieved token from AsyncStorage:', token ? 'present' : 'missing');
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('API Interceptor: Added Authorization header:', `Bearer ${token.substring(0, 20)}...`);
        } else {
          console.log('API Interceptor: No token found, request will be unauthenticated');
        }
        
        console.log('API Interceptor: Final headers:', config.headers);
        return config;
      },
      (error) => {
        console.error('API Interceptor: Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => {
        console.log('API Response Interceptor: Success response for:', response.config.url);
        console.log('API Response Interceptor: Response data:', response.data);
        return response;
      },
      async (error) => {
        console.log('API Response Interceptor: Error response for:', error.config?.url);
        console.log('API Response Interceptor: Error status:', error.response?.status);
        console.log('API Response Interceptor: Error data:', error.response?.data);
        console.log('API Response Interceptor: Error message:', error.message);
        
        if (error.response?.status === 401) {
          console.log('API Response Interceptor: 401 Unauthorized - clearing auth data');
          // Token expired or invalid
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth Services
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post('/auth/login', credentials);
    return response.data.data!;
  }

  async registerStudent(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post('/auth/register-student', credentials);
    return response.data.data!;
  }

  async registerBusiness(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post('/auth/register-business', credentials);
    return response.data.data!;
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  }

  // Note: getCurrentUser method removed since /users/{id} endpoint requires admin access
  // Use AsyncStorage.getItem('user') instead

  // Jobs Services
  async getJobs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    experienceLevel?: string;
    location?: string;
  }): Promise<Job[]> {
    const response: AxiosResponse<ApiResponse<Job[]>> = await this.api.get('/jobs', { params });
    return response.data.data!;
  }

  async getJobById(jobId: string): Promise<Job> {
    const response: AxiosResponse<ApiResponse<Job>> = await this.api.get(`/jobs/${jobId}`);
    return response.data.data!;
  }

  async applyForJob(jobId: string, applicationData: {
    coverLetter?: string;
    resume?: string;
  }): Promise<Application> {
    // Get current user from AsyncStorage to get studentId
    const userStr = await AsyncStorage.getItem('user');
    if (!userStr) {
      throw new Error('User not found');
    }
    
    const user = JSON.parse(userStr);
    if (!user.studentId) {
      throw new Error('Student profile not found');
    }
    
    const requestBody = {
      studentId: user.studentId,
      jobId: jobId,
      ...applicationData
    };
    
    const response: AxiosResponse<ApiResponse<Application>> = await this.api.post('/jobs/applications', requestBody);
    return response.data.data!;
  }

  async getMyApplications(): Promise<Application[]> {
    const response: AxiosResponse<ApiResponse<Application[]>> = await this.api.get('/jobs/applications');
    return response.data.data!;
  }

  // Business Services
  async createJob(jobData: {
    title: string;
    description: string;
    type: string;
    experienceLevel: string;
    location: string;
    salary?: string;
    requirements: string[];
    responsibilities: string[];
    benefits: string[];
  }): Promise<Job> {
    const response: AxiosResponse<ApiResponse<Job>> = await this.api.post('/jobs', jobData);
    return response.data.data!;
  }

  async getBusinessJobs(): Promise<Job[]> {
    const response: AxiosResponse<ApiResponse<Job[]>> = await this.api.get('/businesses/jobs');
    return response.data.data!;
  }

  async updateJob(jobId: string, jobData: Partial<Job>): Promise<Job> {
    const response: AxiosResponse<ApiResponse<Job>> = await this.api.put(`/jobs/${jobId}`, jobData);
    return response.data.data!;
  }

  async deleteJob(jobId: string): Promise<void> {
    await this.api.delete(`/jobs/${jobId}`);
  }

  // Student Services
  async getStudentProfile(): Promise<Student> {
    // Get current user from AsyncStorage
    const userStr = await AsyncStorage.getItem('user');
    if (!userStr) {
      throw new Error('User not found');
    }
    
    const user = JSON.parse(userStr);
    if (!user.studentId) {
      throw new Error('Student profile not found');
    }
    
    const response: AxiosResponse<ApiResponse<Student>> = await this.api.get(`/students/${user.studentId}`);
    return response.data.data!;
  }

  async updateStudentProfile(profileData: Partial<Student>): Promise<Student> {
    // Get current user from AsyncStorage
    const userStr = await AsyncStorage.getItem('user');
    if (!userStr) {
      throw new Error('User not found');
    }
    
    const user = JSON.parse(userStr);
    if (!user.studentId) {
      throw new Error('Student profile not found');
    }
    
    const response: AxiosResponse<ApiResponse<Student>> = await this.api.patch(`/students/${user.studentId}`, profileData);
    return response.data.data!;
  }

  async addSkill(skillData: {
    name: string;
    proficiency: string;
    category: string;
  }): Promise<any> {
    try {
      // Get current user from AsyncStorage
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found');
      }
      
      const user = JSON.parse(userStr);
      if (!user.studentId) {
        throw new Error('Student profile not found');
      }

      const response: AxiosResponse<ApiResponse<any>> = await this.api.post(`/students/${user.studentId}/skills`, skillData);
      return response.data.data!;
    } catch (error: any) {
      console.error('Error adding skill:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to add skill');
    }
  }

  async addProject(projectData: {
    title: string;
    description: string;
    technologies: string[];
    githubUrl?: string;
    liveUrl?: string;
  }, files?: any[]): Promise<Project> {
    try {
      // Get current user from AsyncStorage
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found');
      }
      
      const user = JSON.parse(userStr);
      if (!user.studentId) {
        throw new Error('Student profile not found');
      }

      const formData = new FormData();
      formData.append('title', projectData.title);
      formData.append('description', projectData.description);
      formData.append('technologies', JSON.stringify(projectData.technologies));
      if (projectData.githubUrl) formData.append('githubUrl', projectData.githubUrl);
      if (projectData.liveUrl) formData.append('liveUrl', projectData.liveUrl);
      
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append('files', file);
        });
      }
      
      const response: AxiosResponse<ApiResponse<Project>> = await this.api.post(`/students/${user.studentId}/projects`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data!;
    } catch (error: any) {
      console.error('Error adding project:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to add project');
    }
  }

  async addAchievement(achievementData: {
    title: string;
    description: string;
    date: string;
  }, files?: any[]): Promise<Achievement> {
    try {
      // Get current user from AsyncStorage
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found');
      }
      
      const user = JSON.parse(userStr);
      if (!user.studentId) {
        throw new Error('Student profile not found');
      }

      const formData = new FormData();
      formData.append('title', achievementData.title);
      formData.append('description', achievementData.description);
      formData.append('date', achievementData.date);
      
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append('files', file);
        });
      }
      
      const response: AxiosResponse<ApiResponse<Achievement>> = await this.api.post(`/students/${user.studentId}/achievements`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data!;
    } catch (error: any) {
      console.error('Error adding achievement:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to add achievement');
    }
  }

  async updateSkill(skillData: {
    id: string;
    name: string;
    proficiency: string;
    category: string;
  }): Promise<any> {
    try {
      // Get current user from AsyncStorage
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found');
      }
      
      const user = JSON.parse(userStr);
      if (!user.studentId) {
        throw new Error('Student profile not found');
      }

      // Backend only supports updating proficiency, not other fields
      const response: AxiosResponse<ApiResponse<any>> = await this.api.patch(`/students/${user.studentId}/skills/${skillData.id}`, {
        proficiency: skillData.proficiency
      });
      return response.data.data!;
    } catch (error: any) {
      console.error('Error updating skill:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update skill');
    }
  }

  // Note: Backend doesn't support updating projects - only adding
  // async updateProject() - NOT IMPLEMENTED

  // Note: Backend doesn't support updating achievements - only adding  
  // async updateAchievement() - NOT IMPLEMENTED

  async updateProject(projectData: {
    id: string;
    title: string;
    description: string;
    technologies: string[];
    githubUrl?: string;
    liveUrl?: string;
  }): Promise<Project> {
    try {
      // Get current user from AsyncStorage
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found');
      }
      
      const user = JSON.parse(userStr);
      if (!user.studentId) {
        throw new Error('Student profile not found');
      }

      const response: AxiosResponse<ApiResponse<Project>> = await this.api.put(`/students/${user.studentId}/projects/${projectData.id}`, projectData);
      return response.data.data!;
    } catch (error: any) {
      console.error('Error updating project:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update project');
    }
  }

  async updateAchievement(achievementData: {
    id: string;
    title: string;
    description: string;
    date: string;
  }): Promise<Achievement> {
    try {
      // Get current user from AsyncStorage
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found');
      }
      
      const user = JSON.parse(userStr);
      if (!user.studentId) {
        throw new Error('Student profile not found');
      }

      const response: AxiosResponse<ApiResponse<Achievement>> = await this.api.put(`/students/${user.studentId}/achievements/${achievementData.id}`, achievementData);
      return response.data.data!;
    } catch (error: any) {
      console.error('Error updating achievement:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update achievement');
    }
  }

  async deleteSkill(skillId: string): Promise<void> {
    try {
      // Get current user from AsyncStorage
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found');
      }
      
      const user = JSON.parse(userStr);
      if (!user.studentId) {
        throw new Error('Student profile not found');
      }

      await this.api.delete(`/students/${user.studentId}/skills/${skillId}`);
    } catch (error: any) {
      console.error('Error deleting skill:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete skill');
    }
  }

  // Note: Backend doesn't support deleting projects - only adding
  // async deleteProject() - NOT IMPLEMENTED

  // Note: Backend doesn't support deleting achievements - only adding
  // async deleteAchievement() - NOT IMPLEMENTED

  async deleteProject(projectId: string): Promise<void> {
    try {
      // Get current user from AsyncStorage
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found');
      }
      
      const user = JSON.parse(userStr);
      if (!user.studentId) {
        throw new Error('Student profile not found');
      }

      await this.api.delete(`/students/${user.studentId}/projects/${projectId}`);
    } catch (error: any) {
      console.error('Error deleting project:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete project');
    }
  }

  async deleteAchievement(achievementId: string): Promise<void> {
    try {
      // Get current user from AsyncStorage
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found');
      }
      
      const user = JSON.parse(userStr);
      if (!user.studentId) {
        throw new Error('Student profile not found');
      }

      await this.api.delete(`/students/${user.studentId}/achievements/${achievementId}`);
    } catch (error: any) {
      console.error('Error deleting achievement:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete achievement');
    }
  }

  // Business Profile Services
  async getBusinessProfile(): Promise<Business> {
    // Get current user from AsyncStorage
    const userStr = await AsyncStorage.getItem('user');
    if (!userStr) {
      throw new Error('User not found');
    }
    
    const user = JSON.parse(userStr);
    if (!user.businessId) {
      throw new Error('Business profile not found');
    }
    
    const response: AxiosResponse<ApiResponse<Business>> = await this.api.get(`/businesses/${user.businessId}`);
    return response.data.data!;
  }

  async updateBusinessProfile(profileData: Partial<Business>): Promise<Business> {
    // Get current user from AsyncStorage
    const userStr = await AsyncStorage.getItem('user');
    if (!userStr) {
      throw new Error('User not found');
    }
    
    const user = JSON.parse(userStr);
    if (!user.businessId) {
      throw new Error('Business profile not found');
    }
    
    const response: AxiosResponse<ApiResponse<Business>> = await this.api.patch(`/businesses/${user.businessId}`, profileData);
    return response.data.data!;
  }

  // Conversations Services
  async getConversations(): Promise<Conversation[]> {
    try {
      // Get the current user ID from AsyncStorage
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id;
      
      if (!userId) {
        console.error('No user ID found in AsyncStorage');
        return [];
      }
      
      console.log('Getting conversations for user ID:', userId);
      
      let response: AxiosResponse<ApiResponse<Conversation[]>>;
      
      try {
        // Try the primary endpoint first
        response = await this.api.get(`/conversations?userId=${userId}`);
        console.log('Primary endpoint response:', response.data);
      } catch (error: any) {
        console.log('Primary endpoint failed, trying alternative endpoint...');
        // Try alternative endpoint without userId parameter
        try {
          response = await this.api.get('/conversations');
          console.log('Alternative endpoint response:', response.data);
        } catch (altError: any) {
          console.error('Both endpoints failed:', altError);
          throw error; // Throw the original error
        }
      }
      
      console.log('Raw conversations response:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Extracted conversations data:', response.data.data);
      
      if (!response.data.data) {
        console.log('No conversations data in response');
        console.log('Response structure:', Object.keys(response.data));
        
        // Check if conversations are directly in the response
        if (Array.isArray(response.data)) {
          console.log('Conversations found directly in response');
          return response.data;
        }
        
        // Check if there's a different data structure
        if ((response.data as any).conversations && Array.isArray((response.data as any).conversations)) {
          console.log('Conversations found in conversations property');
          return (response.data as any).conversations;
        }
        
        // If no data structure matches, return empty array
        console.log('No valid conversations data found, returning empty array');
        return [];
      }
      
      console.log('Returning conversations:', response.data.data.length);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const response: AxiosResponse<ApiResponse<Message[]>> = await this.api.get(`/conversations/${conversationId}/messages`);
    return response.data.data!;
  }

  async sendMessage(conversationId: string, messageData: { senderId: string, content: string }): Promise<Message> {
    const response: AxiosResponse<ApiResponse<Message>> = await this.api.post(`/conversations/${conversationId}/messages`, messageData);
    return response.data.data!;
  }

  async createConversation(participantIds: string[]): Promise<Conversation> {
    const response: AxiosResponse<ApiResponse<Conversation>> = await this.api.post('/conversations', { participantIds });
    return response.data.data!;
  }

  // File Upload Services
  async uploadFile(file: any, type: 'resume' | 'project' | 'achievement' | 'logo'): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response: AxiosResponse<ApiResponse<{ url: string }>> = await this.api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  }

  // Admin Services
  async getAdminStats(): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/admin/stats');
    return response.data.data!;
  }

  async getAllUsers(): Promise<User[]> {
    // Fetch students
    const studentsResponse: AxiosResponse<ApiResponse<Student[]>> = await this.api.get('/students');
    console.log('Raw students:', studentsResponse.data.data);
    const students = (studentsResponse.data.data || [])
      .filter(s => !!s.userId)
      .map(s => ({
        id: s.userId,
        firstName: s.firstName || (s.user?.email ? s.user.email.split('@')[0] : ''),
        lastName: s.lastName || '',
        email: s.user?.email || '',
        role: UserRole.STUDENT,
        status: s.user?.status || UserStatus.ACTIVE,
        createdAt: s.user?.createdAt || s.createdAt,
        updatedAt: s.user?.updatedAt || s.updatedAt,
        studentId: s.id,
        businessId: undefined,
        student: undefined,
        business: undefined,
      }));

    // Fetch businesses
    const businessesResponse: AxiosResponse<ApiResponse<Business[]>> = await this.api.get('/businesses');
    console.log('Raw businesses:', businessesResponse.data.data);
    const businesses = (businessesResponse.data.data || [])
      .filter(b => !!b.userId)
      .map(b => ({
        id: b.userId,
        firstName: b.businessName,
        lastName: '',
        email: '', // No email available unless you fetch the user separately
        role: UserRole.BUSINESS,
        status: UserStatus.ACTIVE,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        studentId: undefined,
        businessId: b.id,
        student: undefined,
        business: undefined,
      }));

    return [...students, ...businesses];
  }

  // Talent Services
  async getStudentTalents(studentId: string): Promise<Talent[]> {
    const response: AxiosResponse<ApiResponse<Talent[]>> = await this.api.get(`/students/${studentId}/talents`);
    return response.data.data!;
  }

  async getAllTalents(): Promise<Talent[]> {
    const response: AxiosResponse<ApiResponse<Talent[]>> = await this.api.get('/students/talents/all');
    return response.data.data!;
  }

  async addTalent(studentId: string, talentData: {
    title: string;
    category: string;
    description: string;
  }, files?: any[]): Promise<Talent> {
    try {
      const formData = new FormData();
      formData.append('title', talentData.title);
      formData.append('category', talentData.category);
      formData.append('description', talentData.description);
      
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append('files', file);
        });
      }

      console.log('Sending talent data:', {
        studentId,
        talentData,
        filesCount: files?.length || 0
      });

      const response: AxiosResponse<ApiResponse<Talent>> = await this.api.post(`/students/${studentId}/talents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Talent creation response:', response.data);
      return response.data.data!;
    } catch (error: any) {
      console.error('Error creating talent:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create talent');
    }
  }

  async updateTalent(studentId: string, talentId: string, talentData: {
    title: string;
    category: string;
    description: string;
  }, files?: any[]): Promise<Talent> {
    try {
      const formData = new FormData();
      formData.append('title', talentData.title);
      formData.append('category', talentData.category);
      formData.append('description', talentData.description);
      
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append('files', file);
        });
      }

      const response: AxiosResponse<ApiResponse<Talent>> = await this.api.put(`/students/${studentId}/talents/${talentId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data!;
    } catch (error: any) {
      console.error('Error updating talent:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update talent');
    }
  }

  async deleteTalent(studentId: string, talentId: string): Promise<void> {
    try {
      await this.api.delete(`/students/${studentId}/talents/${talentId}`);
    } catch (error: any) {
      console.error('Error deleting talent:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete talent');
    }
  }

  // Social features - Like, Save, Collaboration
  async likeTalent(studentId: string, talentId: string, isLiked: boolean): Promise<any> {
    try {
      const response = await this.api.post(`/students/${studentId}/like-talent`, {
        talentId,
        isLiked,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error liking talent:', error);
      throw new Error(error.response?.data?.message || 'Failed to like talent');
    }
  }

  async saveTalent(studentId: string, talentId: string, isSaved: boolean): Promise<any> {
    try {
      const response = await this.api.post(`/students/${studentId}/save-talent`, {
        talentId,
        isSaved,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error saving talent:', error);
      throw new Error(error.response?.data?.message || 'Failed to save talent');
    }
  }

  async requestCollaboration(studentId: string, recipientId: string, message: string, talentId?: string): Promise<any> {
    try {
      const response = await this.api.post(`/students/${studentId}/collaboration-request`, {
        recipientId,
        talentId,
        message,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error requesting collaboration:', error);
      throw new Error(error.response?.data?.message || 'Failed to request collaboration');
    }
  }

  async getLikedTalents(studentId: string): Promise<any[]> {
    try {
      const response = await this.api.get(`/students/${studentId}/liked-talents`);
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Error fetching liked talents:', error);
      // Return empty array instead of throwing error to prevent app crash
      return [];
    }
  }

  async getSavedTalents(studentId: string): Promise<any[]> {
    try {
      const response = await this.api.get(`/students/${studentId}/saved-talents`);
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Error fetching saved talents:', error);
      // Return empty array instead of throwing error to prevent app crash
      return [];
    }
  }

  async getCollaborationRequests(studentId: string): Promise<any[]> {
    try {
      const response = await this.api.get(`/students/${studentId}/collaboration-requests`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching collaboration requests:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch collaboration requests');
    }
  }

  async respondToCollaboration(collaborationId: string, status: string, message?: string): Promise<any> {
    try {
      const response = await this.api.put(`/students/collaboration/${collaborationId}/respond`, {
        status,
        message,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error responding to collaboration:', error);
      throw new Error(error.response?.data?.message || 'Failed to respond to collaboration');
    }
  }
}

export const apiService = new ApiService();
export default apiService; 