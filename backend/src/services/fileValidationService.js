const allowedMimeTypes = new Set([
  'application/pdf',

  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  'image/jpeg',
  'image/png',
  'image/webp',

  'application/zip',

  'video/mp4',
  'video/webm',
])

const validateFile = (file) => {
  if (!file) {
    throw new Error('No file provided')
  }

  if (!allowedMimeTypes.has(file.mimetype)) {
    throw new Error(`File type not supported: ${file.mimetype}`)
  }

  return true
}

export default validateFile