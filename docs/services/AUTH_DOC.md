# Authentication Service — Development Documentation

This document explains the current authentication service, its architecture, authentication flows, security decisions, and the responsibilities of each component.

It is intended both as technical documentation and as a reference for understanding and explaining the implementation.

---

## 1. Authentication Service Overview

The authentication service is responsible for:

* User registration.
* Password-based login.
* 42 OAuth integration.
* Two-factor authentication (2FA).
* Access-token authentication.
* Refresh-token handling.
* Logout.
* Retrieving the authenticated user.
* Authentication middleware used by protected endpoints.

The service is built with:

* **Node.js**
* **Express**
* **TypeScript**
* **Prisma**
* **PostgreSQL**
* **bcryptjs**
* **jsonwebtoken**
* **otplib** for TOTP-based 2FA
* **qrcode** for generating 2FA QR codes

The general request flow is:

```text
Client
  |
  v
Express
  |
  v
Route
  |
  v
Controller
  |
  v
Service
  |
  v
Prisma
  |
  v
PostgreSQL
```

The main architectural rule is:

```text
Route
  → Controller
  → Service
  → Database
```

Controllers handle HTTP concerns such as requests, responses, status codes, and input validation.

Services contain authentication business logic.

Prisma handles database access.

Middleware handles cross-cutting authentication concerns such as JWT verification.

---

## 2. Current Authentication Structure

The authentication service is organized as follows:

```text
auth/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── __tests__/
│   │   └── auth.test.ts
│   │
│   ├── controllers/
│   │   ├── 42oauth.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── register.controller.ts
│   │   ├── session.controller.ts
│   │   ├── twoFactor.controller.ts
│   │   └── twoFactorLogin.controller.ts
│   │
│   ├── middleware/
│   │   └── auth.middleware.ts
│   │
│   ├── routes/
│   │   └── auth.routes.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── session.service.ts
│   │   └── twoFactor.service.ts
│   │
│   ├── types/
│   │   └── auth.ts
│   │
│   ├── app.ts
│   ├── prisma.ts
│   ├── server.ts
│   └── sessionTokens.ts
│
├── package.json
├── package-lock.json
└── tsconfig.json
```

### Responsibilities

| Component          | Responsibility                                              |
| ------------------ | ----------------------------------------------------------- |
| `controllers/`     | HTTP request/response handling                              |
| `services/`        | Authentication business logic                               |
| `middleware/`      | JWT authentication and request protection                   |
| `routes/`          | Route grouping, currently used for 42 OAuth                 |
| `types/`           | Shared TypeScript types                                     |
| `prisma.ts`        | Prisma client instance                                      |
| `sessionTokens.ts` | Access/refresh token creation and cookie handling           |
| `app.ts`           | Express application configuration and endpoint registration |
| `server.ts`        | Starts the HTTP server                                      |
| `prisma/`          | Prisma schema and migrations                                |

The 42 OAuth controller is intentionally kept separate because it handles the OAuth-specific flow.

---

## 3. Separation Between Controllers and Services

The authentication service follows a controller/service separation.

### Controller

A controller is responsible for HTTP-level concerns:

```text
HTTP request
    |
    v
Validate request
    |
    v
Call service
    |
    v
Convert result/error into HTTP response
```

For example, `auth.controller.ts` checks that the login request contains an email and password, then delegates authentication to:

```text
services/auth.service.ts
```

### Service

The service contains the actual business logic.

For example:

```text
loginUser()
```

is responsible for:

1. Finding the user.
2. Verifying the password.
3. Checking whether 2FA is enabled.
4. Creating a 2FA challenge when necessary.
5. Creating a normal session when 2FA is not required.

This keeps authentication logic out of the HTTP controllers and makes the code easier to reuse and test.

---

## 4. Prisma and Database Access

Prisma is the ORM used by the authentication service.

The application flow is:

```text
Controller
    |
    v
Service
    |
    v
Prisma Client
    |
    v
PostgreSQL
```

The Prisma schema is located at:

```text
auth/prisma/schema.prisma
```

Prisma migrations are stored in:

```text
auth/prisma/migrations/
```

The database connection is configured through the Prisma configuration and environment variables rather than being hardcoded in application code.

The Prisma configuration currently reads the authentication database URL from:

```env
AUTH_DATABASE_URL=...
```

This keeps database credentials outside the source code.

---

## 5. Prisma User Model

The authentication service currently uses the following `User` model:

```prisma
model User {
  id                Int      @id @default(autoincrement())
  username          String   @unique
  email             String   @unique
  passwordHash      String?
  fortyTwoId        Int?     @unique
  avatar            String?
  twoFactorEnabled  Boolean  @default(false)
  twoFactorSecret   String?
  createdAt         DateTime @default(now())
}
```

### `id`

The primary key of the user.

It is generated automatically by the database.

### `username`

The user's unique username.

The database enforces uniqueness.

### `email`

The user's unique email address.

The database also enforces uniqueness.

### `passwordHash`

Contains the bcrypt hash of the user's password.

It is nullable because users authenticated through 42 OAuth do not necessarily have a local password.

Plaintext passwords are never stored.

### `fortyTwoId`

Stores the user's 42 identifier when the account is associated with 42 OAuth.

It is nullable and unique.

### `avatar`

Stores an optional avatar URL.

### `twoFactorEnabled`

Indicates whether the user has completed and enabled two-factor authentication.

It defaults to:

```text
false
```

### `twoFactorSecret`

Stores the user's TOTP secret used for 2FA.

It is nullable because not every user has configured 2FA.

### `createdAt`

Records when the account was created.

The value is generated automatically.

---

## 6. Prisma Migrations and Client Generation

The Prisma schema can be validated with:

```bash
npx prisma validate
```

Prisma Client can be generated with:

```bash
npx prisma generate
```

Migrations can be applied in the deployed/containerized environment with:

```bash
npx prisma migrate deploy
```

During development, a new migration can be created with:

```bash
npx prisma migrate dev --name <migration-name>
```

The migration history is committed to Git so the database structure can be reproduced consistently.

---

## 7. Environment Configuration

Authentication secrets and database credentials must never be hardcoded in source files.

The real `.env` file contains local configuration and secrets.

The committed `.env.example` file should contain placeholders rather than real credentials.

Authentication-related configuration includes:

```env
AUTH_DATABASE_URL=postgresql://...
JWT_SECRET=replace_with_a_secure_random_secret
REFRESH_TOKEN_SECRET=replace_with_a_secure_random_secret
TWO_FACTOR_CHALLENGE_SECRET=replace_with_a_secure_random_secret
```

### `AUTH_DATABASE_URL`

Used by Prisma to connect to the authentication database.

### `JWT_SECRET`

Used to sign and verify access tokens.

### `REFRESH_TOKEN_SECRET`

Used to sign and verify refresh tokens.

### `TWO_FACTOR_CHALLENGE_SECRET`

Used to sign and verify the short-lived JWT issued between password authentication and successful 2FA verification.

Real secret values must never be committed to Git.

A secure random secret can be generated with:

```bash
openssl rand -hex 32
```

This command generates a secret value. It does not generate a JWT.

JWTs themselves are generated by the application using `jsonwebtoken`.

---

# Authentication Flows

## 8. User Registration

The registration endpoint is:

```http
POST /register
```

Example request:

```json
{
  "username": "example",
  "email": "example@email.com",
  "password": "example123"
}
```

The request follows this flow:

```text
POST /register
      |
      v
register.controller.ts
      |
      v
Validate HTTP input
      |
      v
registerUser()
      |
      v
Hash password with bcrypt
      |
      v
Prisma User.create()
      |
      v
PostgreSQL
```

The registration service:

1. Hashes the plaintext password.
2. Creates the user with the resulting hash.
3. Returns safe user information.
4. Converts Prisma unique-constraint errors into an application-level error.

The plaintext password is never persisted.

---

## 9. Registration Validation

The controller performs basic request validation before calling the service.

Current rules include:

* `username` is required.
* `email` is required.
* `password` is required.
* Username must contain at least 3 characters.
* Email must pass the current basic email check.
* Password must contain at least 8 characters.

Invalid input returns:

```http
400 Bad Request
```

If the username or email already exists, the service detects Prisma's unique constraint error and returns:

```http
409 Conflict
```

The API never returns the user's password or `passwordHash`.

---

## 10. Password Hashing

Passwords are hashed using `bcryptjs`.

The important distinction is:

```text
Password
   |
   v
bcrypt.hash(password, 10)
   |
   v
Password hash
   |
   v
Database
```

During login, the password is not decrypted.

Instead, bcrypt compares the supplied password against the stored hash:

```text
Supplied password
        |
        v
bcrypt.compare()
        ^
        |
Stored password hash
```

This means the original password does not need to be recoverable from the database.

---

## 11. Password Login

The login endpoint is:

```http
POST /login
```

Example:

```json
{
  "email": "user@example.com",
  "password": "user-password"
}
```

The request follows this flow:

```text
POST /login
    |
    v
auth.controller.ts
    |
    v
loginUser()
    |
    +--> Find user by email
    |
    +--> Verify password
    |
    +--> Check 2FA status
    |
    +--> Create session OR 2FA challenge
```

The service:

1. Finds the user by email.
2. Verifies that the account exists and has a password.
3. Compares the supplied password with the stored bcrypt hash.
4. Rejects invalid credentials using a generic error.
5. Checks whether 2FA is enabled.
6. Creates a normal session when 2FA is disabled.
7. Creates a short-lived 2FA challenge when 2FA is enabled.

Unknown emails and incorrect passwords both result in:

```json
{
  "error": "Invalid email or password"
}
```

Using the same response prevents the authentication endpoint from unnecessarily revealing whether an email address exists.

---

# Session and Token Management

## 12. Access Tokens

Successful authentication results in an access JWT.

The access token currently contains:

```json
{
  "userId": 1,
  "purpose": "access"
}
```

The token is signed using:

```text
JWT_SECRET
```

The access token lifetime is:

```text
15 minutes
```

The signing algorithm is explicitly restricted to:

```text
HS256
```

The JWT payload should remain minimal.

It must never contain:

* Passwords.
* Password hashes.
* Authentication secrets.
* Other unnecessary sensitive information.

---

## 13. Refresh Tokens

The authentication service also creates a refresh token.

The refresh token contains:

```json
{
  "userId": 1,
  "purpose": "refresh"
}
```

Its lifetime is:

```text
7 days
```

The refresh token is signed using:

```text
REFRESH_TOKEN_SECRET
```

Instead of returning the refresh token to frontend JavaScript, the service stores it in an HTTP-only cookie:

```text
refresh_token
```

The cookie is configured with:

```text
httpOnly
secure
sameSite=strict
path=/api/auth
maxAge=7 days
```

### Why an HTTP-only cookie?

`httpOnly` prevents normal JavaScript running in the browser from directly reading the refresh token.

The access token and refresh token therefore have different roles:

```text
Access token
    |
    +--> Short lifetime
    +--> Used for authenticated API requests

Refresh token
    |
    +--> Longer lifetime
    +--> Stored in HTTP-only cookie
    +--> Used to obtain a new access token
```

---

## 14. Session Creation

Session creation is centralized in:

```text
src/sessionTokens.ts
```

The main function is:

```text
createSession()
```

It:

1. Reads `JWT_SECRET`.
2. Reads `REFRESH_TOKEN_SECRET`.
3. Creates the 15-minute access token.
4. Creates the 7-day refresh token.
5. Stores the refresh token in the secure HTTP-only cookie.
6. Returns the access token.

This prevents token-generation logic from being duplicated across login and 2FA authentication flows.

---

## 15. Refreshing a Session

The refresh endpoint is:

```http
POST /refresh
```

The browser sends the refresh cookie automatically.

The controller:

1. Reads the `refresh_token` cookie.
2. Rejects the request if it is missing.
3. Delegates verification to the session service.
4. Verifies the refresh token using `REFRESH_TOKEN_SECRET`.
5. Explicitly requires the `refresh` token purpose.
6. Retrieves the corresponding user through Prisma.
7. Creates a new access/refresh session.
8. Returns the new access token and safe user information.

The session service is located at:

```text
src/services/session.service.ts
```

Expired or invalid refresh tokens are rejected.

The refresh endpoint also uses:

```http
Cache-Control: no-store
```

because authentication responses should not be cached.

---

## 16. Logout

The logout endpoint is:

```http
POST /logout
```

Logout clears the refresh-token cookie.

The cookie must be cleared using the same relevant cookie configuration, including its path, so that the browser removes the correct cookie.

The access token itself is short-lived and is not stored server-side by this implementation.

---

# JWT Authentication Middleware

## 17. JWT Authentication Middleware

Protected endpoints use:

```text
src/middleware/auth.middleware.ts
```

The middleware expects:

```http
Authorization: Bearer <access-token>
```

The verification flow is:

```text
Authorization header
        |
        v
Extract Bearer token
        |
        v
Verify JWT signature
        |
        v
Check HS256 algorithm
        |
        v
Check token expiration
        |
        v
Validate userId
        |
        v
Attach userId to request
        |
        v
next()
```

The middleware verifies the token using:

```text
JWT_SECRET
```

It also explicitly restricts accepted algorithms to:

```text
HS256
```

The decoded payload must contain a numeric `userId`.

Invalid, missing, expired, or malformed tokens result in:

```http
401 Unauthorized
```

---

## 18. Authenticated Request Type

Express' standard `Request` type does not know about Pacova's authenticated `userId`.

A reusable type is therefore defined in:

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

After the authentication middleware successfully verifies a token, protected handlers can use this authenticated user ID.

---

# Current User

## 19. Current User Endpoint

The endpoint is:

```http
GET /me
```

It requires:

```http
Authorization: Bearer <access-token>
```

The flow is:

```text
GET /me
   |
   v
auth.middleware.ts
   |
   v
Verify JWT
   |
   v
Extract userId
   |
   v
Find user with Prisma
   |
   v
Return safe user data
```

The response contains safe profile information such as:

```json
{
  "user": {
    "id": 1,
    "username": "example",
    "email": "example@email.com",
    "createdAt": "...",
    "twoFactorEnabled": false
  }
}
```

Authentication secrets, passwords, and password hashes are never returned.

---

# Two-Factor Authentication

## 20. Two-Factor Authentication Overview

Pacova uses time-based one-time passwords (TOTP) for 2FA.

The implementation uses:

```text
otplib
```

The service responsible for 2FA business logic is:

```text
src/services/twoFactor.service.ts
```

The flow is:

```text
User
  |
  v
Request 2FA setup
  |
  v
Generate TOTP secret
  |
  v
Generate QR code
  |
  v
User scans QR code
  |
  v
User enters verification code
  |
  v
Verify TOTP code
  |
  v
Enable 2FA
```

---

## 21. 2FA Setup

The endpoint is:

```http
POST /2fa/setup
```

It requires an authenticated access token.

The service:

1. Finds the authenticated user.
2. Generates a TOTP secret.
3. Creates an authenticator URI.
4. Generates a QR code from that URI.
5. Stores the secret for the user.
6. Keeps 2FA disabled until confirmation succeeds.

The QR code allows the user to add the Pacova account to a compatible authenticator application.

At this stage:

```text
twoFactorSecret = configured
twoFactorEnabled = false
```

The secret alone does not activate 2FA.

---

## 22. 2FA Confirmation

The endpoint is:

```http
POST /2fa/confirm
```

It requires authentication.

The user supplies the current authenticator code.

The service:

1. Finds the user.
2. Checks that 2FA setup exists.
3. Verifies the TOTP code.
4. Enables 2FA when the code is valid.

After successful confirmation:

```text
twoFactorEnabled = true
```

An invalid code returns an authentication error rather than enabling 2FA.

---

## 23. 2FA Login Flow

When a user with 2FA enabled logs in with a correct email and password, the service does **not** immediately create a normal authenticated session.

Instead:

```text
Email + password
      |
      v
Credentials valid
      |
      v
2FA enabled?
      |
      v
Create short-lived 2FA challenge
```

The challenge is a separate JWT containing:

```json
{
  "userId": 1,
  "purpose": "2fa"
}
```

The challenge:

* Uses `TWO_FACTOR_CHALLENGE_SECRET`.
* Uses HS256.
* Expires after 5 minutes.
* Is only intended to complete the second authentication step.

The login response indicates that 2FA verification is required.

---

## 24. Completing 2FA Login

The endpoint is:

```http
POST /2fa/verify-login
```

The client provides:

* The short-lived 2FA challenge token.
* The current TOTP code.

The service:

1. Verifies the challenge token.
2. Requires the `2fa` purpose.
3. Requires a numeric user ID.
4. Finds the user.
5. Confirms that 2FA is enabled.
6. Verifies the TOTP code.
7. Creates the normal access/refresh session.
8. Returns the authenticated user information.

The important security distinction is:

```text
Password authentication
        |
        v
Temporary 2FA challenge
        |
        v
Valid TOTP code
        |
        v
Authenticated session
```

Possessing only the challenge token is therefore not sufficient to complete authentication.

---

## 25. Disabling 2FA

The endpoint is:

```http
POST /2fa/disable
```

It requires authentication.

When successful, the service:

```text
twoFactorEnabled = false
twoFactorSecret = null
```

The existing TOTP secret is removed when 2FA is disabled.

---

# 42 OAuth

## 26. 42 OAuth Integration

Pacova supports authentication through the 42 OAuth flow.

The OAuth implementation is kept in:

```text
src/controllers/42oauth.controller.ts
```

The OAuth routes are grouped under:

```text
/42
```

The current endpoints are:

```http
GET  /42/login
GET  /42/callback
POST /42/exchange
```

### `/42/login`

Starts the 42 OAuth authentication flow and redirects the user toward 42.

### `/42/callback`

Handles the redirect from 42 after the OAuth authorization step.

### `/42/exchange`

Handles the application-side exchange of the OAuth result for the application's authentication session.

The OAuth controller is kept separate from the password/2FA controllers because OAuth has a different authentication flow and external provider interaction.

---

# Complete Endpoint Reference

## 27. Authentication Endpoints

| Method | Endpoint            | Authentication | Purpose                            |
| ------ | ------------------- | -------------- | ---------------------------------- |
| `POST` | `/register`         | Public         | Create a local account             |
| `POST` | `/login`            | Public         | Authenticate with email/password   |
| `POST` | `/refresh`          | Refresh cookie | Create a new session               |
| `POST` | `/logout`           | Refresh cookie | Clear the refresh session cookie   |
| `GET`  | `/me`               | Access token   | Retrieve the current user          |
| `POST` | `/2fa/setup`        | Access token   | Start 2FA setup                    |
| `POST` | `/2fa/confirm`      | Access token   | Confirm and enable 2FA             |
| `POST` | `/2fa/verify-login` | 2FA challenge  | Complete login when 2FA is enabled |
| `POST` | `/2fa/disable`      | Access token   | Disable 2FA                        |
| `GET`  | `/42/login`         | Public         | Start 42 OAuth                     |
| `GET`  | `/42/callback`      | Public         | Handle 42 OAuth callback           |
| `POST` | `/42/exchange`      | OAuth flow     | Exchange OAuth result              |

The service also exposes basic operational endpoints:

```http
GET /
GET /health
```

These are used to confirm that the authentication service is running.

---

# Security

## 28. Authentication Security Principles

The authentication service follows several important security rules.

### Passwords

* Never store plaintext passwords.
* Hash passwords using bcrypt.
* Never return passwords or password hashes.
* Use generic invalid-credential responses.

### JWTs

* Keep JWT payloads minimal.
* Explicitly restrict the accepted algorithm to HS256.
* Verify the signature before trusting the payload.
* Check token expiration.
* Validate the expected token purpose.
* Never place secrets or passwords inside JWT payloads.

### Refresh tokens

* Keep refresh tokens out of normal frontend JavaScript access.
* Store them in HTTP-only cookies.
* Use `secure` cookies.
* Use `sameSite=strict`.
* Keep refresh-token lifetime longer than access-token lifetime.
* Clear the cookie on logout.

### Secrets

* Keep authentication secrets in environment variables.
* Never commit real secrets.
* Never hardcode secrets in source files.
* Use placeholders in `.env.example`.

### Authorization headers

Access tokens should be sent using:

```http
Authorization: Bearer <JWT>
```

They should not be placed in URL query parameters.

---

## 29. Why Access and Refresh Tokens Are Separate

The service intentionally uses two different token lifetimes.

```text
Access token
15 minutes
    |
    +--> Used frequently
    +--> Short-lived
    +--> Sent in Authorization header


Refresh token
7 days
    |
    +--> Used to obtain a new access token
    +--> Stored in HTTP-only cookie
    +--> Longer-lived
```

This limits the useful lifetime of an exposed access token while allowing the user to remain authenticated without logging in again every 15 minutes.

---

## 30. Why Token Purpose Is Explicit

Different JWTs are used for different purposes.

For example:

```json
{
  "userId": 1,
  "purpose": "access"
}
```

and:

```json
{
  "userId": 1,
  "purpose": "refresh"
}
```

and:

```json
{
  "userId": 1,
  "purpose": "2fa"
}
```

The purpose is checked when the token is consumed.

This prevents a valid JWT created for one authentication step from automatically being treated as another type of token.

---

# Testing and Verification

## 31. Authentication Testing

The authentication service contains automated tests under:

```text
src/__tests__/auth.test.ts
```

The authentication flow should also be manually tested through the actual application routing path.

Important cases include:

### Registration

* Valid registration succeeds.
* Missing required fields are rejected.
* Short usernames are rejected.
* Invalid email input is rejected.
* Short passwords are rejected.
* Duplicate username/email is rejected.

### Password login

* Valid credentials succeed.
* Incorrect password is rejected.
* Unknown email is rejected.
* Missing credentials are rejected.

### JWT authentication

* Valid access token succeeds.
* Missing Authorization header is rejected.
* Malformed token is rejected.
* Expired token is rejected.
* Modified token is rejected.
* Incorrect JWT purpose is rejected.

### Refresh sessions

* Missing refresh cookie is rejected.
* Valid refresh token creates a new session.
* Invalid refresh token is rejected.
* Expired refresh token is rejected.
* Logout clears the refresh cookie.

### 2FA

* Setup creates a TOTP secret and QR code.
* Invalid confirmation code is rejected.
* Valid confirmation code enables 2FA.
* Password login with 2FA enabled creates a challenge instead of a full session.
* Invalid challenge is rejected.
* Invalid TOTP code is rejected.
* Valid challenge + TOTP code creates a session.
* Disabling 2FA removes the stored secret.

### OAuth

* 42 login redirects correctly.
* OAuth callback is handled correctly.
* OAuth exchange produces the expected application authentication flow.

---

## 32. Database Verification

During development, user records can be inspected without selecting authentication secrets or password hashes.

For example:

```sql
SELECT
  id,
  username,
  email,
  "fortyTwoId",
  avatar,
  "twoFactorEnabled",
  "createdAt"
FROM "User";
```

Password hashes and 2FA secrets should not be included in routine debugging output.

---

# End-to-End Flows

## 33. Local Registration and Login

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
Create User through Prisma
   |
   v
PostgreSQL
   |
   v
LOGIN
   |
   v
Find user by email
   |
   v
bcrypt.compare()
   |
   +----------------------+
   |                      |
2FA disabled           2FA enabled
   |                      |
   v                      v
Create session       Create 2FA challenge
   |                      |
   |                      v
   |                 Verify TOTP code
   |                      |
   |                      v
   |                 Create session
   |                      |
   +----------+-----------+
              |
              v
       Access token
              |
              v
     Authenticated API
```

---

## 34. Authenticated API Request

```text
Client
  |
  | Authorization: Bearer <access-token>
  v
Auth middleware
  |
  v
Verify JWT
  |
  v
Validate purpose + userId
  |
  v
Attach userId to request
  |
  v
Controller
  |
  v
Service
  |
  v
Prisma
  |
  v
PostgreSQL
```

---

## 35. Refresh Flow

```text
Access token expires
        |
        v
Client calls POST /refresh
        |
        v
Browser sends refresh_token cookie
        |
        v
Session service verifies refresh JWT
        |
        v
Find user
        |
        v
Create new access + refresh session
        |
        v
Return new access token
```

---

## 36. 2FA Authentication Flow

```text
Email + password
       |
       v
Credentials valid
       |
       v
2FA enabled?
       |
      YES
       |
       v
Create 5-minute 2FA challenge
       |
       v
User enters authenticator code
       |
       v
Verify challenge
       |
       v
Verify TOTP code
       |
       v
Create normal session
       |
       v
Authenticated
```

---

# Current Implementation Status

## 37. Implemented

The authentication service currently includes:

* Express authentication API.
* TypeScript implementation.
* Prisma integration.
* User registration.
* Registration validation.
* bcrypt password hashing.
* Duplicate username/email handling.
* Password-based login.
* Generic invalid-credential responses.
* JWT access tokens.
* 15-minute access-token lifetime.
* Explicit HS256 signing and verification.
* JWT authentication middleware.
* Access-token purpose validation.
* Refresh tokens.
* 7-day refresh-token lifetime.
* HTTP-only secure refresh-token cookies.
* Session refresh.
* Logout.
* Authenticated `/me` endpoint.
* Reusable authenticated request type.
* TOTP-based two-factor authentication.
* QR-code generation for 2FA setup.
* 2FA confirmation.
* 2FA login challenge flow.
* 2FA disable flow.
* 42 OAuth integration.
* Environment-based authentication secrets.
* Prisma migrations.
* Authentication tests and manual verification procedures.

---

## 38. Important Architectural Decisions

### Controllers do not contain the main business logic

Authentication logic belongs in services.

```text
Controller
    |
    v
Service
    |
    v
Prisma
```

This keeps the HTTP layer simple and makes business logic easier to maintain.

### Session creation is centralized

Access and refresh token creation is centralized in:

```text
sessionTokens.ts
```

This avoids having different authentication paths create tokens with inconsistent security settings.

### 2FA logic is centralized

2FA setup, confirmation, disabling, and login verification are handled by:

```text
twoFactor.service.ts
```

The login-specific 2FA flow reuses the same service instead of creating duplicate 2FA business logic.

### OAuth remains separate

42 OAuth has its own controller and route group because its authentication flow differs from normal password authentication.

---

# Security Checklist

## 39. Rules to Keep

* [ ] Never store plaintext passwords.
* [ ] Never return passwords or password hashes.
* [ ] Never commit real authentication secrets.
* [ ] Never log authentication secrets unnecessarily.
* [ ] Keep JWT payloads minimal.
* [ ] Verify JWT signatures before trusting claims.
* [ ] Restrict accepted JWT algorithms.
* [ ] Check JWT expiration.
* [ ] Validate JWT purpose.
* [ ] Validate the authenticated `userId`.
* [ ] Keep access tokens short-lived.
* [ ] Store refresh tokens in HTTP-only cookies.
* [ ] Use secure cookie settings.
* [ ] Do not place access tokens in URL query parameters.
* [ ] Keep authentication business logic inside services.
* [ ] Do not expose database secrets through API responses.
* [ ] Do not expose password hashes or 2FA secrets during debugging.

---

## 40. Authentication Service at a Glance

```text
                         PACOVA AUTH SERVICE
                                  |
        +-------------------------+-------------------------+
        |                         |                         |
   Registration               Login                    42 OAuth
        |                         |                         |
   bcrypt hash             Check password          OAuth provider
        |                         |                         |
        |                  +------+-------+                 |
        |                  |              |                 |
        |              No 2FA           2FA                |
        |                  |              |                 |
        |                  |        5-min challenge         |
        |                  |              |                 |
        |                  |          TOTP verify            |
        |                  |              |                 |
        +------------------+--------------+-----------------+
                           |
                           v
                    Session Creation
                           |
                +----------+----------+
                |                     |
          Access Token          Refresh Token
            15 minutes              7 days
                |                     |
       Authorization header     HTTP-only cookie
                |                     |
                +----------+----------+
                           |
                           v
                   Protected Endpoints
                           |
                           v
                       Prisma
                           |
                           v
                      PostgreSQL
```

This represents the current authentication architecture and should be updated when authentication behavior or endpoint responsibilities change.
