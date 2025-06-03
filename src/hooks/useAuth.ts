import { useState, useEffect } from 'react';
import { authAPI } from '../lib/api';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'lab_instructor' | 'teacher' | 'peer';
  usn?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const user = await authAPI.getCurrentUser();
      setUser(user);
    } catch (err) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, role: string) => {
    try {
      let response;
      if (role === 'teacher') {
        response = await authAPI.teacherLogin(email, password);
      } else if (role === 'peer') {
        response = await authAPI.peerLogin(email, password);
      } else {
        response = await authAPI.login(email, password);
      }

      localStorage.setItem('token', response.token);
      setUser(response.user);
      return response.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  const createTeacher = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      await authAPI.createTeacher(email, password, name);
    } catch (err: any) {
      setError(err.message || 'Failed to create teacher account');
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    createTeacher
  };
}