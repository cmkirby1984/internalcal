# Motel Management System - Backend API

A NestJS-based REST API for managing motel operations including suites, tasks, employees, notes, and notifications.

## Tech Stack

- **Framework:** NestJS 11 with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with Passport
- **Validation:** class-validator & class-transformer
- **Documentation:** Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Set up the database:**
   ```bash
   # Push schema to database (development)
   npm run prisma:push
   
   # Or run migrations (production)
   npm run prisma:migrate
   ```

4. **Generate Prisma client:**
   ```bash
   npm run prisma:generate
   ```

5. **Seed the database (optional):**
   ```bash
   npm run prisma:seed
   ```

### Running the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## API Documentation

Once running, access the Swagger documentation at:
- **Swagger UI:** http://localhost:3000/api/docs

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `GET /api/auth/profile` - Get current user profile
- `GET /api/auth/me` - Get authenticated user info

### Suites
- `GET /api/suites` - List all suites (with filtering)
- `GET /api/suites/stats` - Get suite statistics
- `GET /api/suites/:id` - Get suite by ID
- `GET /api/suites/number/:suiteNumber` - Get suite by number
- `POST /api/suites` - Create a new suite
- `PATCH /api/suites/:id` - Update a suite
- `PATCH /api/suites/:id/status/:status` - Update suite status
- `DELETE /api/suites/:id` - Delete a suite

### Tasks
- `GET /api/tasks` - List all tasks (with filtering)
- `GET /api/tasks/stats` - Get task statistics
- `GET /api/tasks/:id` - Get task by ID
- `GET /api/tasks/suite/:suiteId` - Get tasks for a suite
- `GET /api/tasks/employee/:employeeId` - Get tasks for an employee
- `POST /api/tasks` - Create a new task
- `PATCH /api/tasks/:id` - Update a task
- `PATCH /api/tasks/:id/status/:status` - Update task status
- `PATCH /api/tasks/:id/assign/:employeeId` - Assign task to employee
- `DELETE /api/tasks/:id` - Delete a task

### Employees
- `GET /api/employees` - List all employees (with filtering)
- `GET /api/employees/stats` - Get employee statistics
- `GET /api/employees/on-duty` - Get on-duty employees
- `GET /api/employees/available` - Get available employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create a new employee
- `PATCH /api/employees/:id` - Update an employee
- `PATCH /api/employees/:id/clock-in` - Clock in
- `PATCH /api/employees/:id/clock-out` - Clock out
- `DELETE /api/employees/:id` - Delete an employee

### Notes
- `GET /api/notes` - List all notes (with filtering)
- `GET /api/notes/pinned` - Get pinned notes
- `GET /api/notes/follow-up-due` - Get notes with due follow-ups
- `GET /api/notes/:id` - Get note by ID
- `POST /api/notes` - Create a new note
- `POST /api/notes/:id/comments` - Add comment to note
- `POST /api/notes/:id/read` - Mark note as read
- `PATCH /api/notes/:id` - Update a note
- `PATCH /api/notes/:id/archive` - Archive a note
- `PATCH /api/notes/:id/pin` - Pin a note
- `DELETE /api/notes/:id` - Delete a note

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## Test Credentials

After running the seed script:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Supervisor | supervisor | supervisor123 |
| Housekeeper | housekeeper1 | housekeeper123 |
| Maintenance | maintenance1 | maintenance123 |

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data script
├── src/
│   ├── auth/              # Authentication module
│   ├── common/            # Shared DTOs and utilities
│   ├── employees/         # Employee management
│   ├── notes/             # Notes and communications
│   ├── notifications/     # User notifications
│   ├── prisma/            # Prisma service
│   ├── suites/            # Suite management
│   ├── tasks/             # Task management
│   ├── app.module.ts      # Root module
│   └── main.ts            # Application entry
└── package.json
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start in development mode |
| `npm run build` | Build for production |
| `npm run start:prod` | Start production build |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:push` | Push schema to database |
| `npm run prisma:seed` | Seed the database |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run lint` | Lint the codebase |
| `npm run test` | Run tests |

## License

UNLICENSED - Internal use only
