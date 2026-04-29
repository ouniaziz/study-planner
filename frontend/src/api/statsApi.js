import api from './axiosInstance';

export const getStats = () => api.get('/stats');
