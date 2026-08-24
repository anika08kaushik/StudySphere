# StudySphere

StudySphere is a collaborative study platform built with React, Express, MongoDB, and Socket.io.

## Local development

1. Copy `frontend/.env.example` to `frontend/.env`.
2. Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI` and `JWT_SECRET`.
3. Run `npm install` in `frontend` and `backend`.
4. Run `npm run dev` in each folder.
5. Open `http://localhost:5173` and verify `http://localhost:5000/api/health`.

The backend can start without MongoDB for health-endpoint work, but model and seed operations require a valid Atlas URI.

## Branch workflow

Use `develop` as the shared integration branch. Create feature branches from it and open pull requests back into `develop`. See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for team rules and [docs/API.md](docs/API.md) for API conventions.
