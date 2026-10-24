import api from './api'

const focusService = {
  recordSession: (data) => api.post('/focus/sessions', data),
  getSessions: (params) => api.get('/focus/sessions', { params }),
  getFocusStats: () => api.get('/focus/stats'),
  // Phase 7: persistent timer state (survives page refresh)
  saveTimerState: (data) => api.post('/focus/timer', data),
  getTimerState: (groupId) => api.get('/focus/timer', { params: { groupId } }),
  clearTimerState: (groupId) => api.delete('/focus/timer', { params: { groupId } }),
}

export default focusService
