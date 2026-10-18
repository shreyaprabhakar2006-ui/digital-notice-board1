# Digital Notice Board (React + Node.js)

## Requirements
- Node.js installed
- VS Code

## 1. Start the backend
Open a terminal in VS Code:
```bash
cd backend
npm install
npm start
```
Backend runs at http://localhost:5000

## 2. Start the React frontend
Open a SECOND terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the URL Vite shows, usually http://localhost:5173

## Features
- Sign up and sign in
- Passwords are hashed on the backend (not stored in browser localStorage)
- JWT login token and basic user details are stored in localStorage
- Protected notice creation and deletion
- Notices and users are persisted in JSON files by the backend

## Important
`localStorage` is browser storage, not a shared database. This demo uses `backend/data/users.json` and `backend/data/notices.json` for persistent server-side data. For a real production app, use a database such as MongoDB/PostgreSQL, HTTPS, secure cookies, validation, rate limiting, and proper secret management.
