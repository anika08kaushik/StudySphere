import assert from 'node:assert/strict'
import express from 'express'
import http from 'node:http'
import mongoose from 'mongoose'
import multer from 'multer'
import test from 'node:test'
import authorizeGroup from '../src/middleware/authzMiddleware.js'
import Membership from '../src/models/Membership.js'
import validateFile from '../src/services/fileValidationService.js'

test('multipart upload parses text files only after group authorization', async (t) => {
  const groupId = new mongoose.Types.ObjectId().toString()
  const userId = new mongoose.Types.ObjectId().toString()
  const originalFindOne = Membership.findOne
  Membership.findOne = async (query) => (
    String(query.userId) === userId && String(query.groupId) === groupId
      ? { status: 'active' }
      : null
  )

  const app = express()
  app.post(
    '/upload',
    (request, _response, next) => {
      request.user = { userId }
      next()
    },
    authorizeGroup,
    multer({ storage: multer.memoryStorage() }).single('file'),
    (request, response) => {
      if (!request.file) {
        return response.status(400).json({ message: 'File is required' })
      }

      try {
        validateFile(request.file)
        return response.status(201).json({
          filename: request.file.originalname,
          mimeType: request.file.mimetype,
          size: request.file.size,
          authorizedGroupId: request.authorizedGroupId,
        })
      } catch (error) {
        return response.status(400).json({ message: error.message })
      }
    },
  )

  const server = http.createServer(app)
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve))
    Membership.findOne = originalFindOne
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const baseUrl = `http://127.0.0.1:${server.address().port}`

  const formData = new FormData()
  formData.append('file', new Blob(['test resource'], { type: 'text/plain' }), 'test-resource.txt')
  const uploadResponse = await fetch(`${baseUrl}/upload?groupId=${groupId}`, {
    method: 'POST',
    body: formData,
  })
  assert.equal(uploadResponse.status, 201)
  assert.deepEqual(await uploadResponse.json(), {
    filename: 'test-resource.txt',
    mimeType: 'text/plain',
    size: 13,
    authorizedGroupId: groupId,
  })

  const missingFileResponse = await fetch(`${baseUrl}/upload?groupId=${groupId}`, {
    method: 'POST',
    body: new URLSearchParams({ groupId }),
  })
  assert.equal(missingFileResponse.status, 400)
  assert.equal((await missingFileResponse.json()).message, 'File is required')

  const deniedResponse = await fetch(
    `${baseUrl}/upload?groupId=${new mongoose.Types.ObjectId()}`,
    { method: 'POST', body: new FormData() },
  )
  assert.equal(deniedResponse.status, 403)
})
