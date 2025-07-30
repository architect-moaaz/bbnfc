import axios from 'axios';
import { ApiResponse, User, Profile, Card, Template, Analytics, Subscription } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't override Content-Type for FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (name: string, email: string, password: string): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<string>> => {
    const response = await api.post('/auth/forgotpassword', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string): Promise<ApiResponse<string>> => {
    const response = await api.put(`/auth/resetpassword/${token}`, { password });
    return response.data;
  },

  verifyEmail: async (token: string): Promise<ApiResponse<string>> => {
    const response = await api.get(`/auth/verifyemail/${token}`);
    return response.data;
  },

  updatePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<string>> => {
    const response = await api.put('/auth/updatepassword', { currentPassword, newPassword });
    return response.data;
  },
};

// Users API
export const usersAPI = {
  updateProfile: async (userData: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },

  deleteAccount: async (): Promise<ApiResponse<string>> => {
    const response = await api.delete('/users/account');
    return response.data;
  },
};

// Profiles API
export const profilesAPI = {
  getProfiles: async (): Promise<ApiResponse<Profile[]>> => {
    const response = await api.get('/profiles');
    return response.data;
  },

  getProfile: async (id: string): Promise<ApiResponse<Profile>> => {
    const response = await api.get(`/profiles/${id}`);
    return response.data;
  },

  createProfile: async (profileData: Partial<Profile>): Promise<ApiResponse<Profile>> => {
    const response = await api.post('/profiles', profileData);
    return response.data;
  },

  updateProfile: async (id: string, profileData: Partial<Profile>): Promise<ApiResponse<Profile>> => {
    const response = await api.put(`/profiles/${id}`, profileData);
    return response.data;
  },

  deleteProfile: async (id: string): Promise<ApiResponse<string>> => {
    const response = await api.delete(`/profiles/${id}`);
    return response.data;
  },

  getProfileAnalytics: async (id: string, timeRange?: string): Promise<ApiResponse<Analytics>> => {
    const response = await api.get(`/profiles/${id}/analytics`, {
      params: { timeRange }
    });
    return response.data;
  },
};


// Cards API
export const cardsAPI = {
  getCards: async (): Promise<ApiResponse<Card[]>> => {
    const response = await api.get('/cards');
    return response.data;
  },

  createCard: async (cardData: Partial<Card>): Promise<ApiResponse<Card>> => {
    const response = await api.post('/cards', cardData);
    return response.data;
  },

  updateCard: async (id: string, cardData: Partial<Card>): Promise<ApiResponse<Card>> => {
    const response = await api.put(`/cards/${id}`, cardData);
    return response.data;
  },

  deleteCard: async (id: string): Promise<ApiResponse<string>> => {
    const response = await api.delete(`/cards/${id}`);
    return response.data;
  },

  getCardAnalytics: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/cards/${id}/analytics`);
    return response.data;
  },
};

// Templates API
export const templatesAPI = {
  getTemplates: async (params?: { category?: string; isPremium?: boolean }): Promise<ApiResponse<Template[]>> => {
    const response = await api.get('/templates', { params });
    return response.data;
  },

  getTemplate: async (id: string): Promise<ApiResponse<Template>> => {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },

  createTemplate: async (templateData: Partial<Template>): Promise<ApiResponse<Template>> => {
    const response = await api.post('/templates', templateData);
    return response.data;
  },

  updateTemplate: async (id: string, templateData: Partial<Template>): Promise<ApiResponse<Template>> => {
    const response = await api.put(`/templates/${id}`, templateData);
    return response.data;
  },

  deleteTemplate: async (id: string): Promise<ApiResponse<string>> => {
    const response = await api.delete(`/templates/${id}`);
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getDashboard: async (timeRange?: string): Promise<ApiResponse<Analytics>> => {
    const response = await api.get('/analytics/dashboard', {
      params: { timeRange }
    });
    return response.data;
  },
};

// Subscriptions API
export const subscriptionsAPI = {
  getPlans: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },

  getCurrentSubscription: async (): Promise<ApiResponse<Subscription>> => {
    const response = await api.get('/subscriptions/current');
    return response.data;
  },

  upgradeSubscription: async (plan: string): Promise<ApiResponse<Subscription>> => {
    const response = await api.post('/subscriptions/upgrade', { plan });
    return response.data;
  },

  cancelSubscription: async (): Promise<ApiResponse<string>> => {
    const response = await api.post('/subscriptions/cancel');
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getDashboard: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getUsers: async (page?: number, limit?: number): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/admin/users', {
      params: { page, limit }
    });
    return response.data;
  },

  getProfiles: async (page?: number, limit?: number): Promise<ApiResponse<Profile[]>> => {
    const response = await api.get('/admin/profiles', {
      params: { page, limit }
    });
    return response.data;
  },

  updateUser: async (id: string, userData: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string): Promise<ApiResponse<string>> => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Profile management
  createProfileForUser: async (userId: string, profileData: Partial<Profile>): Promise<ApiResponse<Profile>> => {
    const response = await api.post('/admin/profiles', { ...profileData, user: userId });
    return response.data;
  },

  updateProfile: async (id: string, profileData: Partial<Profile>): Promise<ApiResponse<Profile>> => {
    const response = await api.put(`/admin/profiles/${id}`, profileData);
    return response.data;
  },

  deleteProfile: async (id: string): Promise<ApiResponse<string>> => {
    const response = await api.delete(`/admin/profiles/${id}`);
    return response.data;
  },

  // Card design templates
  saveCardTemplate: async (templateData: any): Promise<ApiResponse<any>> => {
    const response = await api.post('/admin/templates', templateData);
    return response.data;
  },

  getCardTemplates: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/admin/templates');
    return response.data;
  },

  applyTemplateToProfile: async (profileId: string, templateId: string): Promise<ApiResponse<Profile>> => {
    const response = await api.put(`/admin/profiles/${profileId}/template`, { templateId });
    return response.data;
  },

  // Analytics
  getSystemAnalytics: async (timeRange?: string): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/analytics', {
      params: { timeRange }
    });
    return response.data;
  },

  getUserAnalytics: async (userId: string, timeRange?: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/admin/users/${userId}/analytics`, {
      params: { timeRange }
    });
    return response.data;
  },

  // Bulk operations
  bulkUpdateProfiles: async (profileIds: string[], updates: Partial<Profile>): Promise<ApiResponse<Profile[]>> => {
    const response = await api.put('/admin/profiles/bulk', { profileIds, updates });
    return response.data;
  },

  bulkDeleteProfiles: async (profileIds: string[]): Promise<ApiResponse<string>> => {
    const response = await api.delete('/admin/profiles/bulk', { data: { profileIds } });
    return response.data;
  },

  // Direct profile URL management
  generateDirectUrl: async (profileId: string, customSlug?: string): Promise<ApiResponse<{ url: string; qrCode: string }>> => {
    const response = await api.post(`/admin/profiles/${profileId}/direct-url`, { customSlug });
    return response.data;
  },

  getProfileBySlug: async (slug: string): Promise<ApiResponse<Profile>> => {
    const response = await api.get(`/admin/profiles/slug/${slug}`);
    return response.data;
  },
};

// Create a separate axios instance for public API (no auth required)
const PUBLIC_BASE_URL = process.env.REACT_APP_API_URL 
  ? process.env.REACT_APP_API_URL.replace('/api', '') 
  : 'http://localhost:5000';

const publicAxios = axios.create({
  baseURL: PUBLIC_BASE_URL, // Direct to server root for public routes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Public API (no authentication required)
export const publicAPI = {
  getPublicProfile: async (profileId: string): Promise<ApiResponse<Profile>> => {
    const response = await publicAxios.get(`/p/${profileId}`);
    return response.data;
  },

  recordAnalytics: async (analyticsData: {
    type: string;
    profileId: string;
    timestamp: string;
    userAgent: string;
    referrer: string;
  }): Promise<ApiResponse<string>> => {
    const response = await publicAxios.post('/analytics', analyticsData);
    return response.data;
  },

  downloadVCard: async (profileId: string): Promise<Blob> => {
    const response = await publicAxios.get(`/p/${profileId}/vcard`, {
      responseType: 'blob'
    });
    return response.data;
  },
};

// Upload API
export const uploadAPI = {
  uploadProfilePhoto: async (file: File): Promise<ApiResponse<{ imageUrl: string }>> => {
    const formData = new FormData();
    formData.append('photo', file);
    
    // Don't set Content-Type header - let axios set it with boundary
    const response = await api.post('/upload/profile-photo', formData);
    return response.data;
  },

  uploadCompanyLogo: async (file: File): Promise<ApiResponse<{ imageUrl: string }>> => {
    const formData = new FormData();
    formData.append('logo', file);
    
    // Don't set Content-Type header - let axios set it with boundary
    const response = await api.post('/upload/company-logo', formData);
    return response.data;
  },
};

export default api;