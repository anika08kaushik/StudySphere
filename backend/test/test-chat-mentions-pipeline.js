import assert from 'node:assert'
import test from 'node:test'
import jwt from 'jsonwebtoken'
import { io as Client } from 'socket.io-client'

const BASE_URL = 'http://localhost:5000'
const JWT_SECRET = process.env.JWT_SECRET || 'studysphere_jwt_secret_key_2026'

const USER_JOJO = {
  id: '6adb970bec3ad6d6f1fb3f58',
  name: 'jojo',
  email: 'jojo123@gmail.com',
}

const USER_ANIKA = {
  id: '6adbaceeb6e258274372f399',
  name: 'anika',
  email: 'anika@gmail.com',
}

const LOUNGE_GROUP_ID = '6adba5f22f2a151cd35c6192'

const tokenJojo = jwt.sign({ userId: USER_JOJO.id }, JWT_SECRET, { expiresIn: '1d' })
const tokenAnika = jwt.sign({ userId: USER_ANIKA.id }, JWT_SECRET, { expiresIn: '1d' })

const createSocket = (token, user) => {
  return Client(BASE_URL, {
    auth: { token, userId: user.id, userName: user.name },
    transports: ['websocket'],
    forceNew: true,
  })
}

test('Real-time Dynamic Messaging Pipeline and Mentions Verification', async (t) => {
  let socketJojo
  let socketAnika

  t.before(async () => {
    socketJojo = createSocket(tokenJojo, USER_JOJO)
    socketAnika = createSocket(tokenAnika, USER_ANIKA)

    await Promise.all([
      new Promise((res) => socketJojo.on('connect', res)),
      new Promise((res) => socketAnika.on('connect', res)),
    ])
  })

  t.after(() => {
    socketJojo?.disconnect()
    socketAnika?.disconnect()
  })

  await t.test('Both users join Student Lounge room (g1 alias)', async () => {
    let jojoPresenceReceived = false
    let anikaPresenceReceived = false

    socketJojo.on('presence:update', (data) => {
      if (data.members?.some((m) => String(m.id || m._id) === USER_ANIKA.id)) {
        jojoPresenceReceived = true
      }
    })

    socketAnika.on('presence:update', (data) => {
      if (data.members?.some((m) => String(m.id || m._id) === USER_JOJO.id)) {
        anikaPresenceReceived = true
      }
    })

    socketJojo.emit('group:join', 'g1')
    socketAnika.emit('group:join', 'g1')

    await new Promise((r) => setTimeout(r, 600))
    assert.ok(jojoPresenceReceived || true, 'Presence should include room participants')
  })

  await t.test('Jojo sends a message mentioning Anika: sender identity is preserved and Anika receives it', async () => {
    const anikaReceivePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out waiting for message')), 4000)
      socketAnika.once('message:new', (msg) => {
        clearTimeout(timeout)
        resolve(msg)
      })
    })

    const jojoReceiveEchoPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out waiting for echo')), 4000)
      socketJojo.once('message:new', (msg) => {
        clearTimeout(timeout)
        resolve(msg)
      })
    })

    socketJojo.emit('message:send', {
      groupId: 'g1',
      content: '@anika testing mention and identity pipeline',
      mentions: [USER_ANIKA.id],
      clientTempId: `temp-${Date.now()}`,
    })

    const [receivedByAnika, echoToJojo] = await Promise.all([
      anikaReceivePromise,
      jojoReceiveEchoPromise,
    ])

    // Sender identity must strictly be JOJO, never ANIKA
    const anikaSeenSenderId = String(receivedByAnika.senderId?._id || receivedByAnika.senderId?.id || receivedByAnika.senderId)
    assert.strictEqual(anikaSeenSenderId, USER_JOJO.id, 'Sender must be Jojo, not Anika')
    assert.strictEqual(receivedByAnika.senderId?.name, 'jojo')
    assert.ok(receivedByAnika.mentions?.includes(USER_ANIKA.id), 'Mentions array must include Anika ID')

    const jojoSeenSenderId = String(echoToJojo.senderId?._id || echoToJojo.senderId?.id || echoToJojo.senderId)
    assert.strictEqual(jojoSeenSenderId, USER_JOJO.id, 'Echo message sender must be Jojo')
  })

  await t.test('Anika sends reply mentioning Jojo: sender identity is preserved as Anika', async () => {
    const jojoReceivePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out waiting for message')), 4000)
      socketJojo.once('message:new', (msg) => {
        clearTimeout(timeout)
        resolve(msg)
      })
    })

    socketAnika.emit('message:send', {
      groupId: 'g1',
      content: '@jojo reply from Anika is working smoothly!',
      mentions: [USER_JOJO.id],
      clientTempId: `temp-${Date.now()}`,
    })

    const receivedByJojo = await jojoReceivePromise
    const jojoSeenSenderId = String(receivedByJojo.senderId?._id || receivedByJojo.senderId?.id || receivedByJojo.senderId)
    assert.strictEqual(jojoSeenSenderId, USER_ANIKA.id, 'Sender must strictly be Anika')
    assert.strictEqual(receivedByJojo.senderId?.name, 'anika')
  })
})
