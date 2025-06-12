import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const api = axios.create({
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

// Team Status
export enum TeamStatus {
  ACTIVE = 'active',
  FINISHED = 'finished'
}

// Pusher Events
export enum EVENTS {
  TIMER_UPDATE = 'timer-update',
  QUEUE_UPDATE = 'queue-update',
  EVALUATION_TOGGLE = 'evaluation-toggle',
  PRESENTATION_START = 'presentation-start',
  PRESENTATION_END = 'presentation-end',
  CURRENT_TEAM_UPDATE = 'current-team-update',
  EVALUATION_FORM_UPDATE = 'evaluation-form-update',
  TEAM_STATUS_UPDATE = 'team-status-update'
}

export interface Class {
  _id: string;
  name: string;
  semester: string;
  students: string[];
}

// Auth API
const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  },

  teacherLogin: async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/teacher/login', { email, password });
    return response.data;
  },

  peerLogin: async (usn: string, projectId: string) => {
    const response = await api.post<LoginResponse>('/auth/peer/login', { usn, projectId });
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
};

// Project API
const projectAPI = {
  getProjects: async () => {
    const response = await api.get<Project[]>('/projects/public/projects');
    return response.data;
  },
  createProject: async (data: Partial<Project>) => {
    const response = await api.post<Project>('/projects', data);
    return response.data;
  },
  getProject: async (id: string) => {
    const response = await api.get<Project>(`/projects/public/projects/${id}`);
    return response.data;
  },
  updateProject: async (id: string, data: Partial<Project>) => {
    const response = await api.put<Project>(`/projects/${id}`, data);
    return response.data;
  },
  deleteProject: async (id: string) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },
  updateStatus: async (id: string, status: 'active' | 'completed' | 'archived') => {
    const response = await api.put<Project>(`/projects/${id}/status`, { status });
    return response.data;
  }
};

// Class API
const classAPI = {
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
  getTeachers: async () => {
    const response = await api.get<Teacher[]>('/auth/public/teachers');
    return response.data;
  },
};

// Team API
const teamAPI = {
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

  updateStatus: async (teamId: string, status: TeamStatus) => {
    const response = await api.put(`/teams/${teamId}/status`, { status });
    return response.data;
  },

  getByStatus: async (projectId: string, status: TeamStatus) => {
    const response = await api.get(`/teams/project/${projectId}?status=${status}`);
    return response.data;
  },
};

// Evaluation Form API
const evaluationFormAPI = {
  create: (data: {
    title: string;
    description: string;
    fields: {
      type: 'rating' | 'text';
      label: string;
      required: boolean;
    }[];
    evaluationTime: number;
    project: string;
  }) => api.post('/evaluation-forms', data),
  
  getByProject: async (projectId: string) => {
    const response = await api.get(`/evaluation-forms/project/${projectId}`);
    return response;
  },
  
  update: (formId: string, data: {
    title: string;
    description: string;
    fields: {
      type: 'rating' | 'text';
      label: string;
      required: boolean;
    }[];
  }) => api.put(`/evaluation-forms/${formId}`, data),
  
  delete: (formId: string) => 
    api.delete(`/evaluation-forms/${formId}`),

  submit: (projectId: string, data: { responses: Record<string, string | number>; teamId: string }) =>
    api.post(`/evaluation-forms/${projectId}/submit`, data)
};

// Export all APIs
export {
  authAPI,
  projectAPI,
  classAPI,
  teamAPI,
  evaluationFormAPI
};

// Also export the api instance as default
export default api;