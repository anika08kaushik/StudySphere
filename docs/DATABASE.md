# StudySphere Database

## Models

- `User`: identity and profile data.
- `StudyGroup`: a group created by a user.
- `Membership`: connects a user to a group with a role and status.

Relationship: `User -> Membership -> StudyGroup`.

Membership roles are `student`, `leader`, and `admin`. `admin` is system-level; `leader` and `student` are group-level roles.
