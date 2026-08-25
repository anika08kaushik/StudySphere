import api from './api'

const groupService = {
  getGroups: () => api.get('/groups'),
  getGroup: (id) => api.get(`/groups/${id}`),
  createGroup: (data) => api.post('/groups', data),
  deleteGroup: (id) => api.delete(`/groups/${id}`),
  getMembers: (groupId) => api.get(`/groups/${groupId}/members`),
  joinGroup: (groupId) => api.post(`/groups/${groupId}/join`),
  leaveGroup: (groupId) => api.post(`/groups/${groupId}/leave`),
}

export default groupService
