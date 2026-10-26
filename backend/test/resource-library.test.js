import assert from 'node:assert/strict'
import http from 'node:http'
import express from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import test from 'node:test'
import authorizeGroup from '../src/middleware/authzMiddleware.js'
import AuditLog from '../src/models/AuditLog.js'
import File from '../src/models/file.js'
import Folder from '../src/models/Folder.js'
import Membership from '../src/models/Membership.js'
import Notification from '../src/models/Notification.js'
import StudyGroup from '../src/models/StudyGroup.js'
import User from '../src/models/User.js'
import fileRoutes from '../src/routes/fileRoutes.js'
import storageService from '../src/services/storageService.js'

const createQuery = (value) => ({
  populate() {
    return this
  },
  sort() {
    return this
  },
  limit() {
    return this
  },
  select() {
    return this
  },
  lean() {
    return Promise.resolve(value)
  },
  then(resolve, reject) {
    return Promise.resolve(value).then(resolve, reject)
  },
})

test('resource routes enforce membership, upload files, and scope previews to their group', async (t) => {
  const previousSecret = process.env.JWT_SECRET
  const testSecret = `resource-library-test-${process.pid}-${Date.now()}`
  process.env.JWT_SECRET = testSecret

  const groupId = new mongoose.Types.ObjectId().toString()
  const otherGroupId = new mongoose.Types.ObjectId().toString()
  const unauthorizedGroupId = new mongoose.Types.ObjectId().toString()
  const userId = new mongoose.Types.ObjectId().toString()
  const previewFileId = new mongoose.Types.ObjectId().toString()
  const savedFiles = new Map()
  const uploadedObjects = []
  const fetchedObjects = []
  const membershipQueries = []
  const fileListQueries = []
  const folderListQueries = []
  const originalMethods = {
    membershipFindOne: Membership.findOne,
    membershipFind: Membership.find,
    fileFind: File.find,
    fileFindById: File.findById,
    fileCreate: File.create,
    folderFind: Folder.find,
    folderExists: Folder.exists,
    auditCreate: AuditLog.create,
    notificationCreate: Notification.create,
    storageUpload: storageService.uploadFile,
    storageGet: storageService.getFile,
    storageDelete: storageService.deleteFile,
  }
  const previewFile = {
    _id: previewFileId,
    name: 'existing.pdf',
    originalName: 'existing.pdf',
    mimeType: 'application/pdf',
    size: 13,
    storageKey: 'test/existing.pdf',
    groupId,
    uploadedBy: userId,
    folderId: null,
  }
  savedFiles.set(previewFileId, previewFile)

  Membership.findOne = async (query) => {
    membershipQueries.push(query)
    return [groupId, otherGroupId].includes(String(query.groupId)) ? { status: 'active' } : null
  }
  Membership.find = () => ({
    select() {
      return this
    },
    lean() {
      return Promise.resolve([{ userId }])
    },
  })
  File.find = (query) => {
    fileListQueries.push(query)
    return createQuery(
      [...savedFiles.values()].filter(
        (file) => String(file.groupId) === String(query.groupId),
      ),
    )
  }
  File.findById = (id) => createQuery(savedFiles.get(String(id)) || null)
  File.create = async (data) => {
    const file = new File(data)
    await file.validate()
    savedFiles.set(String(file._id), file)
    return file
  }
  Folder.find = (query) => {
    folderListQueries.push(query)
    return createQuery([])
  }
  Folder.exists = async () => null
  AuditLog.create = async (data) => {
    const auditLog = new AuditLog(data)
    await auditLog.validate()
    return auditLog
  }
  Notification.create = async (data) => {
    const notification = new Notification(data)
    await notification.validate()
    return notification
  }
  storageService.uploadFile = async (_file, key) => uploadedObjects.push(key)
  storageService.getFile = async (key) => {
    fetchedObjects.push(key)
    return { Body: { pipe: (response) => response.end('preview-bytes') } }
  }
  storageService.deleteFile = async () => {}

  const app = express()
  app.use(express.json())
  app.use('/api/files', fileRoutes)
  const server = http.createServer(app)

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve))
    Membership.findOne = originalMethods.membershipFindOne
    Membership.find = originalMethods.membershipFind
    File.find = originalMethods.fileFind
    File.findById = originalMethods.fileFindById
    File.create = originalMethods.fileCreate
    Folder.find = originalMethods.folderFind
    Folder.exists = originalMethods.folderExists
    AuditLog.create = originalMethods.auditCreate
    Notification.create = originalMethods.notificationCreate
    storageService.uploadFile = originalMethods.storageUpload
    storageService.getFile = originalMethods.storageGet
    storageService.deleteFile = originalMethods.storageDelete
    if (previousSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = previousSecret
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  const baseUrl = `http://127.0.0.1:${address.port}/api/files`
  const token = jwt.sign({ userId, email: 'resource-test@example.test' }, testSecret)
  const request = (path, options = {}) => fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  const filesResponse = await request(`/group/${groupId}`)
  assert.equal(filesResponse.status, 200)
  assert.equal((await filesResponse.json()).data.length, 1)

  const foldersResponse = await request(`/folders/group/${groupId}`)
  assert.equal(foldersResponse.status, 200)
  assert.deepEqual((await foldersResponse.json()).data, [])
  assert.equal(membershipQueries.length, 2)
  assert.equal(String(fileListQueries[0].groupId), groupId)
  assert.equal(String(folderListQueries[0].groupId), groupId)

  const searchResponse = await request(`/search?groupId=${groupId}&q=existing`)
  assert.equal(searchResponse.status, 200)
  assert.equal((await searchResponse.json()).data.files.length, 1)

  const invalidSearchResponse = await request(`/search?groupId=${groupId}&q=${encodeURIComponent("[")}`)
  assert.equal(invalidSearchResponse.status, 200)
  assert.deepEqual((await invalidSearchResponse.json()).data.files.length, 1)

  const unauthorizedResponse = await request(`/group/${unauthorizedGroupId}`)
  assert.equal(unauthorizedResponse.status, 403)
  assert.equal((await unauthorizedResponse.json()).message, 'Access denied: You are not a member of this study group')

  const formData = new FormData()
  formData.append('groupId', groupId)
  formData.append('file', new Blob(['test resource'], { type: 'text/plain' }), 'test-resource.txt')
  const uploadResponse = await request(`/upload?groupId=${groupId}`, {
    method: 'POST',
    body: formData,
  })
  assert.equal(uploadResponse.status, 201)
  const uploaded = (await uploadResponse.json()).data
  assert.equal(String(uploaded.groupId), groupId)
  assert.equal(uploaded.originalName, 'test-resource.txt')
  assert.equal(uploaded.mimeType, 'text/plain')
  assert.equal(uploaded.size, 13)
  assert.equal(uploadedObjects.length, 1)

  const missingFileResponse = await request(`/upload?groupId=${groupId}`, {
    method: 'POST',
    body: new URLSearchParams({ groupId }),
  })
  assert.equal(missingFileResponse.status, 400)
  assert.equal((await missingFileResponse.json()).message, 'File is required')
  assert.equal(uploadedObjects.length, 1)

  const mismatchFormData = new FormData()
  mismatchFormData.append('groupId', otherGroupId)
  mismatchFormData.append('file', new Blob(['mismatched group'], { type: 'text/plain' }), 'mismatch.txt')
  const mismatchResponse = await request(`/upload?groupId=${groupId}`, {
    method: 'POST',
    body: mismatchFormData,
  })
  assert.equal(mismatchResponse.status, 400)
  assert.equal((await mismatchResponse.json()).message, 'Upload group ID does not match the authorized group')
  assert.equal(uploadedObjects.length, 1)

  const previewResponse = await request(`/${previewFileId}?groupId=${groupId}`)
  assert.equal(previewResponse.status, 200)
  assert.equal(await previewResponse.text(), 'preview-bytes')
  assert.deepEqual(fetchedObjects, [previewFile.storageKey])

  const unrelatedGroupPreview = await request(`/${previewFileId}?groupId=${otherGroupId}`)
  assert.equal(unrelatedGroupPreview.status, 404)
  assert.equal((await unrelatedGroupPreview.json()).message, 'File not found in the authorized group')
  assert.deepEqual(fetchedObjects, [previewFile.storageKey])
})

test('group authorization rejects missing IDs and records the authorized database group', async () => {
  const originalFindOne = Membership.findOne
  const groupId = new mongoose.Types.ObjectId().toString()
  const userId = new mongoose.Types.ObjectId().toString()
  let membershipQuery
  Membership.findOne = async (query) => {
    membershipQuery = query
    return { status: 'active' }
  }

  try {
    const missingResponse = {
      statusCode: 0,
      status(code) { this.statusCode = code; return this },
      json(body) { this.body = body; return this },
    }
    await authorizeGroup({ params: {}, body: {}, query: {}, user: { userId } }, missingResponse, () => {})
    assert.equal(missingResponse.statusCode, 400)
    assert.equal(missingResponse.body.message, 'Group ID is required')

    const request = { params: {}, body: {}, query: { groupId }, user: { userId } }
    const response = {
      status(code) { this.statusCode = code; return this },
      json(body) { this.body = body; return this },
    }
    let continued = false
    await authorizeGroup(request, response, () => { continued = true })
    assert.equal(continued, true)
    assert.equal(request.authorizedGroupId, groupId)
    assert.equal(String(membershipQuery.groupId), groupId)
  } finally {
    Membership.findOne = originalFindOne
  }
})

test('resource workflow persists against an isolated local MongoDB with seeded memberships', async (t) => {
  const mongoUri = `mongodb://127.0.0.1:27017/studysphere_resource_test_${process.pid}_${Date.now()}`
  const previousSecret = process.env.JWT_SECRET
  const testSecret = `resource-db-test-${process.pid}-${Date.now()}`
  process.env.JWT_SECRET = testSecret
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 })

  const uploadedObjects = []
  const deletedObjects = []
  const originalStorage = {
    uploadFile: storageService.uploadFile,
    getFile: storageService.getFile,
    deleteFile: storageService.deleteFile,
  }
  storageService.uploadFile = async (_file, key) => uploadedObjects.push(key)
  storageService.getFile = async (key) => ({
    Body: {
      pipe(response) {
        response.end('preview-bytes')
      },
    },
    key,
  })
  storageService.deleteFile = async (key) => deletedObjects.push(key)

  const app = express()
  app.use(express.json())
  app.use('/api/files', fileRoutes)
  const server = http.createServer(app)

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve))
    await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
    storageService.uploadFile = originalStorage.uploadFile
    storageService.getFile = originalStorage.getFile
    storageService.deleteFile = originalStorage.deleteFile
    if (previousSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = previousSecret
  })

  const member = await User.create({
    name: 'Resource Test Member',
    email: `resource-member-${Date.now()}@example.test`,
    password: 'test-password-hash',
  })
  const nonMember = await User.create({
    name: 'Resource Test Non-member',
    email: `resource-outsider-${Date.now()}@example.test`,
    password: 'test-password-hash',
  })
  const collaborator = await User.create({
    name: 'Resource Test Collaborator',
    email: `resource-collaborator-${Date.now()}@example.test`,
    password: 'test-password-hash',
  })
  const groupMember = await User.create({
    name: 'Resource Test Group Member',
    email: `resource-group-member-${Date.now()}@example.test`,
    password: 'test-password-hash',
  })
  const group = await StudyGroup.create({ name: 'Resource Test Group', createdBy: member._id })
  const unrelatedGroup = await StudyGroup.create({
    name: 'Resource Test Unrelated Group',
    createdBy: member._id,
  })
  await Membership.create({
    userId: member._id,
    groupId: group._id,
    status: 'active',
    role: 'leader',
  })
  await Membership.create({ userId: collaborator._id, groupId: group._id, status: 'active' })
  await Membership.create({ userId: groupMember._id, groupId: group._id, status: 'active' })
  await Membership.create({ userId: member._id, groupId: unrelatedGroup._id, status: 'active' })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  const baseUrl = `http://127.0.0.1:${address.port}/api/files`
  const memberToken = jwt.sign(
    { userId: String(member._id), email: member.email },
    testSecret,
  )
  const outsiderToken = jwt.sign(
    { userId: String(nonMember._id), email: nonMember.email },
    testSecret,
  )
  const collaboratorToken = jwt.sign(
    { userId: String(collaborator._id), email: collaborator.email },
    testSecret,
  )
  const groupMemberToken = jwt.sign(
    { userId: String(groupMember._id), email: groupMember.email },
    testSecret,
  )
  const request = (token, path, options = {}) => fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  const filesResponse = await request(memberToken, `/group/${group._id}`)
  assert.equal(filesResponse.status, 200)
  assert.deepEqual((await filesResponse.json()).data, [])

  const foldersResponse = await request(memberToken, `/folders/group/${group._id}`)
  assert.equal(foldersResponse.status, 200)
  assert.deepEqual((await foldersResponse.json()).data, [])

  const formData = new FormData()
  formData.append('groupId', String(group._id))
  formData.append('file', new Blob(['test resource'], { type: 'text/plain' }), 'test-resource.txt')
  const uploadResponse = await request(memberToken, `/upload?groupId=${group._id}`, {
    method: 'POST',
    body: formData,
  })
  assert.equal(uploadResponse.status, 201)
  const uploadedFile = (await uploadResponse.json()).data
  assert.equal(String(uploadedFile.groupId), String(group._id))
  assert.equal(uploadedObjects.length, 1)
  assert.equal(await File.countDocuments({ _id: uploadedFile._id, groupId: group._id }), 1)
  assert.equal(await AuditLog.countDocuments({ targetId: uploadedFile._id, action: 'file_upload' }), 1)
  assert.equal(await Notification.countDocuments({
    recipient: member._id,
    groupId: group._id,
    type: 'upload',
  }), 1)

  const persistedFilesResponse = await request(memberToken, `/group/${group._id}`)
  assert.equal(persistedFilesResponse.status, 200)
  assert.equal((await persistedFilesResponse.json()).data.length, 1)

  const searchResponse = await request(
    memberToken,
    `/search?groupId=${group._id}&q=test-resource`,
  )
  assert.equal(searchResponse.status, 200)
  assert.equal((await searchResponse.json()).data.files.length, 1)

  const suggestionsResponse = await request(
    memberToken,
    `/search/suggestions?groupId=${group._id}&q=test`,
  )
  assert.equal(suggestionsResponse.status, 200)
  assert.equal((await suggestionsResponse.json()).data.files.length, 1)

  const shareResponse = await request(memberToken, `/${uploadedFile._id}/share?groupId=${group._id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: String(collaborator._id) }),
  })
  assert.equal(shareResponse.status, 200)
  const sharedFile = await File.findById(uploadedFile._id)
  assert.deepEqual(sharedFile.sharedWith.map(String), [String(collaborator._id)])

  const unsharedMemberFiles = await request(groupMemberToken, `/group/${group._id}`)
  assert.equal(unsharedMemberFiles.status, 200)
  assert.equal((await unsharedMemberFiles.json()).data.length, 0)
  const unsharedMemberPreview = await request(
    groupMemberToken,
    `/${uploadedFile._id}?groupId=${group._id}`,
  )
  assert.equal(unsharedMemberPreview.status, 403)

  const permissionsResponse = await request(
    memberToken,
    `/${uploadedFile._id}/permissions?groupId=${group._id}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowedActions: ['view', 'download', 'update'] }),
    },
  )
  assert.equal(permissionsResponse.status, 200)
  assert.deepEqual(
    (await permissionsResponse.json()).data.permissions,
    ['view', 'download', 'update'],
  )

  const sharedMemberPreview = await request(
    collaboratorToken,
    `/${uploadedFile._id}?groupId=${group._id}`,
  )
  assert.equal(sharedMemberPreview.status, 200)
  assert.equal(await sharedMemberPreview.text(), 'preview-bytes')

  const downloadOnlyPermissions = await request(
    memberToken,
    `/${uploadedFile._id}/permissions?groupId=${group._id}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowedActions: ['download', 'update'] }),
    },
  )
  assert.equal(downloadOnlyPermissions.status, 200)
  const blockedPreview = await request(
    collaboratorToken,
    `/${uploadedFile._id}?groupId=${group._id}`,
  )
  assert.equal(blockedPreview.status, 403)
  const allowedDownload = await request(
    collaboratorToken,
    `/${uploadedFile._id}?groupId=${group._id}&download=true`,
  )
  assert.equal(allowedDownload.status, 200)
  assert.match(allowedDownload.headers.get('content-disposition'), /^attachment;/)
  assert.equal(await allowedDownload.text(), 'preview-bytes')

  await request(
    memberToken,
    `/${uploadedFile._id}/permissions?groupId=${group._id}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowedActions: ['view', 'download', 'update'] }),
    },
  )

  const versionResponse = await request(
    collaboratorToken,
    `/${uploadedFile._id}/version?groupId=${group._id}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: 'Updated course notes' }),
    },
  )
  assert.equal(versionResponse.status, 200)
  assert.equal((await versionResponse.json()).data.version, 2)

  const previewResponse = await request(
    memberToken,
    `/${uploadedFile._id}?groupId=${group._id}`,
  )
  assert.equal(previewResponse.status, 200)
  assert.equal(await previewResponse.text(), 'preview-bytes')

  const nonMemberResponse = await request(outsiderToken, `/group/${group._id}`)
  assert.equal(nonMemberResponse.status, 403)

  const nonMemberSearch = await request(
    outsiderToken,
    `/search?groupId=${group._id}&q=test-resource`,
  )
  assert.equal(nonMemberSearch.status, 403)

  const unrelatedGroupPreview = await request(
    memberToken,
    `/${uploadedFile._id}?groupId=${unrelatedGroup._id}`,
  )
  assert.equal(unrelatedGroupPreview.status, 404)

  const searchOtherGroupResponse = await request(
    memberToken,
    `/search?groupId=${unrelatedGroup._id}&q=test-resource`,
  )
  assert.equal(searchOtherGroupResponse.status, 200)
  assert.equal((await searchOtherGroupResponse.json()).data.files.length, 0)

  const unrelatedGroupDelete = await request(
    memberToken,
    `/${uploadedFile._id}?groupId=${unrelatedGroup._id}`,
    { method: 'DELETE' },
  )
  assert.equal(unrelatedGroupDelete.status, 404)
  assert.deepEqual(deletedObjects, [])

  const deleteResponse = await request(
    memberToken,
    `/${uploadedFile._id}?groupId=${group._id}`,
    { method: 'DELETE' },
  )
  assert.equal(deleteResponse.status, 200)
  assert.equal(await File.countDocuments({ _id: uploadedFile._id }), 0)
  assert.deepEqual(deletedObjects, [uploadedFile.storageKey])
})
