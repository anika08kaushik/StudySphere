# StudySphere Sockets

The backend owns one Socket.io server and the frontend uses one shared client from `frontend/src/services/socket.js`.

Group rooms use the string form of `groupId`. Join with `group:join` and leave with `group:leave`.

Future chat, focus, activity, and collaboration events should use the relevant group room.

## Focus rooms

Join a room with `focus:join` and leave it with `focus:leave`. Focus seat requests
should include a stable `seatId` such as `desk-01`; `deskIndex` remains supported
for older clients. The server validates seat IDs and rejects occupied seats with
`focus:seat_conflict`. Seat occupancy follows live room presence, while the client
keeps each authenticated user's seat preference per room in local storage.

## Focus peer discovery & direct messaging (Member 3)

Direct messaging and peer connect requests between members in focus rooms are handled over personal user socket rooms (`user:<userId>`):
- `chat_request:new`: Notifies a user of a new incoming buddy connection request.
- `chat_request:update`: Notifies both parties when a request is accepted or declined.
- `dm:new`: Delivers incoming real-time direct messages to the active chat session.

