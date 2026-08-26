import crypto from 'node:crypto'

const generateStorageKey = (groupId, originalName) => {
  const uniqueId = crypto.randomUUID()

  const safeName = originalName
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')

  return `groups/${groupId}/files/${uniqueId}-${safeName}`
}

export default generateStorageKey