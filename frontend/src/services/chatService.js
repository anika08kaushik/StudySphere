import api from './api'

const chatService = {
  getMessages: (groupId) => api.get(`/messages/${groupId}`),
  sendMessage: (groupId, content) => api.post(`/messages/${groupId}`, { content }),
}

export default chatService
