import 'dotenv/config'
import http from 'node:http'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import connectDatabase from './config/db.js'
import socketAuthMiddleware from './middleware/socketAuthMiddleware.js'
import registerChatSocket from './sockets/chatSocket.js'
import messageRoutes from './routes/messageRoutes.js'

const app = express()
const httpServer = http.createServer(app)
const port = process.env.PORT || 5000

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

app.use('/api', messageRoutes)

app.get('/api/health', (_request, response) => {
  response.status(200).json({
    success: true,
    message: 'StudySphere API is running',
  })
})

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' },
})

io.use(socketAuthMiddleware)

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`)

  registerChatSocket(io, socket)

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`)
  })
})

const startServer = async () => {
  await connectDatabase()
  httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}

startServer().catch((error) => {
  console.error('Unable to start server:', error.message)
  process.exitCode = 1
})
