import api from './axiosInstance';

export const generatePlan   = (data) => api.post('/planner/generate', data);
export const getSessions     = ()     => api.get('/planner');
export const markComplete    = (id)   => api.put(`/sessions/${id}/complete`);
export const markMissed      = (id)   => api.put(`/sessions/${id}/miss`);
export const deleteSession   = (id)   => api.delete(`/sessions/${id}`);
