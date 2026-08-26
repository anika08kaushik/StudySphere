import api from './api'

const fileService = {
  getFolders: (groupId) =>
    api.get(`/files/folders/group/${groupId}`),

  createFolder: (data) =>
    api.post('/files/folders', data),

  getFiles: (groupId) =>
    api.get(`/files/group/${groupId}`),

  uploadFile: (formData) =>
    api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  deleteFile: (id) =>
    api.delete(`/files/${id}`),

  getFileMeta: (id) =>
    api.get(`/files/${id}`, { responseType: 'blob' }),
}

export default fileService