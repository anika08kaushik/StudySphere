import 'dotenv/config'
import http from 'node:http'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import connectDatabase from './config/db.js'
import fileRoutes from './routes/fileRoutes.js'

const app = express()
const httpServer = http.createServer(app)
const port = process.env.PORT || 5000

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/files', fileRoutes)

app.get('/api/health', (_request, response) => {
  response.status(200).json({
    success: true,
    message: 'StudySphere API is running',
  })
})

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' },
})

io.on('connection', (socket) => {
  socket.on('group:join', (groupId) => socket.join(String(groupId)))
  socket.on('group:leave', (groupId) => socket.leave(String(groupId)))
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