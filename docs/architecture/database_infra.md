# Pacova Database Infrastructure

## Overview

Pacova uses a **separate PostgreSQL database for each backend service**.

The current architecture is:

```text
                    ┌──────────────────┐
                    │   API Gateway    │
                    │      :3000       │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐──────────────┐
              │              │              │              │
              ▼              ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
        │   Auth   │   │   User   │   │   Chat   │   │   Game   │
        │  :3001   │   │  :3004   │   │  :3003   │   │  :3002   │
        └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
             │              │              │              │
             ▼              ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ auth_db  │   │ user_db  │   │ chat_db  │   │ game_db  │
        └──────────┘   └──────────┘   └──────────┘   └──────────┘

```

The databases are physically separated, while services communicate through the API layer rather than directly accessing another service's database.

---

## Database ownership

Each service owns its own data.

| Service | Database  | Responsibility                                 |
| ------- | --------- | ---------------------------------------------- |
| Auth    | `auth_db` | Authentication, accounts, OAuth, 2FA, sessions |
| User    | `user_db` | Profiles, achievements and user-related data   |
| Chat    | `chat_db` | Messages, blocks and chat-related data         |
| Game    | `game_db` | Matches, participants and game-related data    |

### Important rule

A service must **not directly connect to another service's database**.

For example:

```text
Chat  ──X──> user_db
Game  ──X──> auth_db
User  ──X──> chat_db
```

Instead, services should communicate through their HTTP/WebSocket APIs.

---

# Authentication and user identity

Authentication is handled by the Auth service.

After a user successfully authenticates, the API Gateway validates the JWT.

For protected HTTP requests, the Gateway adds:

```text
x-user-id: <authenticated-user-id>
```

The downstream service can therefore identify the authenticated user without accessing `auth_db`.

Example:

```text
Browser
   │
   │ Authorization: Bearer <JWT>
   ▼
API Gateway
   │
   │ JWT validation
   │
   │ x-user-id: 42
   ▼
User / Chat / Game service
```

### Important

A service should trust the `x-user-id` value only when the request has passed through the authenticated API Gateway.

Services should not ask the frontend to send an arbitrary user ID as the source of authentication.

---

# User profiles

The User service owns profile information in `user_db`.

The main profile model contains information such as:

```text
Profile
├── userId
├── displayName
├── bio
├── avatarUrl
├── statusText
├── createdAt
└── updatedAt
```

`Profile.userId` corresponds to the authenticated user's ID from Auth.

The User service exposes:

```text
GET /profile/me
GET /profile/:id
PATCH /profile/me
```

Through the API Gateway, frontend requests use the `/users` route.

For example:

```text
GET /api/users/profile/me
Authorization: Bearer <JWT>
```

The Gateway validates the JWT and forwards the authenticated identity to the User service.

---

# Service-to-service user information

Because databases are isolated, another service must not query `user_db` directly.

If a service needs profile information, it should communicate with the User service.

Conceptually:

```text
Chat
  │
  │ HTTP request
  ▼
User service
  │
  ▼
user_db
```

The same principle applies to Game and other services.

This keeps database ownership clear and prevents tight coupling between services.

---

# Prisma and migrations

Each service has its own Prisma schema and migration history.

For example:

```text
auth/prisma/
├── schema.prisma
└── migrations/

user/prisma/
├── schema.prisma
└── migrations/

chat/prisma/
├── schema.prisma
└── migrations/

game/prisma/
├── schema.prisma
└── migrations/
```

Each service uses its own `DATABASE_URL`.

Example conceptually:

```env
AUTH_DATABASE_URL=.../auth_db
USER_DATABASE_URL=.../user_db
CHAT_DATABASE_URL=.../chat_db
GAME_DATABASE_URL=.../game_db
```

The exact values are provided through the project's environment configuration and should not be committed with secrets.

---

# Running migrations

The project Makefile provides the migration workflow.

The intended workflow is:

```bash
make
```

to build/start the services, followed by:

```bash
make migrate
```

to apply the Prisma migrations for the service databases.

After changing a Prisma schema, the corresponding migration must be created for that service.

Do not manually modify another service's migration history.

---

# How Chat should use users

Chat owns chat data, not user accounts.

For example, a Chat message contains identifiers such as:

```text
senderId
receiverId
content
createdAt
```

`senderId` and `receiverId` represent user IDs.

Chat should obtain the authenticated sender from:

```text
x-user-id
```

rather than trusting a sender ID supplied by the browser.

Conceptually:

```text
Authenticated user
        │
        │ x-user-id = 42
        ▼
      Chat
        │
        ├── senderId = 42
        │
        └── receiverId = another user ID
```

Chat can then request profile information from the User service when it needs to display a username/avatar.

### Important distinction

The Chat database stores the **relationship/message data**.

The User database stores the **profile data**.

Chat should not duplicate the complete User/Profile model inside `chat_db`.

---

# How Game should use users

Game follows the same principle.

Game data can reference users by their IDs:

```text
Match
MatchParticipant
    └── userId
```

The Game service owns match/game information in `game_db`.

It should not create a second authentication database or directly query `auth_db`.

When Game needs information about a player, it can use the authenticated user ID and communicate with the appropriate service API.

Conceptually:

```text
JWT
 │
 ▼
API Gateway
 │
 │ x-user-id
 ▼
Game service
 │
 ├── game_db → match/game information
 │
 └── User service → profile information when needed
```

---

# Why databases are separated

The separation gives each service clear ownership:

```text
Auth  → identity/authentication
User  → profile
Chat  → communication
Game  → gameplay
```

Benefits include:

* independent service ownership
* reduced database coupling
* clearer Prisma schemas
* easier service-level migrations
* fewer cross-service foreign-key dependencies
* easier future scaling
* clearer security boundaries

A database foreign key should generally remain inside the database that owns both models.

Cross-service relationships should use IDs and service APIs rather than PostgreSQL foreign keys across databases.

---

# Development rules for the team

When adding a new model, ask:

1. **Which service owns this data?**
2. **Which database should contain it?**
3. **Does this model need information owned by another service?**
4. **Can that information be obtained through the service API instead of a database connection?**
5. **Does the authenticated user come from `x-user-id` rather than frontend-provided identity?**

### Example

If Chat needs a username:

```text
Do NOT:

Chat → user_db → Profile
```

Prefer:

```text
Chat → User service → Profile
```

If Game needs the authenticated player's ID:

```text
JWT → API Gateway → x-user-id → Game
```

rather than trusting:

```text
POST /game
{
  "userId": 123
}
```

as the authentication identity.

---

# Current database architecture summary
                 ┌─────────────────────┐
                 │     API Gateway     │
                 │  JWT authentication │
                 └──────────┬──────────┘
                            │
                x-user-id   │
                            │
       ┌────────────────────┼────────────────────┬────────────────────┐
       │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼
    Auth :3001           User :3004           Chat :3003           Game :3002
       │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼
    auth_db              user_db              chat_db              game_db
                            ▲
                            │
                       profile data

The key rule is:

> **Services own their databases; user identity comes from the authenticated Gateway; cross-service information is obtained through service APIs.**
