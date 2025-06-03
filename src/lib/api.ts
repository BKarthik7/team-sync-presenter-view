import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth interceptor conditionally for protected routes only
api.interceptors.request.use((config) => {
  // Only add auth header for protected routes
  if (!config.url?.includes('/public/')) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Types
export interface LoginResponse {
  token: string;
  user: {
    _id: string;
    email: string;
    role: 'lab_instructor' | 'teacher' | 'peer';
    name: string;
  };
}

export interface Teacher {
  _id: string;
  email: string;
  name: string;
  department?: string;
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  teamSize: number;
  class: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  teams?: string[];
}

export interface Class {
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
  createProject: async (data: Partial<Project>) => {
    const response = await api.post<Project>('/projects', data);
    return response.data;
  },
  getProject: async (projectId: string) => {
    const response = await api.get<Project>(`/projects/${projectId}`);
    return response.data;
  },
  updateStatus: async (id: string, status: 'active' | 'completed' | 'archived') => {
    const response = await api.patch<Project>(`/projects/${id}/status`, { status });
    return response.data;
  },
};

// Class API
export const classAPI = {
  getClasses: async () => {
    const response = await api.get<Class[]>('/classes');
    return response.data;
  },
  getClass: async (classId: string) => {
    const response = await api.get<Class>(`/classes/${classId}`);
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
  updateTeacher: async (classId: string, teacherId: string) => {
    const response = await api.put<Class>(`/classes/${classId}/teacher`, { teacherId });
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
  getByProject: async (projectId: string) => {
    const response = await api.get(`/teams/project/${projectId}`);
    return response.data;
  },
  delete: async (teamId: string) => {
    const response = await api.delete(`/teams/${teamId}`);
    return response.data;
  },
};

export default api;