# Employee Management System

React + Tailwind admin UI (TailAdmin patterns) with Node/Express API and PostgreSQL (`employee_management`).

## Run

```bash
npm install
# Copy server/.env.example → server/.env and set DB_* + JWT_SECRET
npm run seed:users
npm run dev
```

- App: http://localhost:5173  
- API: http://localhost:5000  
- Health: http://localhost:5000/api/health  

`JWT_SECRET` is required in `server/.env` (no default). For existing DBs, also run `server/sql/migrations/002_attendance_unique_employee_date.sql`.

## Modules

Dashboard, Employees, Departments, Attendance, Leave Requests

Demo logins (password `12345678`): `hr@company.com`, `arjuntejas@company.in`, `admin@company.com`.

To reload Indian sample data:

```bash
npm run seed:indian
```

## MVC

**Client:** `src/views` → `src/controllers` → `src/services` → `src/models` → API  

**Server:** `server/routes` → `server/controllers` → `server/models` → PostgreSQL  

New UI should reuse TailAdmin building blocks (`PageCard`, `Breadcrumb`, dashboard cards/charts, table layouts).
