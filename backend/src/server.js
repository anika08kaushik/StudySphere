import 'dotenv/config'
import http from 'node:http'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import connectDatabase from './config/db.js'

import fileRoutes from './routes/fileRoutes.js'
import socketAuthMiddleware from './middleware/socketAuthMiddleware.js'
import registerChatSocket from './sockets/chatSocket.js'
import registerNotesSocket from './sockets/notesSocket.js'
import messageRoutes from './routes/messageRoutes.js'
import noteRoutes from './routes/noteRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import activityRoutes from './routes/activityRoutes.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import groupRoutes from './routes/groupRoutes.js'
import taskRoutes from './routes/taskRoutes.js'

import { setNotificationIo } from './services/notificationService.js'
import { setActivityIo } from './services/activityService.js'

const app = express()
const httpServer = http.createServer(app)
const port = process.env.PORT || 5000

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ extended: true, limit: '25mb' }))

app.use('/api/tasks', taskRoutes)
// Member 4 - Resource/File APIs
app.use('/api/files', fileRoutes)

// Member 2 - Collaboration, Chat, Collaborative Notes, Notifications & Activity APIs
app.use('/api', messageRoutes)
app.use('/api', noteRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/activities', activityRoutes)

// Member 1 - Authentication, Users & Groups APIs
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/groups', groupRoutes)

app.get('/api/health', (_request, response) => {
  response.status(200).json({
    success: true,
    message: 'StudySphere API is running',
  })
})

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' },
  maxHttpBufferSize: 1e8,
})

io.use(socketAuthMiddleware)

// Initialize notification & activity real-time socket emitters
setNotificationIo(io)
setActivityIo(io)

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`)

  // Personal user notification room
  if (socket.user?.userId) {
    socket.join(`user:${socket.user.userId}`)
  }

  // Register real-time communication modules
  registerChatSocket(io, socket)
  registerNotesSocket(io, socket)

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`)
  })
})

const startServer = async () => {
  if (!process.env.JWT_SECRET?.trim()) {
    throw new Error('JWT_SECRET is not configured. Set it in backend/.env before starting the backend.')
  }

  await connectDatabase()

  httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}

startServer().catch((error) => {
  console.error('Unable to start server:', error.message)
  process.exitCode = 1
})