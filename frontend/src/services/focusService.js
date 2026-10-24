import api from './api'

const focusService = {
  recordSession: (data) => api.post('/focus/sessions', data),
  getSessions: (params) => api.get('/focus/sessions', { params }),
  getFocusStats: () => api.get('/focus/stats'),
}

export default focusService
