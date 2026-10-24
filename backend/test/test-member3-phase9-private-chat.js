import 'dotenv/config'
import assert from 'node:assert/strict'
import test from 'node:test'
import http from 'node:http'
import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { Server } from 'socket.io'
import { io as Client } from 'socket.io-client'

import socketAuthMiddleware from '../src/middleware/socketAuthMiddleware.js'
import authenticate from '../src/middleware/authMiddleware.js'
import privateChatRoutes from '../src/routes/privateChatRoutes.js'
import { setPrivateChatIo } from '../src/services/privateChatService.js'
import User from '../src/models/User.js'
import ChatRequest from '../src/models/ChatRequest.js'
import DirectMessage from '../src/models/DirectMessage.js'

const JWT_SECRET = process.env.JWT_SECRET

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

test('Phase 9: chat requests, live notifications and persisted DMs', async (t) => {
  let httpServer
  let ioServer
  let port
  let userA
  let userB
  let userOut
  let tokens
  let sockets

  // ---- Setup (inline so tokens exist before the subtests below) ----
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studysphere')
  }

  // Clean any leftovers from previous runs
  await ChatRequest.deleteMany({})
  await DirectMessage.deleteMany({})

  userA = await User.findOne({ email: 'leader@test.com' })
  userB = await User.findOne({ email: 'student1@test.com' })
  assert.ok(userA && userB, 'Seed users must exist: run the seed script first')
  userOut = await User.create({
    name: 'Phase9 Outsider',
    email: `phase9-${Date.now()}@test.com`,
    password: 'test-pass-1234',
  })

  tokens = {
    A: jwt.sign({ userId: userA._id, name: userA.name }, JWT_SECRET, { expiresIn: '1d' }),
    B: jwt.sign({ userId: userB._id, name: userB.name }, JWT_SECRET, { expiresIn: '1d' }),
    OUT: jwt.sign({ userId: userOut._id, name: userOut.name }, JWT_SECRET, { expiresIn: '1d' }),
  }

  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use('/api/private-chat', authenticate, privateChatRoutes)
  httpServer = http.createServer(app)

  ioServer = new Server(httpServer, { cors: { origin: '*' } })
  ioServer.use(socketAuthMiddleware)
  ioServer.on('connection', (socket) => {
    if (socket.user?.userId) {
      socket.join(`user:${socket.user.userId}`)
    }
  })
  setPrivateChatIo(ioServer)

  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve))
  port = httpServer.address().port

  const connect = (token) => {
    const s = Client(`http://127.0.0.1:${port}`, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
    })
    return new Promise((resolve) => s.on('connect', () => resolve(s)))
  }

  sockets = {
    A: await connect(tokens.A),
    B: await connect(tokens.B),
    OUT: await connect(tokens.OUT),
  }

  try {
    const api = (token) => async (path, options = {}) => {
      const res = await fetch(`http://127.0.0.1:${port}/api/private-chat${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      return { status: res.status, body: await res.json().catch(() => null) }
    }
    const callA = api(tokens.A)
    const callB = api(tokens.B)
    const callOut = api(tokens.OUT)

    await t.test('1. A sends a request; B receives a LIVE socket notification', async () => {
      const notifyPromise = new Promise((resolve) => sockets.B.once('chat_request:new', resolve))

      const res = await callA('/requests', {
        method: 'POST',
        body: JSON.stringify({ toUserId: String(userB._id), groupId: 'campus_lounge' }),
      })
      assert.equal(res.status, 201)
      assert.equal(res.body.data.status, 'PENDING')

      const notification = await notifyPromise
      assert.equal(notification.from.id, String(userA._id))
      assert.equal(notification.groupId, 'campus_lounge')
    })

    await t.test('2. B sees the request in incoming list and accepts it', async () => {
      const listed = await callB('/requests')
      assert.equal(listed.status, 200)
      assert.equal(listed.body.data.incoming.length, 1)
      assert.equal(String(listed.body.data.incoming[0].peer.id), String(userA._id))

      const requestId = listed.body.data.incoming[0]._id
      const updatePromise = new Promise((resolve) => sockets.A.once('chat_request:update', resolve))

      const res = await callB(`/requests/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action: 'accept' }),
      })
      assert.equal(res.status, 200)
      assert.equal(res.body.data.status, 'ACCEPTED')

      const update = await updatePromise
      assert.equal(update.status, 'ACCEPTED')
      assert.equal(update.peer.id, String(userB._id))
    })

    await t.test('3. Accepted partners appear on both sides', async () => {
      const [mineA, mineB] = await Promise.all([callA('/requests'), callB('/requests')])
      assert.ok(mineA.body.data.partners.some((p) => String(p.id) === String(userB._id)))
      assert.ok(mineB.body.data.partners.some((p) => String(p.id) === String(userA._id)))
    })

    await t.test('4. Sending a second request auto-matches (already connected)', async () => {
      const res = await callA('/requests', {
        method: 'POST',
        body: JSON.stringify({ toUserId: String(userB._id) }),
      })
      assert.equal(res.status, 200)
      assert.equal(res.body.data.status, 'ACCEPTED')
    })

    await t.test('5. A and B exchange DMs that persist (history retrieval)', async () => {
      const newMsgB = new Promise((resolve) => sockets.B.once('dm:new', resolve))
      const newMsgA = new Promise((resolve) => sockets.A.once('dm:new', resolve))

      const sendA = await callA(`/dm/${userB._id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Hey! Want to study together?' }),
      })
      assert.equal(sendA.status, 201)

      const liveOnB = await newMsgB
      assert.equal(liveOnB.message.content, 'Hey! Want to study together?')

      const sendB = await callB(`/dm/${userA._id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Sure, let me know when you are ready!' }),
      })
      assert.equal(sendB.status, 201)
      await newMsgA

      await wait(100)
      const historyA = await callA(`/dm/${userB._id}/messages`)
      assert.equal(historyA.status, 200)
      assert.equal(historyA.body.data.length, 2)
      assert.equal(historyA.body.data[0].content, 'Hey! Want to study together?')

      const historyB = await callB(`/dm/${userA._id}/messages`)
      assert.equal(historyB.body.data[1].content, 'Sure, let me know when you are ready!')
    })

    await t.test('6. Access control: outsiders cannot read or send DMs', async () => {
      const read = await callOut(`/dm/${userA._id}/messages`)
      assert.equal(read.status, 403)

      const write = await callOut(`/dm/${userA._id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: 'sneaky' }),
      })
      assert.equal(write.status, 403)

      // A cannot DM an unconnected user either
      const aToOut = await callA(`/dm/${userOut._id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: 'hi' }),
      })
      assert.equal(aToOut.status, 403)
    })

    await t.test('7. Only the recipient can respond to a request', async () => {
      // OUT sends a request to B (recipient is B)
      const send = await callOut('/requests', {
        method: 'POST',
        body: JSON.stringify({ toUserId: String(userB._id) }),
      })
      const requestId = send.body.data.requestId

      // A third party (A) cannot respond to someone else's request
      const thirdParty = await callA(`/requests/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action: 'decline' }),
      })
      assert.equal(thirdParty.status, 403)

      // The sender cannot respond to their own request either
      const sender = await callOut(`/requests/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action: 'decline' }),
      })
      assert.equal(sender.status, 403, 'sender cannot respond to own request')

      // Recipient can decline
      const recipient = await callB(`/requests/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action: 'decline' }),
      })
      assert.equal(recipient.status, 200)
      assert.equal(recipient.body.data.status, 'DECLINED')
    })
  } finally {
    // ---- Teardown ----
    Object.values(sockets || {}).forEach((s) => s?.disconnect())
    if (userOut) await User.deleteOne({ _id: userOut._id })
    ioServer?.close()
    httpServer?.close()
    await mongoose.disconnect()
  }
})
