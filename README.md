*This project has been created as part of the 42 curriculum by machaouk, hfegrach, nel-khad, ynadime, oelmanso.*

<div align="center">

<img src="frontend/public/pacova-map.png" alt="PACOVA maze" width="20%" style="min-width:110px;max-width:250px;height:auto" />

# PACOVA

**ft_transcendence — a multiplayer Pac-Man web game**

</div>

## Description

**PACOVA** is a real-time multiplayer web game based on the original **Pac-Man**, built as a set of microservices with accounts, friends, chat, notifications, statistics and a leaderboard around the game. The goal is a complete full-stack web application (frontend, backend, database) that runs with one command.

**Rules:** classic Pac-Man — eat all the pellets, avoid the ghosts, use power pellets to make them vulnerable, 3 lives, one timer. In **remote mode there are two Pac-Mans** in the same maze, played from two computers.

**Key features**

- Sign up / login, **42 OAuth**, **2FA** (TOTP)
- Local game, **vs. AI bot** (3 levels), **online 1v1** with matchmaking and 3 mazes
- Real-time chat, friends with online status, notifications
- Profiles, avatars, achievements, match history, leaderboard
- English / French / Arabic (RTL), custom design system, responsive UI

More details (diagrams, flows): [`docs/`](docs/README.md).

## Instructions

**Prerequisites:** Docker Engine + Docker Compose v2, Google Chrome (latest). Node.js is not needed on the host.

```bash
git clone git@github.com:HanFeg-42/ft_transcendence.git
cd ft_transcendence
cp .env.example .env       # fill in the values (below)
make
```

Open **https://localhost:443** (self-signed certificate: accept the browser warning once).

**`.env` variables:** PostgreSQL credentials (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`), one `*_DATABASE_URL` per service (auth, user, chat, game), token secrets (`JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `TWO_FACTOR_CHALLENGE_SECRET` — generate with `openssl rand -hex 32`), 42 OAuth app (`FORTYTWO_CLIENT_ID`, `FORTYTWO_CLIENT_SECRET`), and the URLs `FORTYTWO_CALLBACK_URL=https://localhost:443/api/auth/42/callback`, `FRONTEND_URL=https://localhost:443`.

Databases are created by `postgres-db/init.sql`; Prisma migrations run automatically at start. Make targets: `make`, `make down`, `make logs`, `make status`, `make migrate`, `make clean` (wipes volumes), `make re`.

## Team Information

| Login | Role(s) | Responsibilities |
|---|---|---|
| `hfegrach` | Product Owner, Developer | Owns the backlog, auth |
| `machaouk` | Tech Lead, Developer | Microservices and gateway architecture |
| `nel-khad` | Project Manager, Developer | Task tracking, UI/UX and design system |
| `ynadime` | Developer | Game backend and remote multiplayer |
| `oelmanso` | Developer | Settings and friends |

## Project Management

- **Organisation:** 1-week Scrum sprints (planning, review, retrospective); each member took or split backlog cards. See [`docs/architecture/team-workflow.md`](docs/architecture/team-workflow.md).
- **Tools:** Trello (backlog and sprint board), GitHub (Pull Requests, code review, protected `main` and `dev`), Figma (design), Discord.
- **Git rules:** feature branches, PR + 1 approval, Conventional Commits.

## Technical Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, Vite, React Router, Tailwind CSS 4, i18next |
| Backend | Node.js + Express (TypeScript), `ws` for WebSockets |
| API Gateway | Express + `http-proxy-middleware` + `express-rate-limit` |
| Database | PostgreSQL 17 with Prisma 7 |
| Security | bcrypt, JWT (access + refresh), TOTP 2FA (`otplib`), NGINX TLS |
| Infra | Docker Compose, NGINX |

**Why these choices**

- **PostgreSQL:** relational data with clear relations (users, friendships, matches).
- **Microservices:** one responsibility and one database per service, so we could work in parallel without conflicts.
- **Express + React:** one language (TypeScript) across the stack, with shared WebSocket types in `shared/types`.
- **Server-authoritative game:** the server runs the game loop; clients only send directions.

## Database Schema

One PostgreSQL server, **one database per service**; services reference users by `userId` (no cross-database foreign keys). Full ER diagram: [`docs/architecture/database.md`](docs/architecture/database.md).

| Database | Tables (key fields) | Relations |
|---|---|---|
| `auth_db` | `User` (id Int, username String, email String, passwordHash String?, fortyTwoId Int?, twoFactorEnabled Boolean, twoFactorSecret String?) | — |
| `user_db` | `Profile` (userId Int, displayName String?, bio String, avatarUrl String?, statusText String?), `Achievement` (id String, title String, description String, image String), `UserAchievement` (userId Int, achievementId String, unlocked Boolean, progress Int) | Profile 1—N UserAchievement N—1 Achievement |
| `chat_db` | `Message` (senderId, receiverId, content String, kind String, meta Json?, readAt DateTime?), `BlockedUser` (blockerId, blockedId), `FriendRequest` (requesterId, addresseeId, status String), `Friendship` (userLowId, userHighId), `Notification` (userId, type String, payload Json, isRead Boolean) | Unique pairs on blocks, requests and friendships |
| `game_db` | `Match` (id BigInt, mode, status, mazeSeed String?, timeLimitSeconds Int, winnerUserId Int?, startedAt, endedAt), `MatchParticipant` (matchId, userId, slot Int, result String?, score Int, pelletsEaten Int, ghostsEaten Int, livesRemaining Int) | Match 1—N MatchParticipant |

## Features List

| Feature | Description | Who |
|---|---|---|
| Microservices + gateway | Service split, nginx, routing, WebSocket proxying | `machaouk` |
| Sign up / login | Email + password, validated on both sides, bcrypt, JWT + refresh cookie | `hfegrach` |
| 42 OAuth | "Continue with 42" login | `hfegrach` |
| 2FA | TOTP with QR code | `hfegrach` |
| Auth pages | Login / sign-up UI | `nel-khad` |
| Profile | Public and own profile, avatar, rank, achievements, match history | `nel-khad` |
| Settings | Edit profile, avatar upload, security, language | `oelmanso` |
| Friends | Requests, accept / decline / remove, list with online status | `oelmanso` |
| Chat | Real-time private chat, history, block, typing, read receipts, game invites | `machaouk` |
| Notifications | Real-time and persistent, unread counter | `hfegrach` |
| Local game | Two players on one device | `ynadime` |
| Play vs. bot | Pac-Man bot with 3 difficulty levels | `machaouk` |
| Online 1v1 | Matchmaking, two Pac-Mans on two computers, reconnection | `ynadime` |
| Game customization | 3 mazes, power pellets, difficulty and time settings | `ynadime`, `machaouk` |
| Statistics and leaderboard | Wins, losses, pellets / ghosts eaten, ranking by wins | `ynadime`, `hfegrach` |
| Design system | Components, palette, fonts, game assets | `nel-khad` |
| i18n | EN / FR / AR with language switcher, right-to-left layout for Arabic | team |
| Legal pages | Privacy Policy and Terms of Service | `hfegrach` |

Each member also made their own pages responsive.

## Modules

**14 points required.** Major = 2 pts, Minor = 1 pt.

| Module | Type | Pts | Why / how | Who |
|---|---|---|---|---|
| Frontend + backend framework | Major | 2 | React + Express, structured architecture, shared types | all |
| Real-time (WebSockets) | Major | 2 | `ws` in chat and game, JWT-checked upgrades through the gateway, rooms, presence | `machaouk`, `ynadime`, `hfegrach` |
| User interaction | Major | 2 | Chat, profiles, friends | `machaouk`, `nel-khad`, `oelmanso` |
| ORM | Minor | 1 | Prisma models and migrations in every service | all |
| Notification system | Minor | 1 | Persistent notifications pushed in real time | `hfegrach` |
| Custom design system | Minor | 1 | Palette, pixel typography, 10+ reusable components | `nel-khad` |
| Multiple languages | Minor | 1 | i18next, EN / FR / AR | team |
| Right-to-left (RTL) support | Minor | 1 | Arabic sets `dir="rtl"`; layout uses logical CSS properties so it mirrors | team |
| Standard user management | Major | 2 | Profile edit, avatar upload, friends + status, profile page | `nel-khad`, `oelmanso` |
| Game statistics and match history | Minor | 1 | Stats, history, achievements, leaderboard | `ynadime`, `hfegrach`, `nel-khad` |
| OAuth 2.0 | Minor | 1 | 42 intra login | `hfegrach` |
| 2FA | Minor | 1 | TOTP with QR code | `hfegrach` |
| AI opponent | Major | 2 | Depth-limited look-ahead with a per-level mistake probability, so it plays human-like and can lose | `machaouk` |
| Complete web-based game | Major | 2 | Pac-Man with rules, lives, timer, win / loss | `ynadime` |
| Remote players | Major | 2 | Two computers, server-authoritative loop, forfeit timers, reconnection | `ynadime` |
| Advanced chat features | Minor | 1 | Block, game invites, history, typing, read receipts | `machaouk` |
| Game customization | Minor | 1 | 3 mazes, difficulty settings | `ynadime`, `machaouk` |
| Backend as microservices | Major | 2 | `auth`, `user`, `chat`, `game` + gateway, REST and WebSocket, one DB each | `machaouk` |

**Total: 26 points**, above the required 14.

## Individual Contributions

| Login | Contributions | Challenge and solution |
|---|---|---|
| `hfegrach` | Database schemas, auth (register, login, JWT / refresh), 2FA, 42 OAuth, notifications, leaderboard, legal pages | Keeping schemas consistent as they evolved: one Prisma schema per service |
| `machaouk` | Microservices, API gateway, Docker / NGINX, chat, AI bot and bot page, shared WebSocket types | Authenticating WebSockets behind NGINX: JWT checked at the upgrade, user id forwarded to the service |
| `nel-khad` | Profile pages, design system, auth pages UI, game assets and components | One consistent retro look: shared components built first |
| `ynadime` | Game backend and engine, remote multiplayer, matchmaking, game database, local game | Syncing two clients and drops: authoritative server state, forfeit timers |
| `oelmanso` | Settings page, friends system (backend + frontend) | Duplicate friendships on simultaneous actions: unique constraints on pairs |

## Resources

- [Microservices — GeeksforGeeks](https://www.geeksforgeeks.org/system-design/microservices/)
- [What is WebSocket? — Ably](https://ably.com/topic/websockets)
- [Breadth First Search — GeeksforGeeks](https://www.geeksforgeeks.org/dsa/breadth-first-search-or-bfs-for-a-graph/) (bot pathfinding)
- [Depth Limited Search for AI — GeeksforGeeks](https://www.geeksforgeeks.org/artificial-intelligence/depth-limited-search-for-ai/) (bot look-ahead)

**Use of AI:** used to explain concepts (microservices, WebSocket proxying, JWT / 2FA), read error messages, get code-review second opinions, and help with FR / AR translations.