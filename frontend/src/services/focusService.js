import api from './api'

const focusService = {
  getActive: (groupId) => api.get(`/focus/${groupId}/active`),
  startSession: (groupId) => api.post(`/focus/${groupId}/start`),
  stopSession: (sessionId) => api.put(`/focus/${sessionId}/stop`),
  getHistory: (groupId) => api.get(`/focus/${groupId}/history`),
}

export default focusService
