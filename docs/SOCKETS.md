# StudySphere Sockets

The backend owns one Socket.io server and the frontend uses one shared client from `frontend/src/services/socket.js`.

Group rooms use the string form of `groupId`. Join with `group:join` and leave with `group:leave`.

Future chat, focus, activity, and collaboration events should use the relevant group room.
