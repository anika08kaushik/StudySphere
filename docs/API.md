# StudySphere API Contract

## Response format

Success responses use `{ success: true, message, data }`.
Error responses use `{ success: false, message }`.

## HTTP status codes

| Status | Meaning |
| --- | --- |
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Not Authenticated |
| 403 | Not Authorized |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |

`401` means the caller is not authenticated. `403` means the authenticated caller lacks permission.

## Foundation endpoint

`GET /api/health` returns the server status.

## Identity and profiles

- `POST /api/auth/register` creates an account and returns a JWT.
- `POST /api/auth/login` verifies the password and returns a JWT.
- `GET /api/users/profile` returns the authenticated user's profile.
- `PUT /api/users/profile` updates the authenticated user's profile.

Send protected requests with `Authorization: Bearer <token>`.

## Study groups and memberships

All group routes require authentication.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/groups` | Any authenticated user | Create a group; creator becomes leader |
| `GET` | `/api/groups` | Any authenticated user | List groups with member counts and joined state |
| `GET` | `/api/groups/me` | Any authenticated user | List the caller's active groups |
| `GET` | `/api/groups/:id` | Active members | Get a group, the caller's role, and active members |
| `GET` | `/api/groups/:id/members` | Active members | List active members |
| `PUT` | `/api/groups/:id` | Active group leader | Update name, description, subjects, or cover image |
| `DELETE` | `/api/groups/:id` | Active group leader | Delete a group and its memberships |
| `POST` | `/api/groups/:id/join` | Any authenticated user | Join a group; `/api/groups/join` with `{ "groupId": "..." }` is also supported |
| `POST` | `/api/groups/:id/leave` | Active member | Leave a group; `/api/groups/leave` with `{ "groupId": "..." }` is also supported |
| `POST` | `/api/groups/:id/invitations` | Active group leader | Invite an existing account by email |
| `GET` | `/api/groups/invitations` | Any authenticated user | List the caller's pending invitations |
| `POST` | `/api/groups/:id/invitations/accept` | Invitee | Accept a pending invitation |
| `POST` | `/api/groups/:id/invitations/decline` | Invitee | Decline a pending invitation |
| `DELETE` | `/api/groups/:id/members/:userId` | Active group leader | Remove a member or pending invitee |

Invitations are represented by pending memberships. Invitees must have a registered account and accept before becoming an active member. Leaders cannot leave or be removed when they are the group's only active leader.

## Local setup and seed data

Copy `backend/.env.example` to `backend/.env`, then set `MONGO_URI` to a valid MongoDB connection string and `JWT_SECRET` to a private random secret. For MongoDB Atlas, create a database user, allow the development machine's IP in Network Access, and URL-encode special characters in the password portion of the URI. Do not place real credentials in `.env.example` or commit `.env`.

Run `npm run seed --workspace backend` to create or update the demo accounts (`leader@test.com`, `student1@test.com`, and `student2@test.com`, each with password `password123`) and their Machine Learning group. Seeding is idempotent and does not delete unrelated database records.

The backend integration workflow uses a dedicated local test database and drops only that generated database when finished. In PowerShell, run:

```powershell
$env:MEMBER1_TEST_MONGO_URI = "mongodb://127.0.0.1:27017"
npm test --workspace backend
Remove-Item Env:MEMBER1_TEST_MONGO_URI
```
