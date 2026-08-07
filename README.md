# Employee Management System

React + Tailwind admin UI (TailAdmin patterns) with Node/Express API and PostgreSQL (`employee_management`).

## Run

```bash
npm install
# Copy server/.env.example → server/.env and set DB_* + JWT_SECRET (+ SEED_PASSWORD)
npm run migrate
npm run seed:users
npm run dev
```

- App: http://localhost:5173  
- API: http://localhost:5000  
- Health: http://localhost:5000/api/health  

`JWT_SECRET` is required. Optional: `CORS_ORIGINS`, `RATE_LIMIT_*`, `JWT_EXPIRES_IN` (default `12h`), `UPLOAD_TOKEN_TTL_SEC`, `SEED_PASSWORD`.

Migrations live under `server/sql/migrations/` and are applied with `npm run migrate` (tracked in `schema_migrations`).

## Modules

Dashboard, Employees, Departments, Attendance, Leave Requests

Set `SEED_PASSWORD` (12+ chars) before `npm run seed:users`. Do not reuse seed passwords in production.

```bash
npm run seed:indian   # reload Indian sample data
```

## Tests

```bash
npm test                 # unit tests
EMS_SMOKE=1 npm test     # live API smoke (server must be running)
```

## Security notes

- Uploads use short-lived signed URLs (`?exp=&sig=`) plus ownership checks for medical files  
- Logout bumps `users.token_version` so JWTs are revoked server-side  
- Helmet security headers are enabled on the API  

## MVC

**Client:** `src/views` → `src/controllers` → `src/services` → API  
          ↘ `src/models` (validation, constants, mappers)

**Server:** `server/routes` → `server/controllers` → `server/models` → PostgreSQL  

New UI should reuse TailAdmin building blocks (`PageCard`, `Breadcrumb`, dashboard cards/charts, table layouts).
