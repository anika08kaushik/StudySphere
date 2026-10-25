import 'dotenv/config'
import assert from 'node:assert/strict'
import test from 'node:test'
import express from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

import authenticate from '../src/middleware/authMiddleware.js'
import focusRoutes from '../src/routes/focusRoutes.js'
import User from '../src/models/User.js'
import FocusSession from '../src/models/FocusSession.js'
import FocusTimerState from '../src/models/FocusTimerState.js'

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret'

const BASE = 25 * 60 // 1500s

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

test('Phase 7: Persistent focus timer state & session dedupe', async (t) => {
  let app
  let server
  let port
  let token
  let userId

  t.before(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studysphere')
    }

    const user = await User.findOne({ email: 'leader@test.com' })
    userId = user._id
    token = jwt.sign({ userId: user._id, name: user.name }, JWT_SECRET, { expiresIn: '1d' })

    // Clean the actor's state created by previous runs so tests are repeatable
    await FocusTimerState.deleteMany({ user: userId })

    app = express()
    app.use(express.json())
    app.use('/api/focus', authenticate, focusRoutes)

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve)
    })
    port = server.address().port
  })

  t.after(async () => {
    await FocusTimerState.deleteMany({ user: userId })
    server?.close()
    await mongoose.disconnect()
  })

  const api = async (path, options = {}) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/focus${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
    return { status: response.status, body: await response.json().catch(() => null) }
  }

  await t.test('1. POST /timer upserts running state anchored to wall clock', async () => {
    const res = await api('/timer', {
      method: 'POST',
      body: JSON.stringify({
        groupId: 'room_test',
        mode: 'FOCUS',
        remainingSeconds: BASE,
        isRunning: true,
        focusElapsedSeconds: 120,
        sessionStartedAt: new Date(Date.now() - 120000).toISOString(),
      }),
    })
    assert.equal(res.status, 200)
    assert.equal(res.body.data.isRunning, true)
    assert.equal(res.body.data.remainingSeconds, BASE)
    assert.equal(res.body.data.focusElapsedSeconds, 120)
    assert.ok(res.body.data.lastRunningUpdatedAt)
  })

  await t.test('2. GET /timer derives elapsed focus seconds while running', async () => {
    await wait(1200)
    const res = await api('/timer?groupId=room_test')
    assert.equal(res.status, 200)
    assert.equal(res.body.data.isRunning, true)
    // Server must count the wall-clock seconds since the last save
    assert.ok(res.body.data.remainingSeconds < BASE, 'remaining seconds decreased')
    assert.ok(res.body.data.focusElapsedSeconds > 120, 'focused time grew with elapsed running time')
  })

  await t.test('3. Pause freezes exact values; paused time is not counted', async () => {
    const before = await api('/timer?groupId=room_test')
    const pauseRes = await api('/timer', {
      method: 'POST',
      body: JSON.stringify({
        groupId: 'room_test',
        mode: 'FOCUS',
        remainingSeconds: before.body.data.remainingSeconds,
        isRunning: false,
        focusElapsedSeconds: before.body.data.focusElapsedSeconds,
        sessionStartedAt: new Date(Date.now() - 120000).toISOString(),
      }),
    })
    assert.equal(pauseRes.status, 200)
    assert.equal(pauseRes.body.data.isRunning, false)
    assert.equal(pauseRes.body.data.lastRunningUpdatedAt, null)

    await wait(600)
    const after = await api('/timer?groupId=room_test')
    assert.equal(after.body.data.remainingSeconds, before.body.data.remainingSeconds)
    assert.equal(after.body.data.focusElapsedSeconds, before.body.data.focusElapsedSeconds)
    assert.equal(after.body.data.isRunning, false)
    assert.notEqual(after.body.data.completedWhileAway, true)
  })

  await t.test('4. Timer that expired while away reports completedWhileAway', async () => {
    // Simulate a running timer that was last synced 40 minutes ago
    await FocusTimerState.findOneAndUpdate(
      { user: userId, groupId: 'room_test' },
      {
        isRunning: true,
        mode: 'FOCUS',
        remainingSeconds: 60,
        focusElapsedSeconds: 1440,
        lastRunningUpdatedAt: new Date(Date.now() - 40 * 60 * 1000),
        sessionStartedAt: new Date(Date.now() - 50 * 60 * 1000),
      }
    )

    const res = await api('/timer?groupId=room_test')
    assert.equal(res.body.data.completedWhileAway, true)
    assert.equal(res.body.data.remainingSeconds, 0)
    assert.equal(res.body.data.isRunning, false)
    // Expired seconds counted as focused, not lost
    assert.ok(res.body.data.focusElapsedSeconds >= 1500)
  })

  await t.test('5. DELETE /timer removes state', async () => {
    const res = await api('/timer?groupId=room_test', { method: 'DELETE' })
    assert.equal(res.status, 200)
    const empty = await FocusTimerState.findOne({ user: userId, groupId: 'room_test' })
    assert.equal(empty, null)
  })

  await t.test('6. Duplicate completion with same eventId is rejected silently', async () => {
    const eventId = 'evt-phase7-dedupe'
    const payload = JSON.stringify({
      eventId,
      duration: 125,
      status: 'COMPLETED',
      sessionType: 'FOCUS',
      startTime: new Date(Date.now() - 125000).toISOString(),
    })

    const first = await api('/sessions', { method: 'POST', body: payload })
    assert.equal(first.status, 201)

    const retry = await api('/sessions', { method: 'POST', body: payload })
    assert.equal(retry.status, 200)
    assert.equal(retry.body.message, 'Focus session already recorded')
    assert.equal(String(retry.body.data._id), String(first.body.data._id))

    const count = await FocusSession.countDocuments({ user: userId, eventId })
    assert.equal(count, 1, 'exactly one session persisted for the event')
    await FocusSession.deleteOne({ user: userId, eventId })
  })

  await t.test('7. Streak day keys use the local timezone, not UTC', async () => {
    // Simulate a session whose UTC date differs from the local date by
    // creating one "today" and one "yesterday" locally, plus validating that
    // stats keys come from a local calendar rather than UTC hours.
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)
    const yesterday = new Date(today.getTime() - 86400000)

    await FocusSession.insertMany([
      { user: userId, startTime: today, endTime: today, duration: 600, status: 'COMPLETED', sessionType: 'FOCUS' },
      { user: userId, startTime: yesterday, endTime: yesterday, duration: 600, status: 'COMPLETED', sessionType: 'FOCUS' },
    ])

    const stats = (await api('/stats')).body?.data
    assert.equal(stats.totalCompletedSessions >= 2, true)
    assert.equal(stats.currentStreak >= 2, true, 'yesterday + today form a streak')

    // The reported today minutes must include exactly the sessions started today
    const dailyToday = stats.dailyBreakdown?.[stats.dailyBreakdown.length - 1]
    assert.equal(dailyToday.date, `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`)

    await FocusSession.deleteMany({
      user: userId,
      startTime: { $gte: yesterday },
      duration: 600,
    })
  })
})
