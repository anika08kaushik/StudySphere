import api from './api'

// Phase 9: Explore People - chat requests and persisted private conversations
const privateChatService = {
  // Send (or auto-match) a private chat request
  sendRequest: (toUserId, groupId = null) =>
    api.post('/private-chat/requests', { toUserId, groupId }),

  // Incoming pending, outgoing pending and accepted partners
  getRequests: () => api.get('/private-chat/requests'),

  // accept | decline (recipient only)
  respondToRequest: (requestId, action) =>
    api.post(`/private-chat/requests/${requestId}/respond`, { action }),

  // Conversation history for an accepted partner
  getMessages: (peerId) => api.get(`/private-chat/dm/${peerId}/messages`),

  // Send a private message
  sendMessage: (peerId, content) =>
    api.post(`/private-chat/dm/${peerId}/messages`, { content }),
}

export default privateChatService
