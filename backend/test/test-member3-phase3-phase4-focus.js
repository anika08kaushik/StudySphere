import 'dotenv/config'
import assert from 'node:assert/strict'
import test from 'node:test'
import http from 'node:http'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import { io as Client } from 'socket.io-client'

import socketAuthMiddleware from '../src/middleware/socketAuthMiddleware.js'
import registerFocusSocket from '../src/sockets/focusSocket.js'
import User from '../src/models/User.js'
import StudyGroup from '../src/models/StudyGroup.js'
import Membership from '../src/models/Membership.js'

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret'

test('Member 3 Phase 3 & 4: Real-Time Focus Room & Pomodoro Timer Sockets', async (t) => {
  let httpServer
  let ioServer
  let port
  let userA
  let userB
  let group
  let tokenA
  let tokenB
  let clientA
  let clientB

  // must be awaited: async t.before() hooks run concurrently with the test body,
  // so `group` would still be undefined when the body computes groupId below
  await (async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studysphere')
    }

    userA = await User.findOne({ email: 'leader@test.com' })
    userB = await User.findOne({ email: 'student1@test.com' })
    group = await StudyGroup.findOne({ name: 'Machine Learning' })

    tokenA = jwt.sign({ userId: userA._id, name: userA.name }, JWT_SECRET, { expiresIn: '1d' })
    tokenB = jwt.sign({ userId: userB._id, name: userB.name }, JWT_SECRET, { expiresIn: '1d' })

    const app = express()
    app.use(cors())
    httpServer = http.createServer(app)

    ioServer = new Server(httpServer, {
      cors: { origin: '*' },
    })
    ioServer.use(socketAuthMiddleware)

    ioServer.on('connection', (socket) => {
      registerFocusSocket(ioServer, socket)
    })

    await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve))
    port = httpServer.address().port

    // Connect Client A
    clientA = Client(`http://127.0.0.1:${port}`, {
      auth: { token: tokenA, userId: userA._id, userName: userA.name },
      transports: ['websocket'],
      forceNew: true,
    })

    // Connect Client B
    clientB = Client(`http://127.0.0.1:${port}`, {
      auth: { token: tokenB, userId: userB._id, userName: userB.name },
      transports: ['websocket'],
      forceNew: true,
    })

    await Promise.all([
      new Promise((resolve) => clientA.on('connect', resolve)),
      new Promise((resolve) => clientB.on('connect', resolve)),
    ])
  })()

  t.after(async () => {
    clientA?.disconnect()
    clientB?.disconnect()
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve))
    }
    await mongoose.disconnect()
  })

  const groupId = String(group._id)

  await t.test('1. User A joins Focus Room and receives focus:joined', async () => {
    const joinedPromise = new Promise((resolve) => {
      clientA.once('focus:joined', resolve)
    })

    clientA.emit('focus:join', {
      groupId,
      avatarConfig: { outfitColor: '#9B7EDB', name: userA.name },
      deskIndex: null,
      status: 'IDLE',
    })

    const joinedData = await joinedPromise
    assert.equal(joinedData.groupId, groupId)
    assert.ok(Array.isArray(joinedData.participants))
    assert.equal(joinedData.participants.length, 1)
    assert.equal(joinedData.participants[0].userId, String(userA._id))
    assert.ok(joinedData.timerState)
  })

  await t.test('2. User B joins Focus Room - both see presence update count = 2', async () => {
    const presencePromiseA = new Promise((resolve) => {
      clientA.once('focus:presence_update', resolve)
    })
    const presencePromiseB = new Promise((resolve) => {
      clientB.once('focus:presence_update', resolve)
    })

    clientB.emit('focus:join', {
      groupId,
      avatarConfig: { outfitColor: '#8FBA99', name: userB.name },
      deskIndex: null,
      status: 'IDLE',
    })

    const [presenceA, presenceB] = await Promise.all([presencePromiseA, presencePromiseB])
    assert.equal(presenceA.count, 2)
    assert.equal(presenceB.count, 2)
  })

  await t.test('3. User A selects Desk 2 - User B receives real-time desk claim', async () => {
    const updatePromise = new Promise((resolve) => {
      clientB.once('focus:presence_update', (data) => {
        const participantA = data.participants.find((p) => p.userId === String(userA._id))
        if (participantA && participantA.deskIndex === 2) {
          resolve(participantA)
        }
      })
    })

    clientA.emit('focus:select_desk', {
      groupId,
      deskIndex: 2,
      avatarConfig: { outfitColor: '#9B7EDB', name: userA.name },
    })

    const occupantA = await updatePromise
    assert.equal(occupantA.deskIndex, 2)
    assert.equal(occupantA.status, 'STUDYING')
  })

  await t.test('4. User A leaves Desk 2 - Desk is freed in real-time', async () => {
    const updatePromise = new Promise((resolve) => {
      clientB.once('focus:presence_update', (data) => {
        const participantA = data.participants.find((p) => p.userId === String(userA._id))
        if (participantA && participantA.deskIndex === null) {
          resolve(participantA)
        }
      })
    })

    clientA.emit('focus:leave_desk', { groupId })

    const occupantA = await updatePromise
    assert.equal(occupantA.deskIndex, null)
    assert.equal(occupantA.status, 'IDLE')
  })

  await t.test('5. Pomodoro Timer Action: Start, Pause & Mode Change Synchronization', async () => {
    // 5a. Start Timer
    const startSyncPromise = new Promise((resolve) => {
      clientB.once('focus:timer_sync', (data) => {
        if (data.action === 'start') resolve(data)
      })
    })

    clientA.emit('focus:timer_action', {
      groupId,
      action: 'start',
      mode: 'FOCUS',
      remainingSeconds: 25 * 60,
    })

    const startData = await startSyncPromise
    assert.equal(startData.timerState.isRunning, true)
    assert.equal(startData.timerState.mode, 'FOCUS')

    // 5b. Pause Timer
    const pauseSyncPromise = new Promise((resolve) => {
      clientB.once('focus:timer_sync', (data) => {
        if (data.action === 'pause') resolve(data)
      })
    })

    clientA.emit('focus:timer_action', {
      groupId,
      action: 'pause',
      mode: 'FOCUS',
      remainingSeconds: 1450,
    })

    const pauseData = await pauseSyncPromise
    assert.equal(pauseData.timerState.isRunning, false)
    assert.equal(pauseData.timerState.remainingSeconds, 1450)

    // 5c. Mode Change to SHORT_BREAK
    const modeSyncPromise = new Promise((resolve) => {
      clientB.once('focus:timer_sync', (data) => {
        if (data.action === 'mode_change') resolve(data)
      })
    })

    clientA.emit('focus:timer_action', {
      groupId,
      action: 'mode_change',
      mode: 'SHORT_BREAK',
    })

    const modeData = await modeSyncPromise
    assert.equal(modeData.timerState.mode, 'SHORT_BREAK')
    assert.equal(modeData.timerState.remainingSeconds, 5 * 60)
  })

  await t.test('6. User B disconnects - User A receives updated presence count = 1', async () => {
    const disconnectPresencePromise = new Promise((resolve) => {
      clientA.once('focus:presence_update', (data) => {
        if (data.count === 1) resolve(data)
      })
    })

    clientB.disconnect()

    const presenceAfterLeave = await disconnectPresencePromise
    assert.equal(presenceAfterLeave.count, 1)
    assert.equal(presenceAfterLeave.participants[0].userId, String(userA._id))
  })
})
