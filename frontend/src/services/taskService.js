import api from './api'

const taskService = {
  getTasks: (groupId) => (groupId ? api.get(`/tasks/${groupId}`) : api.get('/tasks')),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
}

export default taskService
