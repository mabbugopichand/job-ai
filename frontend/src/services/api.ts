import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, full_name: string) =>
    api.post('/auth/register', { email, password, full_name }),
};

export const jobs = {
  search: (params: any) => api.get('/jobs/search', { params }),
  getById: (id: number) => api.get(`/jobs/${id}`),
  analyze: (id: number) => api.post(`/jobs/${id}/analyze`),
  analytics: () => api.get('/jobs/analytics'),
};

export const profile = {
  get: () => api.get('/profile'),
  update: (data: any) => api.put('/profile', data),
  parseResume: (resume_text: string) => api.post('/profile/parse-resume', { resume_text }),
  uploadResume: (file: File) => {
    const form = new FormData();
    form.append('resume', file);
    return api.post('/profile/upload-resume', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const applications = {
  getAll: () => api.get('/applications'),
  create: (data: any) => api.post('/applications', data),
  update: (id: number, data: any) => api.put(`/applications/${id}`, data),
  getSaved: () => api.get('/applications/saved'),
  save: (job_id: number, notes?: string) =>
    api.post('/applications/saved', { job_id, notes }),
};

export const alerts = {
  getAll: () => api.get('/alerts'),
  markRead: (id: number) => api.put(`/alerts/${id}/read`),
};

export const admin = {
  getStats: () => api.get('/admin/stats'),
  getSources: () => api.get('/admin/sources'),
};

export default api;
