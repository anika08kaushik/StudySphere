import 'dotenv/config'
import assert from 'node:assert/strict'
import test from 'node:test'
import http from 'node:http'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import User from '../src/models/User.js'
import StudyGroup from '../src/models/StudyGroup.js'
import Membership from '../src/models/Membership.js'
import Task from '../src/models/Task.js'
import express from 'express'
import cors from 'cors'
import taskRoutes from '../src/routes/taskRoutes.js'

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret'

test('Member 3 Phase 1: Task Management Backend', async (t) => {
  let server
  let baseUrl
  let leaderUser
  let studentUser
  let outsiderUser
  let group
  let tokenLeader
  let tokenStudent
  let tokenOutsider

  t.before(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studysphere')
    }

    // Load or create test users
    leaderUser = await User.findOne({ email: 'leader@test.com' })
    studentUser = await User.findOne({ email: 'student1@test.com' })
    outsiderUser = await User.findOneAndUpdate(
      { email: 'outsider@test.com' },
      { $set: { name: 'Outsider Test', password: 'hash' } },
      { returnDocument: 'after', upsert: true }
    )

    group = await StudyGroup.findOne({ name: 'Machine Learning' })
    assert.ok(group, 'Machine Learning group should exist from seed')

    // Ensure outsider is NOT a member of this group
    await Membership.deleteMany({ userId: outsiderUser._id, groupId: group._id })

    tokenLeader = jwt.sign({ userId: leaderUser._id, name: leaderUser.name }, JWT_SECRET, { expiresIn: '1d' })
    tokenStudent = jwt.sign({ userId: studentUser._id, name: studentUser.name }, JWT_SECRET, { expiresIn: '1d' })
    tokenOutsider = jwt.sign({ userId: outsiderUser._id, name: outsiderUser.name }, JWT_SECRET, { expiresIn: '1d' })

    // Setup lightweight express app with taskRoutes
    const app = express()
    app.use(cors())
    app.use(express.json())
    app.use('/api/tasks', taskRoutes)

    server = http.createServer(app)
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const port = server.address().port
    baseUrl = `http://127.0.0.1:${port}`
  })

  t.after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    await mongoose.disconnect()
  })

  const api = async (path, options = {}, token = tokenLeader) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    }
    const res = await fetch(`${baseUrl}${path}`, { ...options, headers })
    const data = await res.json().catch(() => ({}))
    return { status: res.status, data }
  }

  let createdTaskId = null

  await t.test('1. Authentication Check - Missing Token Returns 401', async () => {
    const res = await api('/api/tasks', { method: 'POST', body: JSON.stringify({ title: 'No Auth' }) }, null)
    assert.equal(res.status, 401)
    assert.equal(res.data.success, false)
  })

  await t.test('2. POST /api/tasks - Validation Failures', async () => {
    // Missing title
    const res1 = await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ groupId: group._id }),
    })
    assert.equal(res1.status, 400)
    assert.equal(res1.data.success, false)

    // Missing groupId
    const res2 = await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Task with no group' }),
    })
    assert.equal(res2.status, 400)
    assert.equal(res2.data.success, false)

    // Invalid status
    const res3 = await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Task', groupId: group._id, status: 'INVALID_STATUS' }),
    })
    assert.equal(res3.status, 400)
    assert.equal(res3.data.success, false)

    // Invalid priority
    const res4 = await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Task', groupId: group._id, priority: 'SUPER_URGENT' }),
    })
    assert.equal(res4.status, 400)
    assert.equal(res4.data.success, false)
  })

  await t.test('3. POST /api/tasks - Authorization Check (Outsider Forbidden)', async () => {
    const res = await api(
      '/api/tasks',
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Hacker Task',
          groupId: group._id,
        }),
      },
      tokenOutsider
    )
    assert.equal(res.status, 403)
    assert.equal(res.data.success, false)
  })

  await t.test('4. POST /api/tasks - Successfully Create Task with Checklist, Priority & Assignee', async () => {
    const res = await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Implement Backprop Algorithm',
        description: 'Complete the backpropagation math and unit tests',
        groupId: group._id,
        assignedTo: studentUser._id,
        status: 'TODO',
        priority: 'HIGH',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        checklist: [
          { text: 'Derive partial derivatives', completed: true },
          { text: 'Code matrix multiplication', completed: false },
        ],
      }),
    })

    assert.equal(res.status, 201)
    assert.equal(res.data.success, true)
    assert.equal(res.data.data.title, 'Implement Backprop Algorithm')
    assert.equal(res.data.data.priority, 'HIGH')
    assert.equal(res.data.data.status, 'TODO')
    assert.equal(res.data.data.checklist.length, 2)
    assert.equal(res.data.data.checklist[0].completed, true)
    assert.equal(res.data.data.assignedTo._id, String(studentUser._id))
    assert.equal(res.data.data.createdBy._id, String(leaderUser._id))

    createdTaskId = res.data.data._id
    assert.ok(createdTaskId, 'Task ID should be present')
  })

  await t.test('5. GET /api/tasks/:groupId - Retrieve Group Tasks', async () => {
    const res = await api(`/api/tasks/${group._id}`, { method: 'GET' }, tokenStudent)
    assert.equal(res.status, 200)
    assert.equal(res.data.success, true)
    assert.ok(Array.isArray(res.data.data))
    const found = res.data.data.find((t) => String(t._id) === String(createdTaskId))
    assert.ok(found, 'Created task must be in the group tasks list')
  })

  await t.test('6. GET /api/tasks/:groupId - Outsider Forbidden (403)', async () => {
    const res = await api(`/api/tasks/${group._id}`, { method: 'GET' }, tokenOutsider)
    assert.equal(res.status, 403)
    assert.equal(res.data.success, false)
  })

  await t.test('7. PUT /api/tasks/:taskId - Update Task Details and Status', async () => {
    const res = await api(
      `/api/tasks/${createdTaskId}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          checklist: [
            { text: 'Derive partial derivatives', completed: true },
            { text: 'Code matrix multiplication', completed: true },
          ],
        }),
      },
      tokenStudent
    )

    assert.equal(res.status, 200)
    assert.equal(res.data.success, true)
    assert.equal(res.data.data.status, 'IN_PROGRESS')
    assert.equal(res.data.data.priority, 'MEDIUM')
    assert.equal(res.data.data.checklist[1].completed, true)
  })

  await t.test('8. PUT /api/tasks/:taskId - Validation & Authorization Checks', async () => {
    // Non-member cannot update
    const resForbidden = await api(
      `/api/tasks/${createdTaskId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ status: 'COMPLETED' }),
      },
      tokenOutsider
    )
    assert.equal(resForbidden.status, 403)

    // Invalid status
    const resInvalid = await api(`/api/tasks/${createdTaskId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'BAD_STATUS' }),
    })
    assert.equal(resInvalid.status, 400)
  })

  await t.test('9. DELETE /api/tasks/:taskId - Non-member / Unauthorized Check', async () => {
    const resForbidden = await api(`/api/tasks/${createdTaskId}`, { method: 'DELETE' }, tokenOutsider)
    assert.equal(resForbidden.status, 403)
  })

  await t.test('10. DELETE /api/tasks/:taskId - Successfully Delete Task by Leader', async () => {
    const res = await api(`/api/tasks/${createdTaskId}`, { method: 'DELETE' }, tokenLeader)
    assert.equal(res.status, 200)
    assert.equal(res.data.success, true)

    // Verify deletion in MongoDB
    const check = await Task.findById(createdTaskId)
    assert.equal(check, null, 'Task should be deleted from DB')

    // Deleting again should return 404
    const res404 = await api(`/api/tasks/${createdTaskId}`, { method: 'DELETE' }, tokenLeader)
    assert.equal(res404.status, 404)
  })
})
