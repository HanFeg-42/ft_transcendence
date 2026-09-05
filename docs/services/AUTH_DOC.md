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
   +--> Registration Controller
   |
   +--> Login Controller
   |
   +--> JWT Authentication Middleware
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

`bcryptjs` is used to hash passwords during registration and verify passwords during login.

Prisma acts as the ORM layer between the Node.js authentication service and PostgreSQL.

`jsonwebtoken` is used to issue and verify JWT access tokens.

---

## 2. PostgreSQL Setup

A PostgreSQL service is configured through Docker Compose.

The PostgreSQL data directory is backed by a Docker named volume so database data persists independently of the PostgreSQL container lifecycle.

The initialization script is located at:

```text
postgres-db/init.sql
```

It creates the logical databases required by the application, including:

```text
auth_db
game_db
```

The Auth service owns the `auth_db` database.

---

## 3. Environment Configuration

Database credentials and authentication secrets must not be hardcoded in source files.

The real `.env` file contains local configuration and credentials and must remain ignored by Git.

The committed `.env.example` file documents which environment variables developers are expected to provide.

The current authentication-related environment variables include:

```env
AUTH_DATABASE_URL=postgresql://your_postgres_user:your_postgres_password@postgres:5432/auth_db
JWT_SECRET=replace_with_a_secure_random_secret
```

The real `JWT_SECRET` value must never be committed.

---

## 4. Prisma

Prisma is the ORM used by the authentication service.

The current flow is:

```text
Express application
        |
        v
Controllers / Protected Routes
        |
        v
Prisma Client
        |
        v
PostgreSQL
```

Prisma was initialized inside the `auth` service because the authentication service owns its own database schema.

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
│   ├── loginController.ts
│   ├── authMiddleware.ts
│   ├── prisma.ts
│   ├── types/
│   │   └── auth.ts
│   └── generated/
│       └── prisma/
├── package.json
└── package-lock.json
```

---

## 5. Prisma Schema

The first model implemented is:

```text
User
```

The current User model contains:

```text
User
├── id
├── username
├── email
├── passwordHash
└── createdAt
```

### `id`

The `id` is the primary key of the User model and is generated automatically.

### `username`

The username is unique at the database level.

### `email`

The email is also unique at the database level.

### `passwordHash`

Plaintext passwords are never stored.

During registration:

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
Prisma
        |
        v
PostgreSQL
```

Only the hash is persisted.

### `createdAt`

`createdAt` records when the user account was created and is generated automatically.

---

## 6. Prisma Migrations and Client Generation

The initial migration was created with:

```bash
npx prisma migrate dev --name init_auth
```

The Prisma schema can be validated with:

```bash
npx prisma validate
```

Prisma Client is generated with:

```bash
npx prisma generate
```

Committed migrations can be applied in the containerized environment with:

```bash
npx prisma migrate deploy
```

---

## 7. Express Authentication Server

The authentication service HTTP server is initialized in:

```text
src/server.ts
```

Express JSON middleware is enabled using:

```ts
app.use(express.json());
```

The Auth service currently exposes:

```http
POST /register
POST /login
GET /me
```

`GET /me` is protected by JWT authentication middleware.

---

## 8. User Registration

The authentication service provides:

```http
POST /register
```

A registration request contains:

```json
{
  "username": "example",
  "email": "example@email.com",
  "password": "example123"
}
```

The backend currently:

1. Reads `username`, `email`, and `password`.
2. Checks that all required fields are present.
3. Performs basic backend validation.
4. Hashes the plaintext password using `bcryptjs`.
5. Creates the user through Prisma.
6. Handles unique username/email conflicts.
7. Returns a safe user object.

A successful registration returns `201 Created`.

The response never exposes:

```text
password
passwordHash
```

---

## 9. Registration Validation

The current backend rules are:

- `username`, `email`, and `password` are required.
- Username must contain at least 3 characters.
- Email must pass the current basic email check.
- Password must contain at least 8 characters.

Invalid registration data returns `400 Bad Request`.

Duplicate username/email conflicts return `409 Conflict`.

---

## 10. Password Hashing

Passwords are hashed with `bcryptjs`.

The controller uses:

```ts
bcrypt.hash(password, 10)
```

The original plaintext password is not stored in PostgreSQL and is not returned by the API.

---

## 11. User Login

The authentication service provides:

```http
POST /login
```

A login request contains:

```json
{
  "email": "user@example.com",
  "password": "user-password"
}
```

The login controller performs the following steps:

1. Verifies that `email` and `password` were provided.
2. Searches for the user by email using Prisma.
3. Compares the provided password with the stored bcrypt hash.
4. Rejects invalid credentials with a generic error.
5. Generates a signed JWT when authentication succeeds.
6. Returns the JWT together with safe user information.

The same error is used for an unknown email and an incorrect password:

```json
{
  "error": "Invalid email or password"
}
```

This avoids revealing whether a specific email address exists.

---

## 12. JWT Authentication

After a successful login, the Auth service issues a JSON Web Token.

A JWT contains three logical parts:

```text
header.payload.signature
```

The payload currently contains only the authenticated user's identifier:

```json
{
  "userId": 1
}
```

Sensitive information such as passwords, password hashes, or the JWT secret must never be placed in the JWT payload.

The token is created using `jsonwebtoken`:

```ts
jwt.sign(
  {
    userId: user.id,
  },
  jwtSecret,
  {
    expiresIn: "1h",
    algorithm: "HS256",
  },
);
```

The token expires after one hour.

---

## 13. JWT Secret Configuration

JWT signatures depend on a server-side secret stored in:

```text
JWT_SECRET
```

The real secret belongs in the local `.env` file and must never be committed to Git.

A secure random development secret can be generated using:

```bash
openssl rand -hex 32
```

Example:

```env
JWT_SECRET=<generated-secret>
```

The generated value must never appear in documentation, source code, commits, logs, or `.env.example`.

The committed `.env.example` should contain only a placeholder:

```env
JWT_SECRET=replace_with_a_secure_random_secret
```

Important distinction: `openssl rand -hex 32` generates the secret used to sign JWTs. It does **not** generate a JWT itself. The JWT is generated by the application using `jwt.sign()`.

---

## 14. JWT Verification Middleware

Protected endpoints use authentication middleware before executing their route handler.

The client sends the token using the HTTP Authorization header:

```http
Authorization: Bearer <JWT>
```

JWTs must not be sent through URL query parameters.

The middleware verifies the token with:

```ts
jwt.verify(authToken, jwtSecret, {
  algorithms: ["HS256"],
});
```

The middleware checks:

- the Authorization header exists,
- the Bearer format is valid,
- `JWT_SECRET` is configured,
- the JWT signature is valid,
- the token is not expired,
- the accepted algorithm is `HS256`,
- the decoded payload contains a numeric `userId`.

If verification succeeds, the middleware attaches the verified `userId` to the request and calls `next()`.

Invalid or expired tokens return `401 Unauthorized`.

---

## 15. Authenticated Request Type

Express' default `Request` type does not contain a custom `userId` property.

A reusable request type is therefore defined in:

```text
src/types/auth.ts
```

Conceptually:

```ts
import type { Request } from "express";

export interface AuthenticatedRequest extends Request {
  userId: number;
}
```

---

## 16. Protected User Endpoint

The Auth service provides:

```http
GET /me
```

The endpoint requires:

```http
Authorization: Bearer <JWT>
```

After the authentication middleware verifies the token, the authenticated `userId` is used to retrieve the current user through Prisma.

The response contains safe profile fields:

```json
{
  "user": {
    "id": 1,
    "username": "example",
    "email": "example@email.com",
    "createdAt": "..."
  }
}
```

The response never exposes `password`, `passwordHash`, or `JWT_SECRET`.

---

## 17. Authentication Security Tests

The login and JWT flow was manually tested through the application routing path.

### Successful login

A correct email/password pair returns `200 OK` and includes a JWT.

### Wrong password

An incorrect password returns `401 Unauthorized`.

### Unknown email

A nonexistent email also returns `401 Unauthorized` using the same generic error.

### Missing token

A request to `/me` without an Authorization header returns `401 Unauthorized`.

### Fake token

A fabricated or malformed token is rejected with `401 Unauthorized`.

### Modified token

Changing a character in a valid JWT invalidates its signature and the request is rejected.

### Valid token

A correctly signed, unexpired JWT allows access to `/me`.

---

## 18. Database Verification

For routine development and debugging, user records can be inspected without selecting authentication hashes:

```sql
SELECT id, username, email, "createdAt"
FROM "User";
```

Password hashes should not be part of normal-purpose debugging output.

---

## 19. Current Authentication Status

Implemented:

- PostgreSQL authentication database.
- Prisma User schema and migrations.
- User registration.
- Backend registration validation.
- bcrypt password hashing.
- Duplicate username/email handling.
- User login.
- Password verification with `bcrypt.compare()`.
- JWT generation after successful login.
- One-hour JWT expiration.
- Explicit HS256 signing and verification.
- JWT authentication middleware.
- Runtime validation of the JWT `userId`.
- Reusable authenticated request type.
- Protected `GET /me` endpoint.
- Authenticated user lookup through Prisma.
- Safe API responses that do not expose password hashes.
- Environment-based `JWT_SECRET` configuration.
- Manual testing of valid, missing, fake, and modified tokens.

---

## 20. Not Implemented Yet

The following authentication-related work remains for future sprints:

- 42 OAuth.
- Two-factor authentication.
- Refresh-token/session strategy.
- Role/permission authorization.
- Login rate limiting / brute-force protection.
- Full frontend login integration.
- Additional production hardening.

---

## 21. Security Rules to Keep

- Never store plaintext passwords.
- Never return passwords or password hashes in API responses.
- Never commit `JWT_SECRET`.
- Never log JWTs unnecessarily.
- Keep the JWT payload minimal.
- Always verify tokens before trusting their payload.
- Keep token expiration enabled.
- Restrict accepted JWT algorithms explicitly.
- Send access tokens through the Authorization header rather than URL query parameters.
- Keep real secrets in `.env` and placeholders only in `.env.example`.

---

## 22. Current End-to-End Authentication Flow

```text
REGISTER
   |
   v
Validate input
   |
   v
Hash password with bcrypt
   |
   v
Store user in PostgreSQL
   |
   v
LOGIN
   |
   v
Find user by email
   |
   v
Verify password with bcrypt.compare()
   |
   v
Issue signed JWT
   |
   v
Client sends Authorization: Bearer <JWT>
   |
   v
JWT middleware verifies token
   |
   v
Extract verified userId
   |
   v
Protected /me route
   |
   v
Fetch authenticated user through Prisma
   |
   v
Return safe profile data
```
