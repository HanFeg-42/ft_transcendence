# Authentication Service — Development Notes

This document explains the authentication-service work implemented so far, the purpose of each component, and the reasoning behind the current database setup.

It is intended both as technical documentation and as a reference for understanding and explaining the implementation later.

---

## 1. Current Authentication Architecture

The authentication service is responsible for authentication-related user data.

The current database path is:

```text
Auth Service
     |
     v
   Prisma
     |
     v
 PostgreSQL
     |
     v
   auth_db
     |
     v
 User table
```

PostgreSQL stores the actual data.

Prisma acts as the ORM layer between the Node.js authentication service and PostgreSQL.

The authentication service will later use Prisma Client to create, retrieve, and update users without having to manually write SQL for every database operation.

---

## 2. PostgreSQL Setup

A PostgreSQL service was added to `docker-compose.yml`.

The PostgreSQL data directory is backed by the Docker named volume:

```text
db-data
```

This allows database data to persist independently of the lifecycle of the PostgreSQL container.

The initialization script is located at:

```text
postgres-db/init.sql
```

It currently creates the authentication database:

```sql
CREATE DATABASE auth_db;
```

The script is mounted into:

```text
/docker-entrypoint-initdb.d/
```

inside the PostgreSQL container.

The official PostgreSQL Docker image executes initialization scripts from this directory when the database data directory is initialized for the first time.

The resulting PostgreSQL instance currently contains the logical database:

```text
auth_db
```

This database is owned by the authentication domain.

---

## 3. Environment Configuration

Database credentials and connection information must not be hardcoded directly into source files.

Environment variables are therefore used for configuration.

The real `.env` file contains local configuration and credentials and must remain ignored by Git.

An `.env.example` file is committed to document which environment variables developers are expected to provide.

The authentication database connection follows the PostgreSQL URL structure:

```text
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

During local development, Prisma can connect through:

```text
localhost:5432
```

because PostgreSQL port `5432` is published from the Docker container to the host.

When the authentication service itself eventually runs inside Docker, `localhost` must not be used to reach PostgreSQL. Containers communicate using the Docker service name over the Docker network.

---

## 4. Prisma

Prisma is the ORM used by the authentication service.

An ORM (Object-Relational Mapper) provides an abstraction between application code and a relational database.

The basic flow is:

```text
Node/Express application
        |
        v
      Prisma
        |
        v
       SQL
        |
        v
    PostgreSQL
```

Prisma was initialized inside the `auth` service because the authentication service owns its database schema.

The relevant structure is:

```text
auth/
├── prisma.config.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── package.json
└── package-lock.json
```

---

## 5. `prisma.config.ts`

With the Prisma version used by this project, database connection configuration is separated from the Prisma schema.

`prisma.config.ts` provides Prisma CLI configuration, including access to the database connection URL through an environment variable.

The database URL is therefore not hardcoded inside `schema.prisma`.

This keeps connection configuration separate from the description of the database models.

---

## 6. `schema.prisma`

The Prisma schema describes the structure of the data owned by the authentication service.

The first model implemented is:

```text
User
```

The initial User model contains:

```text
User
├── id
├── username
├── email
├── passwordHash
└── createdAt
```

### `id`

The `id` is the primary key of the User model.

It uniquely identifies each user.

It uses an auto-incrementing integer, meaning PostgreSQL automatically generates the next identifier when a user is created.

### `username`

The username identifies the player publicly.

It has a unique constraint, meaning PostgreSQL must not allow two User records with the same username.

### `email`

The email also has a unique constraint.

This prevents multiple accounts from being stored with the same email address at the database level.

### `passwordHash`

Plaintext passwords must never be persisted in the database.

The `passwordHash` field is intended to contain the output of the password-hashing mechanism that will later be implemented by the registration/authentication logic.

The flow will eventually be:

```text
User enters password
        |
        v
Authentication service
        |
        v
Password hashing
        |
        v
passwordHash
        |
        v
PostgreSQL
```

The original plaintext password should not be stored.

### `createdAt`

`createdAt` records when the user account was created.

Prisma configures this field to automatically use the current timestamp when a User record is inserted.

---

## 7. Prisma Migration

Defining a Prisma model does not directly create a PostgreSQL table.

PostgreSQL understands SQL, while `schema.prisma` uses Prisma's schema language.

A Prisma migration bridges the two.

The initial migration was created using:

```bash
npx prisma migrate dev --name init_auth
```

The process is conceptually:

```text
schema.prisma
     |
     v
   Prisma
     |
     v
migration.sql
     |
     v
 PostgreSQL
     |
     v
real database tables
```

Prisma generated a migration under:

```text
prisma/migrations/
```

and applied it to `auth_db`.

The migration history should be committed to Git so that other developers can reproduce the same database structure.

---

## 8. Schema Validation

The Prisma schema can be checked with:

```bash
npx prisma validate
```

The initial schema was successfully validated.

Validation checks whether the Prisma schema configuration and model definitions are valid.

Validation should not be confused with migration.

```text
prisma validate
      |
      +--> Is the Prisma schema valid?

prisma migrate dev
      |
      +--> Generate and apply database schema changes.
```

---

## 9. Database Verification

The PostgreSQL database can be accessed directly for development/debugging with:

```bash
docker exec -it postgres-db psql -U postgres -d auth_db
```

Inside `psql`, tables can be listed with:

```text
\dt
```

A table structure can be inspected with:

```text
\d "User"
```

The database itself can therefore be checked independently of Prisma.

---

## 10. Current Status

Completed:

- PostgreSQL container configured for development.
- Persistent PostgreSQL Docker volume configured.
- `auth_db` initialization added.
- Environment-based database configuration established.
- Prisma initialized inside the authentication service.
- Initial `User` model defined.
- Unique username constraint defined.
- Unique email constraint defined.
- Password storage designed around password hashes rather than plaintext.
- Initial Prisma migration generated and successfully applied.
- Prisma schema successfully validated.

---

## 11. What Has NOT Been Implemented Yet

The existence of the User model does **not** mean authentication is complete.

The following functionality still needs to be implemented:

- Express authentication server.
- Registration endpoint.
- Registration request validation.
- Password hashing.
- Prisma Client integration in application code.
- Login.
- Password verification.
- JWT/session handling.
- Protected endpoints.
- Authorization.
- OAuth integration, if required by the selected modules.
- 2FA, if required by the selected modules.
- Frontend registration integration.

These should be implemented incrementally rather than added prematurely to the database layer.

---

## 12. Next Registration Flow

The next important vertical slice is:

```text
React registration form
        |
        v
POST /register
        |
        v
Express route/controller
        |
        v
Input validation
        |
        v
Password hashing
        |
        v
Prisma Client
        |
        v
prisma.user.create(...)
        |
        v
auth_db
        |
        v
User record
```

This will turn the current database foundation into a functional user-registration feature.

---

## 13. Important Concepts to Remember

### Prisma schema

The blueprint describing the application's database models.

### Prisma migration

A recorded database-structure change generated from changes to the Prisma schema.

### Prisma Client

The generated API that application code will later use to communicate with the database.

### PostgreSQL

The actual relational database system storing the data.

### `auth_db`

The logical PostgreSQL database owned by the authentication service.

### `User`

The first database model/table belonging to the authentication domain.

### `.env`

Local configuration containing real environment-specific values and credentials. It must not be committed.

### `.env.example`

A safe template documenting which environment variables developers need to configure.

---

## 14. Current Mental Model

The most important distinction is:

```text
schema.prisma
      |
      | describes
      v
Database structure


migration.sql
      |
      | changes
      v
PostgreSQL database


Prisma Client
      |
      | will be used by
      v
Express application
      |
      | to read/write
      v
PostgreSQL
```

The current work establishes the **database foundation**.

The next stage will establish the **application layer that uses that database**.