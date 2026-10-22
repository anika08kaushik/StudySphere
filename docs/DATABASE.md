# StudySphere Database

## Models

- `User`: identity and profile data.
- `StudyGroup`: a group created by a user.
- `Membership`: connects a user to a group with a role and status.

Relationship: `User -> Membership -> StudyGroup`.

Membership roles are `student`, `leader`, and `admin`. `admin` is system-level; `leader` and `student` are group-level roles.

Membership status is `pending` for an invitation, `active` for a joined member, and `blocked` for a member who cannot rejoin. Pending invitations are limited to existing accounts. Active leaders control group settings, deletion, invitations, and member removal; groups must retain at least one active leader.

## MongoDB connection

Configure `MONGO_URI` in the ignored `backend/.env` file. Atlas authentication failures should be checked against the database user's credentials (not the Atlas website login), the password's URL encoding, and the cluster IP allowlist. The server fails at startup when the URI or `JWT_SECRET` is missing.
