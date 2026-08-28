# Authentication Service — Development Notes

This document explains the authentication-service work implemented so far, the purpose of each component, and the reasoning behind the current architecture.

It is intended both as technical documentation and as a reference for understanding and explaining the implementation later.

---

## 1. Current Authentication Architecture

The authentication service is responsible for authentication-related user data and operations.

The current backend flow is:

```text
Client
   |
   v
Express
   |
   v
Registration Controller
   |
   v
Input Validation
   |
   v
bcrypt
   |
   v
Prisma Client
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

PostgreSQL stores the actual user data.

Express provides the HTTP server and API endpoints.

The registration controller contains the registration logic.

`bcryptjs` is used to hash passwords before they are persisted.

Prisma acts as the ORM layer between the Node.js authentication service and PostgreSQL.

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

During local development, the authentication service can connect through:

```text
localhost:5432
```

because PostgreSQL port `5432` is published from the Docker container to the host.

When the authentication service itself runs inside Docker, `localhost` must not be used to reach PostgreSQL.

Containers communicate using the Docker service name over the Docker network.

---

## 4. Prisma

Prisma is the ORM used by the authentication service.

An ORM (Object-Relational Mapper) provides an abstraction between application code and a relational database.

The current flow is:

```text
Express application
        |
        v
Registration Controller
        |
        v
Prisma Client
        |
        v
PostgreSQL
```

Prisma was initialized inside the `auth` service because the authentication service owns its database schema.

Prisma Client is generated from `schema.prisma` and used by the application to communicate with PostgreSQL.

The PostgreSQL driver adapter is provided through:

```text
@prisma/adapter-pg
```

The relevant structure is currently:

```text
auth/
├── prisma.config.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── server.ts
│   ├── registerController.ts
│   ├── prisma.ts
│   └── generated/
│       └── prisma/
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

It has a unique constraint, meaning PostgreSQL does not allow two User records with the same username.

### `email`

The email also has a unique constraint.

This prevents multiple accounts from being stored with the same email address at the database level.

### `passwordHash`

Plaintext passwords are never persisted in the database.

During registration, the password received from the client is hashed using `bcryptjs` before the user is inserted into PostgreSQL.

The current password flow is:

```text
Plaintext password
        |
        v
bcrypt.hash()
        |
        v
passwordHash
        |
        v
Prisma Client
        |
        v
PostgreSQL
```

Only `passwordHash` is passed to Prisma and stored in the `User` table.

The plaintext password is never stored in PostgreSQL.

The registration API response also does not expose the plaintext password or the stored `passwordHash`.

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

The migration history is committed to Git so that other developers can reproduce the same database structure.

---

## 8. Prisma Client

Prisma Client is generated using:

```bash
npx prisma generate
```

The generated client is located under:

```text
src/generated/prisma/
```

The application initializes Prisma in:

```text
src/prisma.ts
```

The connection flow is:

```text
DATABASE_URL
     |
     v
PrismaPg adapter
     |
     v
PrismaClient
     |
     v
PostgreSQL
```

A single exported Prisma instance can then be imported by application code that needs database access.

For example, the registration controller uses Prisma to create users through:

```text
prisma.user.create(...)
```

---

## 9. Schema and Database Verification

The Prisma schema can be checked with:

```bash
npx prisma validate
```

Validation checks whether the Prisma schema configuration and model definitions are valid.

Validation should not be confused with migration:

```text
prisma validate
      |
      +--> Is the Prisma schema valid?

prisma migrate dev
      |
      +--> Generate and apply database schema changes.

prisma generate
      |
      +--> Generate Prisma Client for application code.
```

The PostgreSQL database can also be accessed directly for development and debugging:

```bash
docker exec -it postgres-db psql -U postgres -d auth_db
```

Inside `psql`, tables can be listed with:

```text
\dt
```

The User table structure can be inspected with:

```text
\d "User"
```

Stored users can be inspected with:

```sql
SELECT id, username, email, "passwordHash", "createdAt"
FROM "User";
```

This allows the database to be verified independently of the Express API and Prisma.

---

## 10. Express Authentication Server

The authentication service now contains a basic Express HTTP server.

The server is initialized in:

```text
src/server.ts
```

Express JSON middleware is enabled using:

```text
app.use(express.json())
```

This allows Express to parse incoming JSON request bodies and make their contents available through:

```text
req.body
```

The server currently provides a health/test route and the registration endpoint.

The registration endpoint is:

```http
POST /register
```

The route delegates the registration logic to the registration controller.

Conceptually:

```text
POST /register
      |
      v
Express
      |
      v
register()
      |
      v
registerController.ts
```

This keeps the HTTP server setup separate from the registration logic.

---

## 11. User Registration

The authentication service currently provides:

```http
POST /register
```

A registration request contains JSON in the following form:

```json
{
  "username": "example",
  "email": "example@email.com",
  "password": "example123"
}
```

The backend performs the following operations:

1. Reads `username`, `email`, and `password` from the request body.
2. Verifies that all required fields are present.
3. Validates the basic username, email, and password constraints.
4. Hashes the plaintext password using `bcryptjs`.
5. Creates the user through Prisma Client.
6. Stores the resulting user in PostgreSQL.
7. Returns a safe representation of the created user.

The complete flow is:

```text
Client
   |
   v
POST /register
   |
   v
Express
   |
   v
registerController
   |
   v
Input validation
   |
   v
bcrypt.hash()
   |
   v
passwordHash
   |
   v
prisma.user.create(...)
   |
   v
PostgreSQL auth_db
   |
   v
User record
```

---

## 12. Registration Validation

The registration endpoint currently performs basic backend validation.

The current rules include:

* `username`, `email`, and `password` are required.
* Username must contain at least 3 characters.
* Email must pass the current basic email check.
* Password must contain at least 8 characters.

Invalid registration data returns:

```text
400 Bad Request
```

Backend validation is required even when frontend validation is later implemented.

The backend must not assume that data received from a client is valid.

---

## 13. Password Hashing

Passwords are hashed using:

```text
bcryptjs
```

Before creating the user, the registration controller performs password hashing.

Conceptually:

```text
password
   |
   v
bcrypt.hash(password, 10)
   |
   v
passwordHash
```

The resulting hash is stored in the `passwordHash` database field.

The original plaintext password is not passed to Prisma and is not persisted in PostgreSQL.

Password hashes will later be used during login to verify passwords without storing the original passwords.

---

## 14. User Creation with Prisma

After validation and password hashing, the registration controller creates the user through Prisma Client.

Conceptually:

```text
username
email
passwordHash
     |
     v
prisma.user.create(...)
     |
     v
PostgreSQL
     |
     v
User row
```

The `id` does not need to be supplied manually because it is automatically generated.

The `createdAt` value also does not need to be supplied manually because it defaults to the current timestamp.

A successful registration returns:

```text
201 Created
```

The response contains safe user information such as:

```text
id
username
email
createdAt
```

It does not return:

```text
password
passwordHash
```

---

## 15. Duplicate User Handling

Both `username` and `email` have database-level unique constraints.

If an attempt is made to create a user whose username or email conflicts with an existing record, PostgreSQL rejects the insertion.

Prisma reports a unique-constraint violation using the known error code:

```text
P2002
```

The registration controller catches this error and converts it into:

```text
409 Conflict
```

The API currently returns an error indicating that the username or email already exists.

Unexpected database errors are handled separately and return:

```text
500 Internal Server Error
```

The database unique constraints remain the final protection against duplicate usernames and emails.

---

## 16. Registration Security Verification

The registration implementation was manually verified.

### Plaintext Password Storage

The PostgreSQL User table was inspected directly after registration.

The `passwordHash` column contained a bcrypt hash rather than the plaintext password.

The intended security flow is therefore:

```text
Client password
      |
      v
Express request
      |
      v
bcrypt
      |
      v
passwordHash
      |
      v
PostgreSQL
```

### API Response

The successful registration response was also verified.

The response exposes:

```text
id
username
email
createdAt
```

but does not expose:

```text
password
passwordHash
```

This prevents sensitive authentication information from unnecessarily leaving the authentication service.

---

## 17. Current Status

Completed:

* PostgreSQL container configured for development.
* Persistent PostgreSQL Docker volume configured.
* `auth_db` initialization added.
* Environment-based database configuration established.
* Prisma initialized inside the authentication service.
* Initial `User` model defined.
* Unique username constraint defined.
* Unique email constraint defined.
* Initial Prisma migration generated and applied.
* Prisma schema validated.
* Prisma Client generated.
* PostgreSQL Prisma adapter configured.
* Express authentication server created.
* `POST /register` implemented.
* Registration request validation implemented.
* Password hashing implemented with `bcryptjs`.
* User creation implemented with Prisma Client.
* Duplicate username/email conflicts handled.
* Successful registration returns `201 Created`.
* Invalid registration data returns `400 Bad Request`.
* Duplicate registration conflicts return `409 Conflict`.
* Plaintext passwords verified as not being stored.
* Registration API verified as not exposing `password` or `passwordHash`.

---

## 18. What Has NOT Been Implemented Yet

The existence of the User model and registration endpoint does **not** mean authentication is complete.

The following functionality still needs to be implemented:

* Login.
* Password verification.
* JWT/session handling.
* Protected endpoints.
* Authorization.
* OAuth integration, if required by the selected modules.
* 2FA, if required by the selected modules.
* Frontend registration integration.

These features should be implemented incrementally on top of the current registration foundation.

---

## 19. Important Concepts to Remember

### Express

The Node.js web framework currently used to expose the authentication HTTP API.

### `express.json()`

Express middleware that parses incoming JSON request bodies and makes the parsed data available through `req.body`.

### Controller

A function responsible for handling an incoming request and producing the appropriate response.

The current registration logic is implemented in `registerController.ts`.

### Prisma Schema

The blueprint describing the application's database models.

### Prisma Migration

A recorded database-structure change generated from changes to the Prisma schema.

### Prisma Client

The generated API used by application code to communicate with the database.

### Prisma PostgreSQL Adapter

The adapter connecting Prisma Client to the PostgreSQL driver.

### PostgreSQL

The actual relational database system storing the data.

### `auth_db`

The logical PostgreSQL database owned by the authentication service.

### `User`

The first database model/table belonging to the authentication domain.

### bcrypt

The password-hashing mechanism used before passwords are persisted.

### `.env`

Local configuration containing real environment-specific values and credentials. It must not be committed.

### `.env.example`

A safe template documenting which environment variables developers need to configure.

### HTTP `201 Created`

Returned when a new user is successfully created.

### HTTP `400 Bad Request`

Returned when registration input is invalid.

### HTTP `409 Conflict`

Returned when a registration conflicts with an existing unique username or email.

### HTTP `500 Internal Server Error`

Returned when an unexpected server or database error occurs.

---

## 20. Current Mental Model

The database structure is defined by:

```text
schema.prisma
      |
      | describes
      v
Database structure
```

Database changes are applied through:

```text
migration.sql
      |
      | changes
      v
PostgreSQL database
```

Application database operations use:

```text
Prisma Client
      |
      | reads/writes
      v
PostgreSQL
```

The current registration feature combines these components:

```text
HTTP Request
     |
     v
Express
     |
     v
Registration Controller
     |
     v
Validation
     |
     v
Password Hashing
     |
     v
Prisma Client
     |
     v
PostgreSQL
```

The authentication service now contains both the **database foundation** and its first functional **application-layer vertical slice: user registration**.

Future authentication features can be built incrementally on top of this foundation.
