import api from './api'

// Phase 10: persisted calendar events with emoji mood + details
const calendarService = {
  // ?from=YYYY-MM-DD&to=YYYY-MM-DD&category=...
  getEvents: (params) => api.get('/calendar/events', { params }),
  createEvent: (data) => api.post('/calendar/events', data),
  updateEvent: (eventId, data) => api.patch(`/calendar/events/${eventId}`, data),
  deleteEvent: (eventId) => api.delete(`/calendar/events/${eventId}`),
}

export default calendarService
