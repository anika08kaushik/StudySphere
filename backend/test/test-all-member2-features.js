import assert from 'node:assert'
import test from 'node:test'
import http from 'node:http'
import jwt from 'jsonwebtoken'
import { io as Client } from 'socket.io-client'

const BASE_URL = 'http://localhost:5000'
const JWT_SECRET = process.env.JWT_SECRET || 'studysphere_jwt_secret_key_2026'

// Real test users in MongoDB
const USER_A = {
  id: '6adb970bec3ad6d6f1fb3f58',
  name: 'jojo',
  email: 'jojo123@gmail.com',
}
const USER_B = {
  id: '6a8df9ce491372fcd9138b2c',
  name: 'xiena vij',
  email: 'vijxiena@gmail.com',
}

// Target group in MongoDB (ml group)
const GROUP_ID = '6a8ded7a211667f96f1ca5e1'
const LOUNGE_ID = '6adba5f22f2a151cd35c6192'

const tokenA = jwt.sign({ userId: USER_A.id }, JWT_SECRET, { expiresIn: '1d' })
const tokenB = jwt.sign({ userId: USER_B.id }, JWT_SECRET, { expiresIn: '1d' })

const api = async (endpoint, options = {}, token = tokenA) => {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

const createSocket = (token, user) => {
  return Client(BASE_URL, {
    auth: { token, userId: user.id, userName: user.name },
    transports: ['websocket'],
    forceNew: true,
  })
}

test('Comprehensive Dynamic Verification for Member 2 Suite', async (t) => {
  let socketA
  let socketB

  t.before(async () => {
    socketA = createSocket(tokenA, USER_A)
    socketB = createSocket(tokenB, USER_B)

    await Promise.all([
      new Promise((res) => socketA.on('connect', res)),
      new Promise((res) => socketB.on('connect', res)),
    ])
  })

  t.after(() => {
    socketA?.disconnect()
    socketB?.disconnect()
  })

  // ==========================================
  // SECTION A: CHAT
  // ==========================================
  await t.test('Section A: Chat Functionality', async (st) => {
    socketA.emit('group:join', GROUP_ID)
    socketB.emit('group:join', GROUP_ID)
    await new Promise((r) => setTimeout(r, 200))

    let testMessageId = null

    // A.1 Send message from User A and receive instantly as User B
    await st.test('Send message from User A and receive instantly as User B', async () => {
      const receivePromise = new Promise((resolve) => {
        socketB.once('message:new', (msg) => {
          assert.strictEqual(msg.content, 'Hello from User A - Dynamic Verification')
          testMessageId = msg._id
          resolve(msg)
        })
      })

      socketA.emit('message:send', {
        groupId: GROUP_ID,
        content: 'Hello from User A - Dynamic Verification',
        clientTempId: `temp-${Date.now()}`,
      })

      const received = await receivePromise
      assert.ok(received._id, 'Message should have a valid database _id')
    })

    // A.2 Refresh the page and confirm message history remains in DB
    await st.test('Refresh and confirm message history remains persisted in DB', async () => {
      const { status, data } = await api(`/api/groups/${GROUP_ID}/messages`, {}, tokenB)
      assert.strictEqual(status, 200)
      assert.ok(Array.isArray(data.data))
      const found = data.data.find((m) => m._id === testMessageId)
      assert.ok(found, 'Message must be persisted in database')
    })

    // A.3 Test edit, delete, reply, reactions and pinning
    await st.test('Test edit, delete, reply, reactions and pinning', async () => {
      // Edit
      const editPromise = new Promise((resolve) => {
        socketB.once('message:edited', (evt) => {
          assert.strictEqual(evt.messageId, testMessageId)
          assert.strictEqual(evt.content, 'Updated content by User A')
          resolve()
        })
      })
      socketA.emit('message:edit', {
        groupId: GROUP_ID,
        messageId: testMessageId,
        content: 'Updated content by User A',
      })
      await editPromise

      // Reactions
      const reactPromise = new Promise((resolve) => {
        socketB.once('message:reaction_update', (evt) => {
          assert.strictEqual(evt.messageId, testMessageId)
          assert.strictEqual(evt.emoji, '🔥')
          resolve()
        })
      })
      socketA.emit('message:react', {
        groupId: GROUP_ID,
        messageId: testMessageId,
        emoji: '🔥',
      })
      await reactPromise

      // Pin
      const pinPromise = new Promise((resolve) => {
        socketB.once('message:pinned', (evt) => {
          assert.strictEqual(evt.messageId, testMessageId)
          assert.strictEqual(evt.pinned, true)
          resolve()
        })
      })
      socketA.emit('message:pin', {
        groupId: GROUP_ID,
        messageId: testMessageId,
        pinned: true,
      })
      await pinPromise

      // Reply
      const replyPromise = new Promise((resolve) => {
        socketA.once('message:new', (msg) => {
          assert.strictEqual(msg.content, 'Replying to your note!')
          assert.ok(msg.replyTo)
          assert.strictEqual(msg.replyTo.messageId, testMessageId)
          resolve()
        })
      })
      socketB.emit('message:send', {
        groupId: GROUP_ID,
        content: 'Replying to your note!',
        replyTo: {
          messageId: testMessageId,
          senderName: 'jojo',
          content: 'Updated content by User A',
        },
      })
      await replyPromise

      // Delete
      const deletePromise = new Promise((resolve) => {
        socketB.once('message:deleted', (evt) => {
          assert.strictEqual(evt.messageId, testMessageId)
          resolve()
        })
      })
      socketA.emit('message:delete', {
        groupId: GROUP_ID,
        messageId: testMessageId,
      })
      await deletePromise
    })

    // A.4 Test search, mentions and attachments
    await st.test('Test mentions and attachments', async () => {
      const attachPromise = new Promise((resolve) => {
        socketB.once('message:new', (msg) => {
          assert.ok(msg.attachments && msg.attachments.length > 0)
          assert.strictEqual(msg.attachments[0].name, 'TestDocument.pdf')
          resolve(msg)
        })
      })

      socketA.emit('message:send', {
        groupId: GROUP_ID,
        content: '@xiena vij please review the attached PDF',
        mentions: [USER_B.id],
        attachments: [
          {
            name: 'TestDocument.pdf',
            url: 'data:application/pdf;base64,JVBERi0xLjQK...',
            fileType: 'pdf',
            size: 45,
          },
        ],
      })

      const msgWithAttach = await attachPromise
      assert.ok(msgWithAttach._id)

      // Verify search finds the message with PDF
      const { status: searchStatus, data: searchData } = await api(
        `/api/groups/${GROUP_ID}/messages?search=TestDocument`,
        {},
        tokenB
      )
      assert.strictEqual(searchStatus, 200)
      assert.ok(
        searchData.data.some((m) => m._id === msgWithAttach._id),
        'Search query must return matching message'
      )
    })
  })

  // ==========================================
  // SECTION B: SOCKET.IO AND PRESENCE
  // ==========================================
  await t.test('Section B: Socket.IO and Presence', async (st) => {
    // B.1 Confirm typing indicator between sessions
    await st.test('Confirm typing indicator broadcast between sessions', async () => {
      const typingPromise = new Promise((resolve) => {
        socketB.once('typing:update', (evt) => {
          assert.strictEqual(evt.userId, USER_A.id)
          assert.strictEqual(evt.userName, USER_A.name)
          assert.strictEqual(evt.isTyping, true)
          resolve()
        })
      })

      socketA.emit('typing:start', { groupId: GROUP_ID })
      await typingPromise
    })

    // B.2 Confirm presence update contains both sessions
    await st.test('Confirm presence update between sessions', async () => {
      const presencePromise = new Promise((resolve) => {
        socketA.once('presence:update', (evt) => {
          assert.strictEqual(evt.groupId, GROUP_ID)
          assert.ok(Array.isArray(evt.members))
          const hasUserA = evt.members.some((m) => String(m.id || m._id) === USER_A.id)
          const hasUserB = evt.members.some((m) => String(m.id || m._id) === USER_B.id)
          assert.ok(hasUserA, 'Presence should include User A')
          assert.ok(hasUserB, 'Presence should include User B')
          resolve()
        })
      })

      // Re-trigger join to get presence update
      socketB.emit('group:join', GROUP_ID)
      await presencePromise
    })

    // B.3 Room isolation: Join two different groups and verify isolation
    await st.test('Verify events stay isolated between different groups', async () => {
      const socketC = createSocket(tokenA, USER_A)
      await new Promise((res) => socketC.on('connect', res))

      // User A (socketC) joins Student Lounge
      socketC.emit('group:join', LOUNGE_ID)
      await new Promise((r) => setTimeout(r, 100))

      let leaked = false
      const leakListener = (msg) => {
        if (msg.groupId === LOUNGE_ID) leaked = true
      }
      socketB.on('message:new', leakListener)

      // Send to Student Lounge only
      socketC.emit('message:send', {
        groupId: LOUNGE_ID,
        content: 'Lounge only message',
      })

      await new Promise((r) => setTimeout(r, 200))
      socketB.off('message:new', leakListener)
      socketC.disconnect()

      assert.strictEqual(leaked, false, 'Message from Student Lounge must not leak to ml group')
    })

    // B.4 Rejection of unauthorized group access
    await st.test('Reject unauthorized group access', async () => {
      // Fake non-existent or restricted group ID
      const fakeGroupId = '6a8e02f53aabe0b3c13f69b5' // bug group where User A is not active member
      const errorPromise = new Promise((resolve) => {
        socketA.once('chat:error', (err) => {
          assert.ok(err.message)
          resolve()
        })
      })

      socketA.emit('group:join', fakeGroupId)
      await errorPromise
    })
  })

  // ==========================================
  // SECTION C: NOTIFICATIONS
  // ==========================================
  await t.test('Section C: Notifications', async (st) => {
    let createdNotificationId = null

    // C.1 Trigger chat mention and verify recipient gets notified
    await st.test('Trigger a chat mention and verify recipient receives notification', async () => {
      // User A mentions User B
      socketA.emit('message:send', {
        groupId: GROUP_ID,
        content: 'Hey @xiena vij please check notifications module!',
        mentions: [USER_B.id],
      })

      await new Promise((r) => setTimeout(r, 250))

      const { status, data } = await api('/api/notifications', {}, tokenB)
      assert.strictEqual(status, 200)
      assert.ok(Array.isArray(data.data))
      const mentionNotif = data.data.find(
        (n) => n.type === 'mention' && n.message?.includes('notifications module')
      )
      assert.ok(mentionNotif, 'Recipient must have received mention notification')
      createdNotificationId = mentionNotif._id
    })

    // C.2 Refresh and confirm notification persists
    await st.test('Refresh and confirm the notification persists in MongoDB', async () => {
      const { status, data } = await api('/api/notifications', {}, tokenB)
      assert.strictEqual(status, 200)
      const found = data.data.find((n) => n._id === createdNotificationId)
      assert.ok(found, 'Notification must persist after refresh')
      assert.strictEqual(found.read, false)
    })

    // C.3 Mark read and verify state updates
    await st.test('Mark notification as read and verify state updates', async () => {
      const { status: markStatus } = await api(
        `/api/notifications/${createdNotificationId}/read`,
        { method: 'PATCH' },
        tokenB
      )
      assert.strictEqual(markStatus, 200)

      const { data } = await api('/api/notifications', {}, tokenB)
      const updated = data.data.find((n) => n._id === createdNotificationId)
      assert.strictEqual(updated.read, true, 'Notification should be marked read')
    })
  })

  // ==========================================
  // SECTION D: ACTIVITY FEED
  // ==========================================
  await t.test('Section D: Activity Feed', async (st) => {
    let testActivityId = null

    // D.1 Perform a supported action and confirm activity record is created
    await st.test('Perform supported action and confirm activity record is created', async () => {
      const { status, data } = await api(
        '/api/activities',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'completed Deep Learning Quiz',
            target: 'Module 3',
            type: 'complete',
            groupId: GROUP_ID,
          }),
        },
        tokenA
      )

      assert.strictEqual(status, 201)
      assert.ok(data.data?._id)
      testActivityId = data.data._id
      assert.strictEqual(data.data.action, 'completed Deep Learning Quiz')
      assert.strictEqual(data.data.target, 'Module 3')
      assert.strictEqual(data.data.userName, USER_A.name)
    })

    // D.2 Refresh and confirm record persists
    await st.test('Refresh and confirm activity feed persists', async () => {
      const { status, data } = await api(`/api/activities?groupId=${GROUP_ID}`, {}, tokenB)
      assert.strictEqual(status, 200)
      assert.ok(Array.isArray(data.data))
      const found = data.data.find((a) => a._id === testActivityId)
      assert.ok(found, 'Activity record must persist in database')
      assert.strictEqual(found.userName, USER_A.name)
    })
  })

  // ==========================================
  // SECTION E: COLLABORATIVE NOTES
  // ==========================================
  await t.test('Section E: Collaborative Notes', async (st) => {
    // E.1 Get or create note in group
    let noteId = null
    const { status: listStatus, data: listData } = await api(
      `/api/groups/${GROUP_ID}/notes`,
      {},
      tokenA
    )
    assert.strictEqual(listStatus, 200)
    assert.ok(Array.isArray(listData.data))
    noteId = listData.data[0]._id
    assert.ok(noteId, 'Must have a valid noteId in group')

    // E.2 Real-time synchronization
    await st.test('Open same note in two sessions and verify real-time sync', async () => {
      socketA.emit('note:join', { noteId })
      socketB.emit('note:join', { noteId })
      await new Promise((r) => setTimeout(r, 100))

      const syncPromise = new Promise((resolve) => {
        socketB.once('note:remote_change', (evt) => {
          assert.strictEqual(evt.noteId, noteId)
          assert.strictEqual(evt.content, 'Real-time collaborative edits from User A')
          assert.strictEqual(evt.userName, USER_A.name)
          resolve()
        })
      })

      socketA.emit('note:change', {
        noteId,
        content: 'Real-time collaborative edits from User A',
        cursor: 'Line 5',
      })

      await syncPromise
    })

    // E.3 Version history and rollback
    let newVersionTag = null
    await st.test('Test version history creation and rollback', async () => {
      // Create version snapshot
      const { status: vStatus, data: vData } = await api(
        `/api/notes/${noteId}/versions`,
        {
          method: 'POST',
          body: JSON.stringify({ summary: 'Automated Test Milestone Snapshot' }),
        },
        tokenA
      )
      assert.strictEqual(vStatus, 201)
      assert.ok(vData.data?.version)
      newVersionTag = vData.data.version

      // Edit note content
      await api(
        `/api/notes/${noteId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Temporary Note Title',
            content: 'Temporary content before rollback',
          }),
        },
        tokenA
      )

      // Rollback to version
      const { status: rbStatus, data: rbData } = await api(
        `/api/notes/${noteId}/rollback`,
        {
          method: 'POST',
          body: JSON.stringify({ versionId: newVersionTag }),
        },
        tokenA
      )
      assert.strictEqual(rbStatus, 200)
      assert.ok(rbData.data)
    })

    // E.4 Comments, replies and resolve
    await st.test('Test comments, replies, and resolution', async () => {
      // Add comment
      const { status: cStatus, data: cData } = await api(
        `/api/notes/${noteId}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: 'Could we elaborate on ReLU activation formula?',
            section: 'Formula Reference',
          }),
        },
        tokenB
      )
      assert.strictEqual(cStatus, 201)
      const commentId = cData.data._id
      assert.ok(commentId)

      // Reply to comment
      const { status: repStatus, data: repData } = await api(
        `/api/notes/${noteId}/comments/${commentId}/reply`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: 'Yes! Added ReLU: max(0, x).',
          }),
        },
        tokenA
      )
      assert.strictEqual(repStatus, 201)
      assert.ok(repData.data?._id && repData.data?.content === 'Yes! Added ReLU: max(0, x).')
      assert.ok(repData.comment?.replies && repData.comment.replies.length > 0)

      // Resolve comment
      const { status: resStatus, data: resData } = await api(
        `/api/notes/${noteId}/comments/${commentId}/resolve`,
        { method: 'PATCH' },
        tokenA
      )
      assert.strictEqual(resStatus, 200)
      assert.strictEqual(resData.data.resolved, true)
    })

    // E.5 Edits persist after refresh
    await st.test('Verify note edits persist in MongoDB across refresh', async () => {
      await api(
        `/api/notes/${noteId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Verified Persistent Note',
            content: 'Persisted content in MongoDB',
          }),
        },
        tokenA
      )

      const { status, data } = await api(`/api/notes/${noteId}`, {}, tokenB)
      assert.strictEqual(status, 200)
      assert.strictEqual(data.data.title, 'Verified Persistent Note')
      assert.strictEqual(data.data.content, 'Persisted content in MongoDB')
    })
  })
})
