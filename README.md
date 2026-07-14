# TailAdmin React + Tailwind (MVC)

React port of **TailAdmin Free** with Tailwind CSS and client MVC.

## Run

```bash
npm install
npm run dev
```

App: http://localhost:5173

## MVC (client)

- `src/views` → UI
- `src/controllers` → hooks / state
- `src/models` → data
- `src/config/api.js` → ready for a future API base URL

## Server

No `server/` folder yet. You can add Node/Express later under `server/` using the same MVC layout (`routes` → `controllers` → `models`) and point the client at it via `VITE_API_URL`.
