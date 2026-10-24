import 'dotenv/config'
import assert from 'node:assert/strict'
import test from 'node:test'
import http from 'node:http'
import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

import authenticate from '../src/middleware/authMiddleware.js'
import calendarEventRoutes from '../src/routes/calendarEventRoutes.js'
import CalendarEvent from '../src/models/CalendarEvent.js'
import User from '../src/models/User.js'

const JWT_SECRET = process.env.JWT_SECRET

test('Phase 10: persistent calendar events with emoji mood and details', async (t) => {
  let httpServer
  let port
  let createdIds = []
  let userId
  let user2Id
  let blindIds = []
  let user2 = null

  // ---- Setup ----
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studysphere')
  }

  const user = await User.findOne({ email: 'leader@test.com' })
  assert.ok(user, 'Seed user leader@test.com must exist')
  userId = String(user._id)
  const token = jwt.sign({ userId, name: user.name }, JWT_SECRET, { expiresIn: '1d' })

  user2 = await User.create({
    name: 'Phase10 Second',
    email: `phase10-${Date.now()}@test.com`,
    password: 'test-pass-1234',
  })
  user2Id = String(user2._id)
  const token2 = jwt.sign({ userId: user2Id, name: user2.name }, JWT_SECRET, { expiresIn: '1d' })

  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use('/api/calendar', authenticate, calendarEventRoutes)
  httpServer = http.createServer(app)
  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve))
  port = httpServer.address().port

  const call = (tk) => async (path, options = {}, method = 'GET') => {
    const res = await fetch(`http://127.0.0.1:${port}/api/calendar${path}`, {
      method,
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
    })
    return { status: res.status, body: await res.json().catch(() => null) }
  }
  const api = call(token)
  const api2 = call(token2)

  try {
    // Clean leftovers from previous runs for this user
    await CalendarEvent.deleteMany({ owner: user._id })

    const validEvent = {
      title: 'Physics Midterm Study',
      description: 'Chapters 1-5 + lab review',
      date: '2026-11-02',
      startTime: '14:30',
      endTime: '16:00',
      category: 'study',
      emoji: '📣',
      reminderMinutes: 30,
    }

    await t.test('1. Create persists every field (incl. emoji & description)', async () => {
      const res = await api('/events', { body: JSON.stringify(validEvent) }, 'POST')
      assert.equal(res.status, 201)
      const ev = res.body.data
      createdIds.push(ev._id)
      assert.equal(ev.title, 'Physics Midterm Study')
      assert.equal(ev.description, 'Chapters 1-5 + lab review')
      assert.equal(ev.date, '2026-11-02')
      assert.equal(ev.startTime, '14:30')
      assert.equal(ev.endTime, '16:00')
      assert.equal(ev.emoji, '📣')
      assert.equal(ev.reminderMinutes, 30)

      // Reload from MongoDB: the record really persisted
      const db = await CalendarEvent.findById(ev._id).lean()
      assert.equal(db.emoji, '📣')
      assert.equal(db.date, '2026-11-02')
    })

    await t.test('2. List returns saved events with from/to + category filters', async () => {
      // second event for filter coverage
      const res2 = await api(
        '/events',
        {
          body: JSON.stringify({
            title: 'CS Deadline',
            date: '2026-11-05',
            category: 'deadline',
            emoji: '🔥',
          }),
        },
        'POST'
      )
      assert.equal(res2.status, 201)
      createdIds.push(res2.body.data._id)

      const all = await api('/events')
      assert.equal(all.status, 200)
      assert.equal(all.body.data.length, 2)

      const ranged = await api('/events?from=2026-11-03&to=2026-11-30')
      assert.equal(ranged.body.data.length, 1)
      assert.equal(ranged.body.data[0].title, 'CS Deadline')

      const byCat = await api('/events?category=study')
      assert.equal(byCat.body.data.length, 1)
      assert.equal(byCat.body.data[0].title, 'Physics Midterm Study')
    })

    await t.test('3. Validation rejects bad payloads', async () => {
      const noTitle = await api('/events', { body: JSON.stringify({ date: '2026-11-02' }) }, 'POST')
      assert.equal(noTitle.status, 400)

      const badDate = await api(
        '/events',
        { body: JSON.stringify({ title: 'X', date: '11/02/2026' }) },
        'POST'
      )
      assert.equal(badDate.status, 400)

      const badTimes = await api(
        '/events',
        { body: JSON.stringify({ title: 'X', date: '2026-11-02', startTime: '16:00', endTime: '14:00' }) },
        'POST'
      )
      // end < start is rejected
      assert.equal(badTimes.status, 400)
    })

    await t.test('4. Update edits fields and merged end<start is rejected', async () => {
      const id = createdIds[0]
      const upd = await api(
        `/events/${id}`,
        { body: JSON.stringify({ emoji: '🤓', startTime: '09:00', endTime: '10:30' }) },
        'PATCH'
      )
      assert.equal(upd.status, 200)
      assert.equal(upd.body.data.emoji, '🤓')
      assert.equal(upd.body.data.startTime, '09:00')

      const merged = await api(`/events/${id}`, { body: JSON.stringify({ endTime: '08:00' }) }, 'PATCH')
      assert.equal(merged.status, 400)
    })

    await t.test('5. Ownership: nobody else can see, edit or delete my events', async () => {
      const id = createdIds[0]
      const list = await api2('/events')
      assert.equal(list.body.data.length, 0)

      const edit = await api2(`/events/${id}`, { body: JSON.stringify({ title: 'hacked' }) }, 'PATCH')
      assert.equal(edit.status, 404)

      const del = await api2(`/events/${id}`, {}, 'DELETE')
      assert.equal(del.status, 404)
    })

    await t.test('6. Delete removes the event permanently', async () => {
      const id = createdIds[1]
      const del = await api(`/events/${id}`, {}, 'DELETE')
      assert.equal(del.status, 200)

      const after = await api('/events')
      assert.equal(after.body.data.length, 1)

      const gone = await api(`/events/${id}`, {}, 'DELETE')
      assert.equal(gone.status, 404)
      createdIds = createdIds.filter((x) => x !== id)
    })

    await t.test('7. Date semantics survive a fake refresh (read-back equals write)', async () => {
      const res = await api(
        '/events',
        { body: JSON.stringify({ title: 'Refresh Check', date: '2026-12-31', emoji: '🎆' }) },
        'POST'
      )
      blindIds.push(res.body.data._id)

      // simulate a fresh client: just GET again
      const again = await api('/events?from=2026-12-01')
      assert.equal(again.body.data.length, 1)
      assert.equal(again.body.data[0].date, '2026-12-31')
      assert.equal(again.body.data[0].emoji, '🎆')
    })
  } finally {
    // ---- Teardown ----
    if (createdIds.length > 0) await CalendarEvent.deleteMany({ _id: { $in: createdIds } })
    if (createdIds.length > 0) await CalendarEvent.deleteMany({ _id: { $in: blindIds } })
    if (user2) await User.deleteOne({ _id: user2._id })
    await CalendarEvent.deleteMany({ owner: user._id })
    httpServer?.close()
    await mongoose.disconnect()
  }
})
