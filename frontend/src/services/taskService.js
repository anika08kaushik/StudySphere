import api from './api'

const taskService = {
  getTasks: (groupId) => api.get('/tasks', { params: { groupId } }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
}

export default taskService
