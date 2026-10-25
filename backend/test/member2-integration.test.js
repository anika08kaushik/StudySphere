import assert from 'node:assert/strict'
import test from 'node:test'
import { io } from 'socket.io-client'

const BASE_URL = 'http://localhost:5000'

test('Member 2 Collaboration Suite - Comprehensive Integration Tests', async (t) => {
  // 1. Chat Endpoints CRUD
  await t.test('Chat REST API: Create, Read, Edit, Pin, React, and Delete', async () => {
    // 1.1 Create Message
    const createRes = await fetch(`${BASE_URL}/api/groups/g1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Integration test message with @Rahul',
        mentions: ['u2'],
        attachments: [{ name: 'Test.pdf', url: 'http://test.pdf', fileType: 'pdf', size: 120 }],
      }),
    })
    const createData = await createRes.json()
    assert.strictEqual(createRes.status, 201)
    assert.ok(createData.data._id)
    assert.strictEqual(createData.data.content, 'Integration test message with @Rahul')
    const messageId = createData.data._id

    // 1.2 Get Messages
    const getRes = await fetch(`${BASE_URL}/api/groups/g1/messages`)
    const getData = await getRes.json()
    assert.strictEqual(getRes.status, 200)
    assert.ok(Array.isArray(getData.data))
    assert.ok(getData.data.some((m) => m._id === messageId))

    // 1.3 Edit Message
    const editRes = await fetch(`${BASE_URL}/api/messages/${messageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Edited message content' }),
    })
    const editData = await editRes.json()
    assert.strictEqual(editRes.status, 200)
    assert.strictEqual(editData.data.content, 'Edited message content')
    assert.strictEqual(editData.data.isEdited, true)

    // 1.4 Toggle Pin
    const pinRes = await fetch(`${BASE_URL}/api/messages/${messageId}/pin`, {
      method: 'PATCH',
    })
    const pinData = await pinRes.json()
    assert.strictEqual(pinRes.status, 200)

    // 1.5 Toggle Reaction
    const reactRes = await fetch(`${BASE_URL}/api/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji: '🔥' }),
    })
    assert.strictEqual(reactRes.status, 200)

    // 1.6 Delete Message
    const delRes = await fetch(`${BASE_URL}/api/messages/${messageId}`, {
      method: 'DELETE',
    })
    assert.strictEqual(delRes.status, 200)
  })

  // 2. Real-Time Socket.io Chat, Presence, Mentions, and Typing
  await t.test('Socket.IO Chat: Real-time broadcast, typing, and presence', async () => {
    const clientA = io(BASE_URL, { auth: { userId: 'u1', userName: 'Alice' } })
    const clientB = io(BASE_URL, { auth: { userId: 'u2', userName: 'Bob' } })

    await Promise.all([
      new Promise((r) => clientA.on('connect', r)),
      new Promise((r) => clientB.on('connect', r)),
    ])

    clientA.emit('group:join', 'g1')
    clientB.emit('group:join', 'g1')
    await new Promise((r) => setTimeout(r, 400))

    // Test Typing
    const typingPromise = new Promise((resolve) => {
      clientB.on('typing:update', (data) => {
        if (data.isTyping && data.userName === 'Alice') resolve(true)
      })
    })
    clientA.emit('typing:start', { groupId: 'g1' })
    const typingOk = await typingPromise
    assert.ok(typingOk)

    // Test Message with Mentions
    const messagePromise = new Promise((resolve) => {
      clientB.on('message:new', (msg) => {
        if (msg.content === 'Hey Bob check out this file!') resolve(msg)
      })
    })
    clientA.emit('message:send', {
      groupId: 'g1',
      content: 'Hey Bob check out this file!',
      mentions: ['u2'],
    })
    const receivedMsg = await messagePromise
    assert.strictEqual(receivedMsg.content, 'Hey Bob check out this file!')

    clientA.disconnect()
    clientB.disconnect()
  })

  // 3. Collaborative Notes: CRUD, Real-Time Editing, Versions, Rollback, Comments & Permissions
  await t.test('Collaborative Notes: Simultaneous sync, versions, comments & rollback', async () => {
    // 3.1 Fetch Note
    const noteRes = await fetch(`${BASE_URL}/api/notes/note-g1-default`)
    const noteData = await noteRes.json()
    assert.strictEqual(noteRes.status, 200)
    assert.ok(noteData.data.title)

    // 3.2 Update Note Content
    const updateRes = await fetch(`${BASE_URL}/api/notes/note-g1-default`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated CNN Research Notes',
        content: '# CNN Notes\n\nLive synchronized document content for study group.',
      }),
    })
    const updateData = await updateRes.json()
    assert.strictEqual(updateRes.status, 200)
    assert.strictEqual(updateData.data.title, 'Updated CNN Research Notes')

    // 3.3 Create Version Snapshot
    const verRes = await fetch(`${BASE_URL}/api/notes/note-g1-default/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: 'Checkpoint before exam' }),
    })
    const verData = await verRes.json()
    assert.strictEqual(verRes.status, 201)
    assert.ok(verData.data.version)
    const savedVersion = verData.data.version

    // 3.4 Rollback to Version
    const rollbackRes = await fetch(`${BASE_URL}/api/notes/note-g1-default/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId: savedVersion }),
    })
    const rollbackData = await rollbackRes.json()
    assert.strictEqual(rollbackRes.status, 200)
    assert.ok(rollbackData.message.includes('Restored'))

    // 3.5 Add Note Discussion Comment
    const commentRes = await fetch(`${BASE_URL}/api/notes/note-g1-default/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Check the formulas on line 12 @Anika',
        section: 'CNN Formulas',
        mentions: ['u3'],
      }),
    })
    const commentData = await commentRes.json()
    assert.strictEqual(commentRes.status, 201)
    const commentId = commentData.data._id

    // 3.6 Reply to Comment
    const replyRes = await fetch(`${BASE_URL}/api/notes/note-g1-default/comments/${commentId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Verified, formulas match lecture 4.' }),
    })
    assert.strictEqual(replyRes.status, 201)

    // 3.7 Resolve Comment
    const resolveRes = await fetch(`${BASE_URL}/api/notes/note-g1-default/comments/${commentId}/resolve`, {
      method: 'PATCH',
    })
    assert.strictEqual(resolveRes.status, 200)

    // 3.8 Test Real-time Note Sockets (Simultaneous Editing)
    const editor1 = io(BASE_URL, { auth: { userId: 'u1', userName: 'Alice' } })
    const editor2 = io(BASE_URL, { auth: { userId: 'u2', userName: 'Bob' } })

    await Promise.all([
      new Promise((r) => editor1.on('connect', r)),
      new Promise((r) => editor2.on('connect', r)),
    ])

    editor1.emit('note:join', { noteId: 'note-g1-default' })
    editor2.emit('note:join', { noteId: 'note-g1-default' })
    await new Promise((r) => setTimeout(r, 400))

    const noteSyncPromise = new Promise((resolve) => {
      editor2.on('note:remote_change', (data) => {
        if (data.content === '# Live Yjs Sync Test') resolve(data)
      })
    })

    editor1.emit('note:change', {
      noteId: 'note-g1-default',
      content: '# Live Yjs Sync Test',
      cursor: 'Line 1',
    })

    const synced = await noteSyncPromise
    assert.strictEqual(synced.content, '# Live Yjs Sync Test')

    editor1.disconnect()
    editor2.disconnect()
  })

  // 4. Notifications & Activities
  await t.test('Notifications and Activities: Retrieve, Mark Read, and Event Logs', async () => {
    // 4.1 Notifications API
    const notifRes = await fetch(`${BASE_URL}/api/notifications`)
    const notifData = await notifRes.json()
    assert.strictEqual(notifRes.status, 200)
    assert.ok(Array.isArray(notifData.data))

    // 4.2 Mark All Read
    const markAllRes = await fetch(`${BASE_URL}/api/notifications/read-all`, {
      method: 'PATCH',
    })
    assert.strictEqual(markAllRes.status, 200)

    // 4.3 Activities Feed
    const actRes = await fetch(`${BASE_URL}/api/activities`)
    const actData = await actRes.json()
    assert.strictEqual(actRes.status, 200)
    assert.ok(Array.isArray(actData.data))

    // 4.4 Create Activity
    const createActRes = await fetch(`${BASE_URL}/api/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'completed integration test session',
        target: 'StudySphere Hub',
        type: 'complete',
      }),
    })
    assert.strictEqual(createActRes.status, 201)
  })
})
