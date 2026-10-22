import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import net from 'node:net'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import User from '../src/models/User.js'

const backendPath = fileURLToPath(new URL('../', import.meta.url))
const baseMongoUri = process.env.MEMBER1_TEST_MONGO_URI
const testMongoUri = baseMongoUri
  ? (() => {
      const uri = new URL(baseMongoUri)
      if (
        !['127.0.0.1', 'localhost', '[::1]'].includes(uri.hostname) ||
        uri.username ||
        uri.password
      ) {
        throw new Error('MEMBER1_TEST_MONGO_URI must use local MongoDB without credentials')
      }
      uri.pathname = `/studysphere_member1_test_${process.pid}_${Date.now()}`
      return uri.toString()
    })()
  : null

const getAvailablePort = async () => {
  const server = net.createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const { port } = server.address()
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  return port
}

const runSeed = (mongoUri) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['src/seed.js'], {
      cwd: backendPath,
      env: { ...process.env, MONGO_URI: mongoUri },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })
    child.once('error', reject)
    child.once('close', (code) => {
      if (code === 0) resolve(output)
      else reject(new Error(`Seed process exited with code ${code}: ${output}`))
    })
  })

test('Member 1 authentication, profile, group, membership, invitation, and leader workflow', {
  skip: testMongoUri ? false : 'Set MEMBER1_TEST_MONGO_URI to a local MongoDB URI to run the integration workflow',
}, async (t) => {
  const mongoConnection = await mongoose.createConnection(testMongoUri, {
    serverSelectionTimeoutMS: 2000,
  }).asPromise()
  await mongoConnection.db.admin().command({ ping: 1 })
  await mongoConnection.close()

  const port = await getAvailablePort()
  const tokenSecret = `member1-test-secret-${process.pid}-${Date.now()}`
  const serverProcess = spawn(process.execPath, ['src/server.js'], {
    cwd: backendPath,
    env: {
      ...process.env,
      MONGO_URI: testMongoUri,
      JWT_SECRET: tokenSecret,
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let diagnostics = ''
  serverProcess.once('error', (error) => { diagnostics += `Spawn error: ${error.message}` })
  serverProcess.once('exit', (code, signal) => { diagnostics += `Process exit: ${code ?? signal}` })
  serverProcess.stdout.on('data', (chunk) => { diagnostics += chunk })
  serverProcess.stderr.on('data', (chunk) => { diagnostics += chunk })

  const apiUrl = `http://127.0.0.1:${port}/api`
  const request = async (method, route, token, body) => {
    const response = await fetch(`${apiUrl}${route}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    return { status: response.status, json: await response.json() }
  }

  t.after(async () => {
    if (serverProcess.exitCode === null) {
      serverProcess.kill()
      await once(serverProcess, 'close')
    }
    const connection = await mongoose.createConnection(testMongoUri).asPromise()
    await connection.dropDatabase()
    await connection.close()
  })

  let health
  let connectionError
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`Backend exited before becoming ready: ${diagnostics}`)
    }
    try {
      health = await fetch(`${apiUrl}/health`)
      if (health.ok) break
    } catch (error) {
      connectionError = error.message
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  assert.equal(
    health?.status,
    200,
    `Backend did not become ready on port ${port}: ${connectionError || 'no response'} ${diagnostics}`,
  )

  await runSeed(testMongoUri)
  await runSeed(testMongoUri)
  const seededLogin = await request('POST', '/auth/login', undefined, {
    email: 'leader@test.com',
    password: 'password123',
  })
  assert.equal(seededLogin.status, 200)

  const unauthenticated = await request('GET', '/users/profile')
  assert.equal(unauthenticated.status, 401)

  const unique = `${process.pid}.${Date.now()}`
  const register = async (name, email) => request('POST', '/auth/register', undefined, {
    name,
    email,
    password: 'correct-horse-7',
  })
  const leaderRegistration = await register('Workflow Leader', `leader.${unique}@example.test`)
  const studentRegistration = await register('Workflow Student', `student.${unique}@example.test`)
  assert.equal(leaderRegistration.status, 201)
  assert.equal(studentRegistration.status, 201)
  const leaderToken = leaderRegistration.json.data.token
  const studentToken = studentRegistration.json.data.token
  assert.ok(leaderToken)
  assert.ok(studentToken)

  assert.equal((await register('Duplicate User', `leader.${unique}@example.test`)).status, 409)
  assert.equal((await request('POST', '/auth/login', undefined, {
    email: `LEADER.${unique}@example.test`,
    password: 'correct-horse-7',
  })).status, 200)
  assert.equal((await request('POST', '/auth/login', undefined, {
    email: `leader.${unique}@example.test`,
    password: 'wrong-password',
  })).status, 401)

  const profile = await request('GET', '/users/profile', leaderToken)
  assert.equal(profile.status, 200)
  assert.equal(profile.json.data.email, `leader.${unique}@example.test`)
  assert.equal('password' in profile.json.data, false)
  const profileUpdate = await request('PUT', '/users/profile', leaderToken, {
    name: 'Workflow Leader Updated',
    department: 'Computer Science',
    semester: 6,
  })
  assert.equal(profileUpdate.status, 200)
  assert.equal(profileUpdate.json.data.name, 'Workflow Leader Updated')
  assert.equal((await request('GET', '/users/profile', leaderToken)).json.data.name, 'Workflow Leader Updated')

  const testConnection = await mongoose.createConnection(testMongoUri).asPromise()
  let rawUser
  try {
    const TestUser = testConnection.model('User', User.schema)
    rawUser = await TestUser.findOne({ email: `leader.${unique}@example.test` }).select('+password')
    assert.notEqual(rawUser.password, 'correct-horse-7')
    assert.equal(await bcrypt.compare('correct-horse-7', rawUser.password), true)
  } finally {
    await testConnection.close()
  }

  const createdGroup = await request('POST', '/groups', leaderToken, {
    name: 'Workflow Study Group',
    description: 'Member 1 integration test',
    subjects: ['Testing'],
  })
  assert.equal(createdGroup.status, 201)
  const groupId = createdGroup.json.data._id
  const groupList = await request('GET', '/groups', studentToken)
  assert.equal(groupList.status, 200)
  assert.equal(groupList.json.data.find((group) => group._id === groupId).joined, false)
  const myGroups = await request('GET', '/groups/me', leaderToken)
  assert.equal(myGroups.json.data.length, 1)
  assert.equal(myGroups.json.data[0].role, 'leader')

  assert.equal((await request('PUT', `/groups/${groupId}`, studentToken, { name: 'Not allowed' })).status, 403)
  const updateGroup = await request('PUT', `/groups/${groupId}`, leaderToken, {
    name: 'Workflow Study Group Updated',
    subjects: ['Testing', 'Databases'],
  })
  assert.equal(updateGroup.status, 200)
  assert.equal(updateGroup.json.data.name, 'Workflow Study Group Updated')

  const join = await request('POST', `/groups/${groupId}/join`, studentToken)
  assert.equal(join.status, 201)
  assert.equal(join.json.data.role, 'student')
  assert.equal((await request('POST', `/groups/${groupId}/join`, studentToken)).status, 409)
  const seededStudent1Token = (await request('POST', '/auth/login', undefined, {
    email: 'student1@test.com',
    password: 'password123',
  })).json.data.token
  assert.equal((await request('POST', '/groups/join', seededStudent1Token, { groupId })).status, 201)
  assert.equal((await request('GET', `/groups/${groupId}/members`, studentToken)).json.data.length, 3)

  const invite = await request('POST', `/groups/${groupId}/invitations`, leaderToken, {
    email: 'student2@test.com',
  })
  assert.equal(invite.status, 201)
  const seededStudentToken = (await request('POST', '/auth/login', undefined, {
    email: 'student2@test.com',
    password: 'password123',
  })).json.data.token
  const invitations = await request('GET', '/groups/invitations', seededStudentToken)
  assert.equal(invitations.status, 200)
  assert.equal(invitations.json.data.some((invitation) => String(invitation.group._id) === groupId), true)

  assert.equal((await request('POST', `/groups/${groupId}/invitations/decline`, seededStudentToken)).status, 200)
  assert.equal((await request('GET', '/groups/invitations', seededStudentToken)).json.data.length, 0)
  assert.equal((await request('POST', `/groups/${groupId}/invitations`, leaderToken, {
    email: 'student2@test.com',
  })).status, 201)
  assert.equal((await request('POST', `/groups/${groupId}/join`, seededStudentToken)).status, 409)
  assert.equal((await request('POST', `/groups/${groupId}/invitations/accept`, seededStudentToken)).status, 200)
  const groupDetails = await request('GET', `/groups/${groupId}`, seededStudentToken)
  assert.equal(groupDetails.json.data.group.name, 'Workflow Study Group Updated')
  assert.equal(groupDetails.json.data.members.length, 4)

  assert.equal((await request('DELETE', `/groups/${groupId}`, studentToken)).status, 403)
  assert.equal((await request('DELETE', `/groups/${groupId}/members/${rawUser._id}`, leaderToken)).status, 400)
  assert.equal((await request('POST', `/groups/${groupId}/leave`, leaderToken)).status, 409)
  assert.equal((await request('DELETE', `/groups/${groupId}/members/${studentRegistration.json.data.user.id}`, leaderToken)).status, 200)
  assert.equal((await request('POST', '/groups/leave', seededStudentToken, { groupId })).status, 200)

  assert.equal((await runSeed(testMongoUri)).includes('Seed data'), true)
  assert.equal((await request('GET', '/users/profile', leaderToken)).status, 200)
  assert.equal((await request('DELETE', `/groups/${groupId}`, leaderToken)).status, 200)
  assert.equal((await request('GET', `/groups/${groupId}`, leaderToken)).status, 404)
})
