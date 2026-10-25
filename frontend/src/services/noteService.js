import api from './api'

const noteService = {
  getNotes: (groupId) => api.get(`/groups/${groupId}/notes`),
  getNote: (noteId) => api.get(`/notes/${noteId}`),
  createNote: (groupId, data) => api.post(`/groups/${groupId}/notes`, data),
  updateNote: (noteId, data) => api.put(`/notes/${noteId}`, data),
  createVersion: (noteId, summary) => api.post(`/notes/${noteId}/versions`, { summary }),
  rollbackVersion: (noteId, versionId) => api.post(`/notes/${noteId}/rollback`, { versionId }),
  addComment: (noteId, data) => api.post(`/notes/${noteId}/comments`, data),
  replyComment: (noteId, commentId, data) => api.post(`/notes/${noteId}/comments/${commentId}/reply`, data),
  resolveComment: (noteId, commentId) => api.patch(`/notes/${noteId}/comments/${commentId}/resolve`),
  updatePermissions: (noteId, data) => api.patch(`/notes/${noteId}/permissions`, data),
}

export default noteService
