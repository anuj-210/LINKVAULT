import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = async ({ email, password, name }) => {
  const res = await api.post('/auth/register', { email, password, name });
  return res.data;
};

export const loginUser = async ({ email, password }) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const logoutUser = async () => {
  const res = await api.post('/auth/logout');
  return res.data;
};

export const getMyShares = async () => {
  const res = await api.get('/my/shares');
  return res.data;
};

export const uploadText = async (data) => {
  const res = await api.post('/upload/text', data);
  return res.data;
};

export const uploadFile = async (file, metadata) => {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata.password) formData.append('password', metadata.password);
  if (metadata.oneTime) formData.append('oneTime', metadata.oneTime);
  if (metadata.maxViews) formData.append('maxViews', metadata.maxViews);
  if (metadata.expiresAt) formData.append('expiresAt', metadata.expiresAt);
  if (metadata.ownerOnly) formData.append('ownerOnly', metadata.ownerOnly);
  
  const res = await api.post('/upload/file', formData);
  return res.data;
};

export const checkShare = async (shareId) => {
  const res = await api.get(`/share/${shareId}/check`);
  return res.data;
};

export const getShare = async (shareId, password) => {
  const res = await api.post(`/share/${shareId}`, { password });
  return res.data;
};

export const deleteShare = async (shareId, deleteToken) => {
  const config = deleteToken
    ? { headers: { 'x-delete-token': deleteToken } }
    : undefined;
  const res = await api.delete(`/share/${shareId}`, config);
  return res.data;
};
