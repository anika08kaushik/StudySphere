# StudySphere

## AI-Powered Collaborative Study Platform

StudySphere is an all-in-one collaborative study and productivity platform designed specifically for students.

It brings study groups, collaborative notes, secure document sharing, resource management, project management, communication, focus sessions, productivity tracking, and AI-powered study assistance into one centralized academic workspace.

---

# Features

- 👥 Study Groups
- 📝 Real-Time Collaborative Notes
- 🔐 Protected Document Sharing
- 📁 Shared Resource Locker
- 📋 Kanban Project Management
- 💬 Group Chat
- ⏱️ Virtual Focus Rooms
- 📊 Productivity Tracking
- 🔔 Notifications
- 📰 Activity Feed
- 🤖 AI-Powered Study Assistance
- 📅 Academic Calendar
- 🏫 Campus Study Room Booking *(planned/optional)*

---

# Tech Stack

## Frontend

- React
- Vite
- JavaScript
- Tailwind CSS
- React Router
- Axios
- Socket.io Client

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- Socket.io

## Database

- MongoDB Atlas

## Development

- Git
- GitHub
- npm
- VS Code

## Planned / Feature-Specific Technologies

- AWS S3 / Firebase Storage
- Yjs
- Redis
- AI / RAG
- Vector Database
- Docker

---

# Project Architecture

```text
                         STUDYSPHERE
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
       REACT FRONTEND                   BACKEND SERVER
       React + Vite                     Node.js + Express
       Tailwind CSS                     JWT + bcrypt
       React Router                     REST APIs
       Axios                            Socket.io
              │                               │
              │                               │
              ▼                               ▼
        ┌──────────────┐              ┌─────────────────┐
        │  Dashboard   │              │ Authentication  │
        │ Study Groups │              │ Business Logic  │
        │ Chat         │              │ REST APIs       │
        │ Documents    │              │ Real-Time Engine│
        └──────────────┘              └────────┬────────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │   MongoDB    │
                                        │    Atlas     │
                                        │              │
                                        │ Users        │
                                        │ Groups       │
                                        │ Tasks        │
                                        │ Messages     │
                                        │ Documents    │
                                        │ Sessions     │
                                        └──────────────┘