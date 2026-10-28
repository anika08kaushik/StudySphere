# Productivity & Calendar Subsystem (Member 3)

This document details the architecture, REST endpoints, WebSocket events, and data models of the Productivity & Focus subsystem within StudySphere.

---

## 1. Architecture Overview

The productivity subsystem provides synchronized focus rooms, personal time tracking, collaborative calendar management, and peer discovery:

1. **Focus Room & 3D Spatial Presence**:
   - 3D interactive study room rendered with `@react-three/fiber` and `@react-three/drei`.
   - 6 physical desks (`desk-01` through `desk-06`) mapped to spatial coordinates in `LibraryScene.jsx`.
   - Real-time desk occupancy and avatar state synchronized across active participants via Socket.IO.
   - Client-side persistence of user seat selections with automatic conflict resolution upon rejoin.

2. **Persistent Focus Timer & Session Tracking**:
   - Real-time countdown timer that survives browser reloads and tab closures via server-persisted state (`/api/focus/timer`).
   - Recorded focus sessions with tag associations and duration calculation (`/api/focus/sessions`).
   - Aggregated metrics, streak calculation, and 365-day activity heatmaps (`/api/focus/stats`, `/api/focus/report`).

3. **Calendar & Event Scheduling**:
   - Month, week, and day calendar views with custom emoji mood tags.
   - Timezone-resilient date storage using `YYYY-MM-DD` strings to prevent UTC date shifting near midnight boundaries.
   - Personal events and group-associated study sync deadlines (`/api/calendar/events`).

4. **Peer Discovery & Focus Room Chat**:
   - "Explore People" panel inside the focus room allowing participants to discover co-studying members.
   - Two-way connection requests with live notifications (`chat_request:new`, `chat_request:update`).
   - Persisted direct messaging between study buddies with real-time socket delivery (`dm:new`).

---

## 2. REST API Reference

All productivity routes require an `Authorization: Bearer <token>` header.

### Focus & Timer Endpoints (`/api/focus`)

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/focus/sessions` | Records a completed focus session (duration, mode, tag). |
| `GET` | `/api/focus/sessions` | Returns recent focus sessions for the authenticated user. |
| `GET` | `/api/focus/stats` | Computes today's minutes, streak count, and daily activity. |
| `POST` | `/api/focus/timer` | Persists running timer state (mode, duration, remainingSeconds, isRunning). |
| `GET` | `/api/focus/timer` | Retrieves the user's active timer state upon reconnection or page refresh. |
| `DELETE` | `/api/focus/timer` | Clears stored timer state upon session completion or manual reset. |
| `GET` | `/api/focus/report` | Returns aggregated metrics, tag distribution, and 365-day heatmap data. |

### Calendar Endpoints (`/api/calendar`)

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/calendar/events` | Retrieves all calendar events for the user (optional `month`, `year`, `groupId` filters). |
| `POST` | `/api/calendar/events` | Creates a new calendar event with emoji mood, date, and time. |
| `PATCH` | `/api/calendar/events/:eventId` | Partially updates title, description, time, or category. |
| `DELETE` | `/api/calendar/events/:eventId` | Permanently deletes a calendar event owned by the caller. |

### Focus Chat & Requests Endpoints (`/api/private-chat`)

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/private-chat/requests` | Sends a connect request to another user in the focus room. |
| `GET` | `/api/private-chat/requests` | Returns incoming/outgoing connection requests and connected partners. |
| `POST` | `/api/private-chat/requests/:requestId/respond` | Accepts or declines a pending connection request (`status: 'accepted' \| 'declined'`). |
| `GET` | `/api/private-chat/dm/:peerId/messages` | Fetches direct message history with a connected peer. |
| `POST` | `/api/private-chat/dm/:peerId/messages` | Sends a persisted direct message to a peer. |

---

## 3. WebSocket Protocol

The productivity module communicates over the primary Socket.IO connection:

### Focus Room Presence (`focus:*`)
- `focus:join` `{ roomId, seatId, deskIndex }`: Joins a focus room and claims a desk seat.
- `focus:leave` `{ roomId }`: Leaves the focus room and frees the occupied seat.
- `focus:claim_seat` `{ roomId, seatId, deskIndex }`: Attempts to change or claim a specific seat.
- `focus:room_state`: Broadcast to all room participants with active occupants and avatar positions.
- `focus:seat_conflict` `{ requestedSeat, currentOccupant }`: Sent to caller if seat is already occupied.

### Real-Time Peer Chat (`chat_request:*` & `dm:*`)
- `chat_request:new`: Emitted to the recipient user room (`user:<id>`) when an invitation is sent.
- `chat_request:update`: Emitted when an invitation is accepted or rejected.
- `dm:new`: Emitted to sender and recipient with message payload (`senderId`, `peerId`, `content`, `createdAt`).

---

## 4. Seating Layout

The virtual library contains 6 desk positions:
- `desk-01`: Front Left
- `desk-02`: Front Right
- `desk-03`: Middle Left
- `desk-04`: Middle Right
- `desk-05`: Back Left
- `desk-06`: Back Right

Seat persistence uses `focus_seat_<userId>_<roomId>` in localStorage, ensuring participants return to their chosen seat across sessions if available.
