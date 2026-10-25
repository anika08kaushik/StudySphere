import api from './api'

const activityService = {
  getActivities: (groupId) => api.get('/activities', { params: groupId ? { groupId } : {} }),
  createActivity: (data) => api.post('/activities', data),
}

export default activityService
