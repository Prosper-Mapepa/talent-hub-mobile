import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
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
  // Get API base URL from environment variables (via expo-constants)
  const envApiUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  
  // Check if we're in development mode
  if (__DEV__) {
    // For Android emulator, use 10.0.2.2
    // For iOS simulator, use localhost
    // For physical device, use the machine's local IP from env
    const platform = require('react-native').Platform.OS;
    if (platform === 'android') {
      // Check if running on emulator
      if (__DEV__) {
        return 'http://10.0.2.2:3001'; // Android emulator
      } else {
        // Use env variable for physical device, fallback to default
        return envApiUrl || 'http://192.168.0.106:3001';
      }
    } else if (platform === 'ios') {
      return 'http://localhost:3001'; // iOS simulator
    }
  }
  
  // Production or fallback - use env variable
  return envApiUrl || 'http://192.168.0.106:3001';
};

const API_BASE_URL = getApiBaseUrl();
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
    businessId: string;
  }): Promise<Job> {
    const response: AxiosResponse<ApiResponse<Job>> = await this.api.post('/jobs', jobData);
    return response.data.data!;
  }

  async getBusinessJobs(): Promise<Job[]> {
    const response: AxiosResponse<ApiResponse<Job[]>> = await this.api.get('/businesses/jobs');
    return response.data.data!;
  }

  async updateJob(jobId: string, jobData: Partial<Job>): Promise<Job> {
    const response: AxiosResponse<ApiResponse<Job>> = await this.api.patch(`/jobs/${jobId}`, jobData);
    return response.data.data!;
  }

  async deleteJob(jobId: string): Promise<void> {
    await this.api.delete(`/jobs/${jobId}`);
  }

  async updateApplicationStatus(applicationId: string, status: string): Promise<Application> {
    const response: AxiosResponse<ApiResponse<Application>> = await this.api.patch(
      `/jobs/applications/${applicationId}/status`,
      { status }
    );
    return response.data.data!;
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
      
      let response: AxiosResponse<any>;
      
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
      
      // Normalize the response to extract conversations array
      let conversations: Conversation[] = [];
      
      // Case 1: response.data.data is an array (standard ApiResponse structure)
      if (response.data?.data && Array.isArray(response.data.data)) {
        conversations = response.data.data;
      }
      // Case 2: response.data is directly an array
      else if (Array.isArray(response.data)) {
        conversations = response.data;
      }
      // Case 3: response.data.data.data (nested data structure)
      else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        conversations = response.data.data.data;
      }
      // Case 4: response.data.conversations
      else if (response.data?.conversations && Array.isArray(response.data.conversations)) {
        conversations = response.data.conversations;
      }
      // Case 5: Empty response or no conversations
      else {
        console.log('No conversations found in response, returning empty array');
        conversations = [];
      }
      
      console.log(`Returning ${conversations.length} conversations`);
      
      // Ensure all conversations have required fields
      return conversations.map((conv: any) => ({
        id: conv.id,
        participants: Array.isArray(conv.participants) ? conv.participants : [],
        lastMessage: conv.lastMessage || undefined,
        createdAt: conv.createdAt || new Date().toISOString(),
        updatedAt: conv.updatedAt || conv.createdAt || new Date().toISOString(),
      }));
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      // Don't throw error if it's a 401 (unauthorized) - user probably logged out
      if (error?.response?.status === 401) {
        console.log('User not authorized, returning empty conversations');
        return [];
      }
      throw error;
    }
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const response: AxiosResponse<any> = await this.api.get(`/conversations/${conversationId}/messages`);
      
      // Normalize the response to extract messages array
      let messages: Message[] = [];
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        messages = response.data.data;
      } else if (Array.isArray(response.data)) {
        messages = response.data;
      } else if (response.data?.messages && Array.isArray(response.data.messages)) {
        messages = response.data.messages;
      }
      
      return messages;
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      if (error?.response?.status === 401) {
        return [];
      }
      throw error;
    }
  }

  async sendMessage(conversationId: string, messageData: { senderId: string, content: string }): Promise<Message> {
    try {
      // Validate inputs before making the request
      if (!conversationId || conversationId === 'undefined' || !conversationId.trim()) {
        throw new Error('Conversation ID is required');
      }
      if (!messageData.senderId || messageData.senderId === 'undefined' || !messageData.senderId.trim()) {
        throw new Error('Sender ID is required');
      }
      if (!messageData.content || !messageData.content.trim()) {
        throw new Error('Message content is required');
      }
      
      const response: AxiosResponse<any> = await this.api.post(`/conversations/${conversationId.trim()}/messages`, {
        senderId: messageData.senderId.trim(),
        content: messageData.content.trim()
      });
      
      // Normalize the response to extract message
      let message: Message | null = null;
      
      if (response.data?.data) {
        message = response.data.data;
      } else if (response.data && !response.data.data && response.data.id) {
        // Message is directly in response.data
        message = response.data;
      }
      
      if (!message) {
        throw new Error('Invalid response format from send message endpoint');
      }
      
      return message;
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async createConversation(participantIds: string[]): Promise<Conversation> {
    try {
      // Validate inputs before making the request
      if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 2) {
        throw new Error('At least 2 participants are required');
      }
      
      // Validate each ID
      const validIds = participantIds.filter(id => id && typeof id === 'string' && id.trim() !== '' && id !== 'undefined');
      if (validIds.length !== participantIds.length) {
        throw new Error('Invalid participant IDs provided');
      }
      
      const response: AxiosResponse<any> = await this.api.post('/conversations', { 
        participantIds: validIds.map(id => id.trim()) 
      });
      
      console.log('Create conversation raw response:', JSON.stringify(response.data, null, 2));
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Normalize the response to extract conversation
      let conversation: Conversation | null = null;
      
      // Try different response structures (checking from most nested to least nested)
      if (response.data?.data?.data?.id) {
        // Triple nested: response.data.data.data
        conversation = response.data.data.data;
        console.log('Found conversation in response.data.data.data:', conversation?.id);
      } else if (response.data?.data?.id) {
        // Standard ApiResponse structure with nested data
        conversation = response.data.data;
        console.log('Found conversation in response.data.data:', conversation?.id);
      } else if (response.data?.data && typeof response.data.data === 'object' && response.data.data.id) {
        // Data object has id
        conversation = response.data.data;
        console.log('Found conversation in response.data.data (object):', conversation?.id);
      } else if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        // Sometimes data is an array, take the first item
        conversation = response.data.data[0];
        console.log('Found conversation in response.data.data (array):', conversation?.id);
      } else if (response.data?.id) {
        // Conversation is directly in response.data
        conversation = response.data;
        console.log('Found conversation in response.data:', conversation?.id);
      } else if (response.data && typeof response.data === 'object') {
        // Last resort: use response.data directly
        conversation = response.data;
        console.log('Using response.data directly:', conversation?.id);
      }
      
      if (!conversation) {
        console.error('No conversation found in response:', response.data);
        throw new Error(`Invalid response format from create conversation endpoint. No conversation object found. Response: ${JSON.stringify(response.data)}`);
      }
      
      if (!conversation?.id) {
        console.error('Conversation found but missing ID:', conversation);
        console.error('Full response:', JSON.stringify(response.data, null, 2));
        throw new Error(`Invalid response format from create conversation endpoint. Conversation object exists but missing ID. Response: ${JSON.stringify(response.data)}`);
      }
      
      console.log('Successfully parsed conversation ID:', conversation.id);
      
      // Ensure required fields are present
      return {
        id: conversation.id,
        participants: Array.isArray(conversation.participants) ? conversation.participants : [],
        lastMessage: conversation.lastMessage || undefined,
        createdAt: conversation.createdAt || new Date().toISOString(),
        updatedAt: conversation.updatedAt || conversation.createdAt || new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      throw error;
    }
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
    const users: User[] = [];

    // Fetch students (try-catch to handle permission errors)
    try {
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
      users.push(...students);
    } catch (error: any) {
      // If user doesn't have permission to fetch students, skip silently
      if (error?.response?.status === 403 || error?.response?.status === 401) {
        console.log('No permission to fetch students, skipping...');
      } else {
        console.error('Error fetching students:', error);
        // Re-throw non-permission errors
        throw error;
      }
    }

    // Fetch businesses (try-catch to handle permission errors)
    try {
    const businessesResponse: AxiosResponse<ApiResponse<Business[]>> = await this.api.get('/businesses');
    console.log('Raw businesses:', businessesResponse.data.data);
    const businesses = (businessesResponse.data.data || [])
      .filter(b => !!b.userId)
      .map(b => ({
        id: b.userId,
        firstName: b.businessName,
        lastName: '',
          email: b.user?.email || b.email || '',
        role: UserRole.BUSINESS,
        status: UserStatus.ACTIVE,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        studentId: undefined,
        businessId: b.id,
        student: undefined,
        business: undefined,
      }));
      users.push(...businesses);
    } catch (error: any) {
      // If user doesn't have permission to fetch businesses, skip silently
      if (error?.response?.status === 403 || error?.response?.status === 401) {
        console.log('No permission to fetch businesses, skipping...');
      } else {
        console.error('Error fetching businesses:', error);
        // Re-throw non-permission errors
        throw error;
      }
    }

    return users;
  }

  // Talent Services
  async getStudentTalents(studentId: string): Promise<Talent[]> {
    const response: AxiosResponse<ApiResponse<Talent[]>> = await this.api.get(`/students/${studentId}/talents`);
    return response.data.data!;
  }

  async getAllTalents(): Promise<Talent[]> {
    try {
      console.log('Fetching all talents from /students/talents/all');
      const response: AxiosResponse<any> = await this.api.get('/students/talents/all');
      
      console.log('getAllTalents raw response:', JSON.stringify(response.data, null, 2));
      console.log('Response status:', response.status);
      
      // Handle different response structures
      let talents: Talent[] = [];
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        talents = response.data.data;
        console.log(`Found ${talents.length} talents in response.data.data`);
      } else if (Array.isArray(response.data)) {
        talents = response.data;
        console.log(`Found ${talents.length} talents directly in response.data`);
      } else if (response.data?.data && !Array.isArray(response.data.data)) {
        // Data might be an object, try to extract
        console.warn('Response data.data is not an array:', response.data.data);
        talents = [];
      } else {
        console.warn('Unexpected response structure:', response.data);
        talents = [];
      }
      
      console.log(`Returning ${talents.length} talents`);
      return talents;
    } catch (error: any) {
      console.error('Error fetching all talents:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
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
          // Determine MIME type from file extension or type
          let mimeType = 'application/octet-stream';
          const fileName = file.name || '';
          const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
          
          if (file.type === 'video') {
            mimeType = fileExtension === 'mp4' ? 'video/mp4' : 
                      fileExtension === 'mov' ? 'video/quicktime' :
                      fileExtension === 'avi' ? 'video/x-msvideo' :
                      'video/mp4';
          } else if (file.type === 'document') {
            mimeType = fileExtension === 'pdf' ? 'application/pdf' :
                      fileExtension === 'doc' ? 'application/msword' :
                      fileExtension === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                      fileExtension === 'txt' ? 'text/plain' :
                      'application/octet-stream';
          } else if (file.type === 'image') {
            mimeType = fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'image/jpeg' :
                      fileExtension === 'png' ? 'image/png' :
                      fileExtension === 'gif' ? 'image/gif' :
                      fileExtension === 'webp' ? 'image/webp' :
                      'image/jpeg';
          }
          
          // React Native FormData requires specific format
          const fileData: any = {
            uri: file.uri,
            type: mimeType,
            name: file.name || `file_${index}.${fileExtension || (file.type === 'video' ? 'mp4' : file.type === 'document' ? 'pdf' : 'jpg')}`,
          };
          formData.append('files', fileData as any);
        });
      }

      console.log('Sending talent data:', {
        studentId,
        talentData,
        filesCount: files?.length || 0,
        files: files?.map(f => ({ uri: f.uri, type: f.type, name: f.name }))
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

  // Follow/Unfollow Services
  async followUser(followerId: string, followingId: string): Promise<any> {
    try {
      // Try different endpoint patterns
      let response;
      try {
        response = await this.api.post('/users/follow', {
          followerId,
          followingId,
        });
      } catch (firstError: any) {
        // If /users/follow doesn't exist, try alternative endpoints
        if (firstError.response?.status === 404) {
          try {
            // Try /follow endpoint
            response = await this.api.post('/follow', {
              followerId,
              followingId,
            });
          } catch (secondError: any) {
            // Try /users/:userId/follow endpoint
            try {
              response = await this.api.post(`/users/${followerId}/follow`, {
                followingId,
              });
            } catch (thirdError: any) {
              // All endpoints failed, throw original error with helpful message
              throw new Error('Follow feature is not available yet. The backend endpoint needs to be implemented.');
            }
          }
        } else {
          throw firstError;
        }
      }
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('Error following user:', error);
      // Extract the actual error message from the backend
      const errorMessage = error.response?.data?.message || error.message || 'Failed to follow user';
      throw new Error(errorMessage);
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<any> {
    try {
      // Try different endpoint patterns
      let response;
      try {
        response = await this.api.post('/users/unfollow', {
          followerId,
          followingId,
        });
      } catch (firstError: any) {
        // If /users/unfollow doesn't exist, try alternative endpoints
        if (firstError.response?.status === 404) {
          try {
            // Try /unfollow endpoint
            response = await this.api.post('/unfollow', {
              followerId,
              followingId,
            });
          } catch (secondError: any) {
            // Try /users/:userId/unfollow endpoint
            try {
              response = await this.api.post(`/users/${followerId}/unfollow`, {
                followingId,
              });
            } catch (thirdError: any) {
              // All endpoints failed, throw original error with helpful message
              throw new Error('Unfollow feature is not available yet. The backend endpoint needs to be implemented.');
            }
          }
        } else {
          throw firstError;
        }
      }
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      // Extract the actual error message from the backend
      const errorMessage = error.response?.data?.message || error.message || 'Failed to unfollow user';
      throw new Error(errorMessage);
    }
  }

  async getFollowers(userId: string): Promise<User[]> {
    try {
      const response = await this.api.get(`/users/${userId}/followers`);
      return response.data?.data || response.data || [];
    } catch (error: any) {
      console.error('Error fetching followers:', error);
      return [];
    }
  }

  async getFollowing(userId: string): Promise<User[]> {
    try {
      const response = await this.api.get(`/users/${userId}/following`);
      return response.data?.data || response.data || [];
    } catch (error: any) {
      console.error('Error fetching following:', error);
      return [];
    }
  }

  async checkFollowStatus(followerId: string, followingId: string): Promise<boolean> {
    try {
      const response = await this.api.get(`/users/${followerId}/following/${followingId}`);
      return response.data?.data?.isFollowing || response.data?.isFollowing || false;
    } catch (error: any) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService; 