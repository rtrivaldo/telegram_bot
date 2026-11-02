
# Telegram Sales Visit Bot

A Telegram-based sales management bot built with **TypeScript, Telegraf, Express, and PostgreSQL**.

This project is designed to help sales teams manage user authentication, outlet data, and outlet visit schedules directly through Telegram.

## Features

### 1. User Authentication & Management

The bot identifies Telegram users and manages their access through a role-based authentication system.

**Available roles:**

| Role | Description |
|---|---|
| `admin` | Full access to user, outlet, and schedule management |
| `sales` | Access to personal outlet visit schedules |
| `supervisor` | Access to monitor sales schedules and outlet data |

**User registration workflow:**

1. Users register through `/register`.
2. New registrations receive `pending` status.
3. Admin reviews registration requests.
4. Admin approves or rejects registration.
5. Approved users can access features according to their assigned role.

**User statuses:**

- `pending`
- `active`
- `rejected`
- `disabled`

### 2. Outlet Management

Manage outlet information stored in PostgreSQL.

**Commands:**

| Command | Access | Description |
|---|---|---|
| `/outlets` | Admin, Supervisor | Display all outlets |
| `/outlet ID_OUTLET` | Admin, Supervisor | Display outlet details |
| `/tambahoutlet ID NO_RS NAMA_OUTLET` | Admin | Add a new outlet |
| `/editoutlet ID_OUTLET NO_RS NAMA_OUTLET` | Admin | Update outlet information |
| `/hapusoutlet ID_OUTLET` | Admin | Delete an outlet |

Each outlet contains:

- Outlet ID (business identifier)
- No. RS
- Outlet name
- Created timestamp
- Updated timestamp

An outlet cannot be deleted while it is referenced by an existing visit schedule.

### 3. Sales Schedule Management

Manage and monitor outlet visit schedules assigned to sales representatives.

**Sales commands:**

| Command | Description |
|---|---|
| `/jadwal` | Display today's personal schedule |
| `/jadwal Jumat` | Display personal schedule for a specific day |

**Admin and Supervisor commands:**

| Command | Description |
|---|---|
| `/jadwalsales` | Display all sales schedules |
| `/jadwalsales Jumat` | Filter schedules by weekday |
| `/jadwalsales 123456789` | Filter schedules by Telegram ID |
| `/jadwalsales 123456789 Jumat` | Filter by Telegram ID and weekday |

Supported weekdays:

- Senin
- Selasa
- Rabu
- Kamis
- Jumat
- Sabtu
- Minggu

Schedules are associated with users and outlets through database relationships.

### 4. API Health Check

The project includes an Express API server for health monitoring and future web application integration.

The health endpoint reports the API status and Telegram bot status.

> The API is currently intended for health monitoring and future expansion.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| TypeScript | Application development |
| Telegraf | Telegram Bot framework |
| Express | HTTP API server |
| PostgreSQL | Relational database |
| node-postgres (`pg`) | PostgreSQL client |
| Zod | Environment and input validation |
| dotenv | Environment variable management |
| tsx | TypeScript development runtime |

## Project Structure

```text
telegram-sales-bot/
├── database/
│   └── migrations/
│
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── health.routes.ts
│   │   │   └── index.ts
│   │   └── app.ts
│   │
│   ├── bot/
│   │   ├── commands/
│   │   │   ├── auth.commands.ts
│   │   │   ├── outlet.commands.ts
│   │   │   └── schedule.commands.ts
│   │   └── bot.ts
│   │
│   ├── config/
│   │   ├── database.ts
│   │   ├── env.ts
│   │   ├── init-database.ts
│   │   ├── migrate-database.ts
│   │   └── run-migrations.ts
│   │
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   ├── outlet.repository.ts
│   │   └── schedule.repository.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── outlet.service.ts
│   │   └── schedule.service.ts
│   │
│   └── index.ts
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- PostgreSQL
- A Telegram Bot Token from [@BotFather](https://t.me/BotFather)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd telegram-sales-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

```env
# Telegram
BOT_TOKEN=your_telegram_bot_token

# Server
PORT=3000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=telegram_sales_bot
DB_USER=postgres
DB_PASSWORD=your_database_password
```

Adjust the environment variables according to your configuration and the validation rules in `src/config/env.ts`.

### 4. Create the Database

Create a PostgreSQL database:

```sql
CREATE DATABASE telegram_sales_bot;
```

### 5. Initialize and Migrate the Database

Run the database initialization and migration scripts according to the configured npm scripts.

For example:

```bash
npm run db:init
npm run db:migrate
```

Make sure the migration files in `database/migrations/` are applied before starting the application.

### 6. Run the Application

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

Check the actual scripts in `package.json` if your local script names differ.

---

## Telegram Bot Commands

Use `/start` to start interacting with the bot and `/help` to display the available commands.

### General Commands

| Command | Description |
|---|---|
| `/start` | Start the bot |
| `/register` | Register a Telegram account |
| `/me` | Display current user information |
| `/help` | Display command documentation |

### Admin Commands

| Command | Description |
|---|---|
| `/pending` | Display pending registration requests |
| `/approve ID ROLE` | Approve a user and assign a role |
| `/reject ID` | Reject a registration request |
| `/users` | Display registered users |
| `/setrole ID ROLE` | Change a user's role |
| `/disable ID` | Disable a user account |
| `/enable ID` | Enable a user account |

Available roles: `admin`, `sales`, `supervisor`.

**Note:** `ID` in user management commands refers to the internal user ID displayed by the bot, while `123456789` in schedule filtering refers to the user's Telegram ID.

---

## Database Overview

The application currently uses PostgreSQL to store user, outlet, and schedule information.

### Main Tables

| Table | Description |
|---|---|
| `users` | Telegram user accounts, roles, and Salesforce information |
| `outlets` | Outlet master data |
| `outlet_visit_schedules` | Sales-to-outlet visit schedule assignments |

### Database Relationships

```text
users
  │
  │ users.id
  ▼
outlet_visit_schedules
  │
  │ outlet_visit_schedules.outlet_id
  ▼
outlets
```

- Each schedule belongs to a user.
- Each schedule references an outlet.
- One user can have multiple schedules.
- One outlet can be assigned to multiple schedules.

---

## Architecture

The project follows a layered architecture to separate Telegram command handling, business logic, and database operations.

```text
Telegram User
     │
     ▼
Telegraf Bot
     │
     ▼
Commands
     │
     ▼
Services
     │
     ▼
Repositories
     │
     ▼
PostgreSQL
```

The Express API runs alongside the Telegram bot in the same application process.

### Layer Responsibilities

- **Commands:** Handle Telegram interactions and access checks.
- **Services:** Handle business rules and application logic.
- **Repositories:** Execute database queries.
- **Config:** Manage environment variables, database connections, and migrations.
- **API:** Provide HTTP endpoints for health monitoring and future integrations.

---

## Development Status

| Feature | Status |
|---|---|
| Telegram Bot Integration | Implemented |
| User Registration | Implemented |
| Role-Based Access Control | Implemented |
| User Administration | Implemented |
| Outlet Management | Implemented |
| Sales Schedule Management | Implemented |
| API Health Check | Implemented |
| Sales Visit Recording | Planned |
| Sales Visit History | Planned |
| Product Management | Planned |
| Excel Export | Planned |
| Reporting & Dashboard | Planned |

## Future Development

The next development phase will focus on Sales Visit Management, allowing sales representatives to record outlet visits through Telegram.

Planned improvements include:

- Recording outlet visits.
- Recording products ordered by outlets.
- Viewing visit history.
- Exporting visit reports to Excel.
- Providing sales activity reports for administrators and supervisors.

---

## License

This project is currently under development.
