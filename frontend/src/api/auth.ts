import { apiClient } from './client';
import { getBaseUrl } from '../utils/resolver';

const isDevOrPreview = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' || 
                       window.location.hostname.includes('ais-dev') || 
                       window.location.hostname.includes('ais-pre') || 
                       window.location.hostname.includes('run.app');

const API_BASE_URL = import.meta.env.VITE_API_URL || (isDevOrPreview ? '/api' : `${getBaseUrl()}/api`);
export interface Token {
  access_token: string;
  token_type: string;
}

export interface Role {
  id?: number;
  name: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  roles: Role[];
}

export const authApi = {
  async login(formData: FormData): Promise<Token> {
    const response = await fetch(`${API_BASE_URL}/login/access-token`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }
    
    return response.json();
  },
  
  async customerLogin(data: { phone: string; password: string }): Promise<Token> {
    const response = await fetch(`${API_BASE_URL}/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      let msg = 'Login failed';
      if (typeof err.detail === 'string') {
        msg = err.detail;
      } else if (Array.isArray(err.detail) && err.detail.length > 0) {
        msg = err.detail.map((e: any) => e.msg || e.detail || 'Xatolik').join(', ');
      }
      throw new Error(msg);
    }
    return response.json();
  },

  async customerRegister(data: { full_name: string; phone: string; password: string; password_confirm: string }): Promise<Token> {
    const response = await fetch(`${API_BASE_URL}/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      let msg = 'Registration failed';
      if (typeof err.detail === 'string') {
        msg = err.detail;
      } else if (Array.isArray(err.detail) && err.detail.length > 0) {
        msg = err.detail.map((e: any) => e.msg || e.detail || 'Xatolik').join(', ');
      }
      throw new Error(msg);
    }
    return response.json();
  },
  
  async getMe(): Promise<User> {
    const token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') {
      throw new Error('Unauthorized');
    }
    const response = await fetch(`${API_BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Unauthorized');
    }
    
    return response.json();
  },
};
