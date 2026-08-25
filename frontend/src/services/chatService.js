import api from './api'

const chatService = {
  getMessages: (groupId) => api.get(`/groups/${groupId}/messages`),
  sendMessage: (groupId, content) => api.post(`/groups/${groupId}/messages`, { content }),
}

export default chatService
