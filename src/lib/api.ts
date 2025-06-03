import axios from 'axios';

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
interface LoginResponse {
  token: string;
  user: {
    _id: string;
    email: string;
    role: 'lab_instructor' | 'teacher' | 'peer';
    name: string;
  };
}

interface Teacher {
  _id: string;
  email: string;
  name: string;
  department?: string;
}

interface Project {
  _id: string;
  name: string;
  class: string;
  status: 'active' | 'completed';
  createdAt: Date;
}

interface Class {
  _id: string;
  name: string;
  semester: string;
  students: string[];
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  },

  teacherLogin: async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/teacher/login', { email, password });
    return response.data;
  },

  peerLogin: async (usn: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/peer/login', { usn, password });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get<LoginResponse['user']>('/auth/me');
    return response.data;
  },

  createTeacher: async (email: string, password: string, name: string) => {
    const response = await api.post<Teacher>('/auth/create-teacher', { email, password, name });
    return response.data;
  },

  getTeachers: async () => {
    const response = await api.get<Teacher[]>('/auth/teachers');
    return response.data;
  },

  deleteTeacher: async (id: string) => {
    const response = await api.delete(`/auth/teacher/${id}`);
    return response.data;
  },

  // ... other auth methods
};

// Project API
export const projectAPI = {
  getProjects: async () => {
    const response = await api.get<Project[]>('/projects');
    return response.data;
  },
  createProject: async (data: Omit<Project, '_id' | 'createdAt'>) => {
    const response = await api.post<Project>('/projects', data);
    return response.data;
  },
  getProject: async (projectId: string) => {
    const response = await api.get<Project>(`/projects/${projectId}`);
    return response.data;
  },
};

// Class API
export const classAPI = {
  getClasses: async () => {
    const response = await api.get<Class[]>('/classes');
    return response.data;
  },
  getClass: async (className: string) => {
    const response = await api.get<Class>(`/classes/${className}`);
    return response.data;
  },
  createClass: async (data: Omit<Class, '_id'>) => {
    const response = await api.post<Class>('/classes', data);
    return response.data;
  },
  deleteClass: async (id: string) => {
    const response = await api.delete(`/classes/${id}`);
    return response.data;
  },
};

// Team API
export const teamAPI = {
  create: async (data: any) => {
    const response = await api.post('/teams', data);
    return response.data;
  },
  getByClass: async (classId: string) => {
    const response = await api.get(`/teams/class/${classId}`);
    return response.data;
  },

  // ... other team methods
};

// Interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;