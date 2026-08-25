import api from './api'

const fileService = {
  getFolders: (groupId) => api.get('/files/folders', { params: { groupId } }),
  createFolder: (data) => api.post('/files/folders', data),
  getFiles: (groupId, folderId) =>
    api.get('/files', { params: { groupId, folderId } }),
  uploadFile: (formData) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteFile: (id) => api.delete(`/files/${id}`),
  getFileMeta: (id) => api.get(`/files/${id}`),
}

export default fileService
