import api from './api'

const fileService = {
  getFolders: (groupId) =>
    api.get(`/files/folders/group/${groupId}`),

  createFolder: (data) =>
    api.post('/files/folders', data),

  getFiles: (groupId) =>
    api.get(`/files/group/${groupId}`),

  searchFiles: (groupId, query) =>
    api.get('/files/search', { params: { groupId, q: query } }),

  getSearchSuggestions: (groupId, query) =>
    api.get('/files/search/suggestions', { params: { groupId, q: query } }),

  uploadFile: (formData, groupId) =>
    api.post('/files/upload', formData, {
      params: { groupId },
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteFile: (id, groupId) =>
    api.delete(`/files/${id}`, { params: { groupId } }),

  getFileMeta: (id, groupId) =>
    api.get(`/files/${id}`, { params: { groupId }, responseType: 'blob' }),

  downloadFile: (id, groupId) =>
    api.get(`/files/${id}`, {
      params: { groupId, download: true },
      responseType: 'blob',
    }),

  shareFile: (id, groupId, userId) =>
    api.post(`/files/${id}/share`, { userId }, { params: { groupId } }),

  updatePermissions: (id, groupId, allowedActions) =>
    api.post(`/files/${id}/permissions`, { allowedActions }, { params: { groupId } }),

  updateVersion: (id, groupId, comment) =>
    api.post(`/files/${id}/version`, { comment }, { params: { groupId } }),
}

export default fileService