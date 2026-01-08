// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  studentId?: string;
  businessId?: string;
  createdAt: string;
  updatedAt: string;
  student?: Student;
  business?: Business;
}

export enum UserRole {
  STUDENT = 'student',
  BUSINESS = 'business',
  ADMIN = 'admin'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}

// Student Types
export interface Student {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  major: Major;
  graduationYear: number;
  year: string;
  gpa: number;
  availability: Availability;
  bio: string;
  about: string | null;
  profileViews: number;
  profileImage?: string;
  skills: Skill[];
  projects: Project[];
  achievements: Achievement[];
  resume?: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export enum Major {
  COMPUTER_SCIENCE = 'COMPUTER_SCIENCE',
  ENGINEERING = 'ENGINEERING',
  BUSINESS = 'BUSINESS',
  ARTS = 'ARTS',
  SCIENCE = 'SCIENCE',
  OTHER = 'OTHER'
}

export enum Availability {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  INTERNSHIP = 'INTERNSHIP',
  CONTRACT = 'CONTRACT'
}

export interface Skill {
  id: string;
  name: string;
  proficiency: Proficiency;
  category: string;
}

export enum Proficiency {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  imageUrl?: string;
  certificateUrl?: string;
}

// Talent Types
export interface Talent {
  id: string;
  studentId: string;
  title: string;
  category: string;
  description: string;
  files: string[];
  createdAt: string;
  updatedAt: string;
  student?: Student;
}

// Business Types
export interface Business {
  id: string;
  userId: string;
  businessName: string;
  businessType: BusinessType;
  description: string;
  website?: string;
  location: string;
  industry: string;
  size: string;
  foundedYear: number;
  logo?: string;
  jobs: Job[];
  createdAt: string;
  updatedAt: string;
}

export enum BusinessType {
  STARTUP = 'STARTUP',
  SMALL_BUSINESS = 'SMALL_BUSINESS',
  CORPORATE = 'CORPORATE',
  NON_PROFIT = 'NON_PROFIT',
  GOVERNMENT = 'GOVERNMENT'
}

// Job Types
export interface Job {
  id: string;
  title: string;
  description: string;
  type: JobType;
  experienceLevel: ExperienceLevel;
  location: string;
  salary?: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  businessId: string;
  business: Business;
  applications: Application[];
  createdAt: string;
  updatedAt: string;
}

export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  INTERNSHIP = 'INTERNSHIP',
  CONTRACT = 'CONTRACT'
}

export enum ExperienceLevel {
  ENTRY_LEVEL = 'ENTRY_LEVEL',
  INTERMEDIATE = 'INTERMEDIATE',
  SENIOR = 'SENIOR'
}

export interface Application {
  id: string;
  jobId: string;
  studentId: string;
  status: ApplicationStatus;
  coverLetter?: string;
  resume?: string;
  appliedAt: string;
  student: Student;
  job: Job;
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  INTERVIEWING = 'INTERVIEWING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

// Message Types
export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  createdAt: string;
  sender: User;
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT'
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  user: User;
  student?: Student;
  business?: Business;
}

// Navigation Types
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  PrivacyPolicy: undefined;
  TermsConditions: undefined;
  MainTabs: undefined;
  JobDetail: { job: Job };
  PostJob: undefined;
  StudentProfile: { studentId: string };
  BusinessProfile: { businessId: string };
  TalentDetail: { talent: Talent };
  AddTalent: undefined;
  EditTalent: { talent: Talent };
  Talents: undefined;
  MyTalents: undefined;
  Skills: undefined;
  Projects: undefined;
  Achievements: undefined;
};

export type MainTabParamList = {
  Jobs: undefined;
  Talents: undefined;
  Profile: undefined;
  Messages: undefined;
  Applications: undefined;
}; 