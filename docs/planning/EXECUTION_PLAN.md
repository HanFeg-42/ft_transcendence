# ft_transcendence — Execution Plan (Master Planning Doc)
**Team:** Hanane (PO/SM/Dev), Malika (Infra Lead), Nouss (Dev), Zineb (Dev, unavailable Sprints 1–2)
**Timeline:** 8 weeks / 4 sprints... wait, 8 weeks = 8 one-week sprints
**Status:** Sprint 1, Day 1 — 10% admin, 0% technical implementation

> ⚠️ **Important caveat before you use this document:** you did not attach your campus's actual `en.subject.pdf`. Module names and point values differ slightly across 42 campuses/cohort versions, and 42 updates them periodically. I've mapped modules based on (a) the features you've described in this brief and (b) the module taxonomy that's been stable across recent versions of the subject (Framework backend, front-end framework, DB, standard user management, remote auth, 2FA+JWT, microservices, remote players, live chat, dashboards, accessibility, GDPR, devices, browser compat, multiple languages, monitoring/WAF). **Before you commit to this module list in Trello, open your actual PDF and confirm exact wording and point values against Section A below — I've flagged every place where you need to verify rather than assume.**

---

## A. Module / Evaluation Mapping

Based on your described feature set (OAuth login, JWT, microservices, React+Vite, chat with persistence, real-time remote multiplayer Pac-Man, stats/leaderboard, responsive/accessible UI, Privacy Policy/ToS), here is your **inferred module selection**. Confirm each against your PDF.

| # | Module (as commonly worded) | Type | Pts | Your feature | Dependency | Verify |
|---|---|---|---|---|---|---|
| 1 | Use a framework to build the backend | Major | 2 | Express (per-service) | none | wording of "framework" list in your PDF |
| 2 | Use a front-end framework or toolkit | Minor | 1 | React + Vite | none | some versions count React as Major if combined w/ TS |
| 3 | Use a database for the backend | Minor | 1 | PostgreSQL | none | some versions require this alongside framework module |
| 4 | Designing the backend as microservices | Major | 2 | api-gateway/auth/chat/game services | needs framework backend | check if this requires a specific min. service count |
| 5 | Standard user management, authentication, users across tournaments | Major | 2 | Registration/login, profile, friends, match history | DB module | "tournament" language may require a tournament feature you haven't scoped yet — **flag: your brief never mentions tournaments explicitly, only matches/leaderboard. Confirm whether this module requires tournament brackets specifically.** |
| 6 | Implementing remote authentication | Major | 2 | OAuth (Google/GitHub/42) | user mgmt module | must store/link provider identity, handle callback securely |
| 7 | Implement 2FA and JWT | Major | 2 | JWT issuance (2FA not yet mentioned in your brief) | user mgmt + remote auth | **flag: you have JWT but no 2FA in the brief. This module typically requires BOTH. Decide now whether to add TOTP-based 2FA or drop this module and rely on JWT-only auth (which doesn't earn this specific module point on its own in most subject versions).** |
| 8 | Remote players (players on separate computers) | Major | 2 | Server-authoritative networked Pac-Man | functional core game | this is close to mandatory-feel but is graded as a module — don't treat as automatically satisfied |
| 9 | Live chat | Major | 2 | Socket.IO chat, DMs, persistence | user mgmt (block/friend) | direct messages, block-user, and game-invite-from-chat are typically required sub-features — **verify exact sub-requirements** |
| 10 | User and game stats dashboards | Minor | 1 | Match history, W/L, leaderboard | functional game | dashboards must show *per-user* stats, not just a global leaderboard |
| 11 | Support on all devices | Minor | 1 | Responsive CSS | frontend | test on real mobile viewport, not just resize |
| 12 | Expanding browser compatibility | Minor | 1 | Test on 2 browsers min. | frontend | confirm which second browser your campus accepts (commonly Firefox) |
| 13 | Multiple language support | Minor | 1 | i18n (min. 3 languages typical) | frontend | not yet in your brief — **flag as unscoped; decide in/out now, it's cheap if planned early (react-i18next) but expensive if bolted on late** |
| 14 | GDPR compliance (anonymization, data mgmt, account deletion) | Minor | 1 | Not yet in your brief | user mgmt | **flag: cheap to add now (delete-account endpoint, data export), expensive to retrofit** |

**Points if all 14 above are fully validated:** 7 Major × 2 = 14, + 7 Minor × 1 = 7 → **21 points** against a 14-point minimum. That's a workable buffer, but **Rule 10 applies: this is too many modules for 4 developers (effectively 3 for the first 2 sprints) in 8 weeks alongside a from-scratch real-time multiplayer game.** See Section J for the recommended trimmed target list.

**Modules explicitly NOT selected / not evident from your brief** (do not assume you get these): AI opponent, tournaments/brackets, server-side pong (n/a, you're doing Pac-Man), WAF/ModSecurity+Vault, monitoring (Prometheus/Grafana), server-side rendering, cross-language backend (e.g. a second language microservice), advanced 3D graphics. If you want any of these, they need to be added deliberately, not assumed.

---

## B. Target Architecture

```text
                         ┌───────────────────────────┐
                         │        Browser (HTTPS)     │
                         │  React + Vite SPA, Canvas   │
                         └──────────────┬─────────────┘
                                        │ HTTPS (443) + WSS
                         ┌──────────────▼─────────────┐
                         │        NGINX (TLS term.)    │
                         └──────────────┬─────────────┘
                                        │
                         ┌──────────────▼─────────────┐
                         │       API Gateway (Node)    │
                         │  - routes HTTP → services   │
                         │  - upgrades WS → chat/game   │
                         │  - validates JWT on ingress  │
                         └───┬──────────┬──────────┬───┘
                             │          │          │
                  ┌──────────▼──┐ ┌─────▼─────┐ ┌──▼─────────┐
                  │ auth-service │ │chat-service│ │game-service│
                  │ Express+     │ │ Express +  │ │ Express +  │
                  │ Prisma       │ │ Socket.IO  │ │ game loop  │
                  └──────┬───────┘ └─────┬──────┘ └──────┬─────┘
                         │               │               │
                  ┌──────▼───────────────▼───────────────▼─────┐
                  │        PostgreSQL (one container,           │
                  │   logically isolated: auth_db / chat_db /   │
                  │            game_db schemas or DBs)           │
                  └──────────────────────────────────────────────┘
```

**HTTP:** Browser → NGINX (TLS) → API Gateway → REST calls to the relevant service. Gateway is the *only* thing the browser ever talks to; internal services are on a private Docker network with no published ports.

**WebSocket:** Browser opens one WS connection per concern (chat, game) through the gateway, which proxies the upgrade to chat-service / game-service. Authenticate the WS handshake with the same JWT (as a query param or `Authorization` header at upgrade time) — do not allow anonymous socket connections.

**Service-to-service:** Prefer explicit REST/internal HTTP calls or a lightweight event bus (Socket.IO server-to-server emit, or Redis pub/sub if you add Redis later) over one service reaching into another's DB. E.g., game-service asks auth-service to validate a JWT rather than sharing the JWT secret everywhere (or, simpler for 8 weeks: share a single JWT secret via Docker secret/env var and let each service verify independently — cheaper, still secure if the secret is only ever in server-side env vars).

**Database ownership:** auth-service owns `users`, `oauth_identities`, `sessions`/refresh tokens. chat-service owns `messages`, `channels`, `blocks`. game-service owns `matches`, `match_players`, `match_events`/stats. Cross-service reads (e.g., chat showing a username) go through a service call or a denormalized `username` cache field updated via event, **not** a direct cross-schema SQL join. This is the single biggest discipline risk in a "one Postgres container" setup — enforce it with code review, not just intention.

**Docker networks:** one internal bridge network (`transcendence_net`) for all services + DB, no ports published except NGINX's 443 (and 80→443 redirect). Each service gets a fixed hostname (`auth-service`, `chat-service`, etc.) so gateway routing is DNS-based, not IP-based.

**Ports (internal, not published):** gateway `3000`, auth `3001`, chat `3002`, game `3003`, postgres `5432`. Only NGINX publishes `443`.

**Authentication flow:** register/login → auth-service hashes (bcrypt/argon2) → issues short-lived JWT access token + refresh mechanism → frontend stores access token in memory (not localStorage, to reduce XSS blast radius) → every gateway request requires `Authorization: Bearer` → OAuth flow: frontend redirects to provider → provider redirects to a backend callback (never a frontend route, to keep the client secret server-side) → auth-service exchanges code, creates/links user, issues your own JWT.

**Game-state flow:** client sends only *inputs* (direction key pressed) over WS → game-service runs the authoritative tick (~30 FPS) → recomputes Pac-Man/ghost positions, collisions, score → broadcasts the new state to both/all clients in that match → client renders whatever the server says, with optional local prediction purely for smoothness (never as the source of truth).

**Chat flow:** client sends message over WS to chat-service (via gateway) → chat-service validates sender against JWT, checks block list, persists to `chat_db`, broadcasts to channel/recipient socket(s).

### Architectural risks & mitigations
- **Single Postgres container is a single point of failure and a data-ownership temptation.** Mitigate: enforce per-service schemas from day 1, forbid cross-schema queries in code review, document ownership in the README before Sprint 2 ends.
- **Shared JWT secret across services is a small blast radius if leaked.** Mitigate: Docker secret/`.env`, never in Git, rotate before evaluation, document in README's AI/security section.
- **WebSocket auth is easy to forget until late.** Mitigate: build the authenticated-socket pattern in Sprint 3 (first WS feature), not per-feature later.
- **Microservices overhead for a 4-person, largely-beginner team in 8 weeks is real.** Mitigate: keep the service boundary count to exactly these four (gateway, auth, chat, game) — do not add more services later even if it seems "cleaner."

---

## C. 8-Week Roadmap

| Wk | Sprint Goal | Key objectives | Module impact | Top risk |
|---|---|---|---|---|
| 1 | Skeleton up, registration works end-to-end | Docker Compose all 4 services boot; NGINX+TLS stub; Postgres + Prisma schema for `users`; registration API + form (no auth yet, plaintext-to-hash only) | Foundation for #1,#3,#4 | Docker networking eats the week |
| 2 | Login + JWT + gateway routing solid | Login endpoint, JWT issue/verify, protected route middleware in gateway, basic profile page, CI-lite (lint on PR) | Progress on #5 | Auth bugs block everyone downstream |
| 3 | Real-time infra + first playable local game | Socket.IO wired end-to-end (auth'd sockets), Canvas Pac-Man renders and moves client-side against a stub server tick, WS reconnect logic sketched | Sets up #8, #9 | WS auth pattern not generalized in time |
| 4 | Authoritative multiplayer core loop | Game-service owns tick/state/collisions for 2 remote players; match creation/join; basic maze; ghosts move (scripted, not smart yet) | #8 real progress | Server-authoritative refactor takes longer than planned |
| 5 | OAuth + chat MVP + Zineb ramps in | Remote auth (1 provider) wired; chat-service basic messaging + persistence; Zineb onboarded onto a bounded, non-blocking feature (e.g., friends list UI, or stats page skeleton) | #6, #9 start | Zineb ramp-up conflicts if her area isn't isolated |
| 6 | Social + stats + leaderboard | Friends, online status, block-in-chat, match history, leaderboard, DM in chat | #10 | Cross-service username lookups tempt shortcuts |
| 7 | Hardening pass 1 + module completeness push | Responsive pass, browser compat pass, GDPR endpoints if in scope, i18n if in scope, input validation audit, rate limiting | #11–14 as scoped | Scope creep — cut, don't add, this week |
| 8 | Feature freeze, integration, evaluation prep | See Section K in full | Final validation of every claimed module | Discovering a broken module 2 days before defense |

Zineb returns for Week 5 with a self-contained slice (frontend feature or stats/leaderboard UI) that doesn't block the game/auth critical path — this satisfies Rule 4 and your explicit "no unrealistic dependency on her" instruction.

---

## D. Sprint 1 Plan

### Card 1 — Core System Architecture Pipeline (Malika)
**User story:** As the team, we need all four services to boot together on Docker Compose with TLS termination, so every subsequent feature has infrastructure to land on.

**Acceptance criteria**
- `docker compose up` brings up nginx, gateway, auth-service, chat-service, game-service, postgres with zero manual steps
- NGINX serves the frontend over HTTPS (self-signed cert acceptable for now) and proxies `/api/*` to gateway
- Gateway responds to a health-check route from each service (`/health` per service, aggregated)
- Services are on a private network; only NGINX exposes a host port
- `.env.example` committed; real secrets never committed

**Technical subtasks:** write base `docker-compose.yml`; scaffold `Dockerfile` per service (multi-stage, node:alpine); write NGINX conf + self-signed cert generation script; scaffold Express skeleton per service with `/health`; scaffold API Gateway with a simple proxy layer (http-proxy-middleware or manual); wire container-to-container DNS names; document architecture in README stub.

**Dependencies:** none — this is the critical-path root.
**Definition of Done:** meets acceptance criteria above + reviewed PR + README section "Running locally" works for a teammate who has never run it.
**Branch:** `feat/malika-docker-pipeline`
**Commits:** `feat(infra): add base docker-compose skeleton`, `feat(infra): add nginx tls termination`, `feat(gateway): add health-check aggregation route`
**Testing:** manual `docker compose up` from clean clone by a second team member; curl each `/health`.
**PR requirements:** at least one other dev runs it locally before merge, not just reads the diff.

### Card 2 — User Registration & Table Setup (Hanane + Nouss)
**User story:** As a new user, I can register an account with email/username/password so I have an identity on the platform.

**Acceptance criteria**
- Prisma schema for `users` (id, email, username, password_hash, created_at, avatar_url nullable) migrated into `auth_db`
- `POST /api/auth/register` validates input (email format, password strength, username uniqueness) server-side, hashes password (bcrypt/argon2), returns 201 + sanitized user object (no hash)
- React registration form validates client-side too, shows field-level errors, calls the endpoint through the gateway
- No plaintext password ever logged or stored

**Technical subtasks (Hanane):** Prisma schema + migration; DB constraints (unique email/username); seed script for local dev; password hashing utility; input validation middleware (e.g., zod) shared pattern for future endpoints.
**Technical subtasks (Nouss):** Express `POST /register` controller wired to Prisma; error responses (409 duplicate, 400 invalid); React `RegisterForm` component + client validation; wiring through gateway once Malika's proxy is ready (coordinate, don't block — build against localhost:3001 directly if gateway isn't ready yet, then switch the base URL).

**Dependencies:** Postgres running (Card 1) for real DB testing, but schema/controller work can start against a local Postgres before the full pipeline is done.
**Definition of Done:** registration works via curl AND via the UI; duplicate email/username rejected with clear error; password never appears in logs or responses; PR reviewed.
**Branch:** `feat/hanane-auth-schema`, `feat/nouss-registration-api`
**Commits:** `feat(auth): add prisma user schema and migration`, `feat(auth): add password hashing utility`, `feat(auth): add register endpoint with validation`, `feat(frontend): add registration form`
**Testing:** unit test for hashing utility; integration test hitting `/register` (happy path + duplicate + invalid input); manual UI test.
**PR requirements:** schema PR reviewed before controller PR merges (avoid rework); no direct `develop` pushes.

**Missing from Sprint 1 that could block later sprints — surface these now:**
1. **JWT secret/strategy not yet decided** — pick it in Sprint 1 planning even though login lands Sprint 2, so the schema (e.g., refresh token table) is right the first time.
2. **Shared validation library convention** (zod/joi) — decide once, reuse everywhere, or every service reinvents it.
3. **Conventional Commits + lint pre-commit hook** not yet set up — do it now while the repo is small.
4. **API contract between gateway and services** (routing table) isn't written down — a one-page doc prevents Malika and Nouss/Hanane from guessing each other's routes.
5. **2FA decision (module #7 above)** — decide in/out this week; it changes the `users` schema (TOTP secret column) if you want it, and that's much cheaper to add now than after Sprint 2.

---

## E. Sprint 2 Plan

**Goal:** Login, JWT, and gateway-enforced auth are solid and fully integration-tested before real-time work begins — and nothing here depends on Zineb.

- **Malika:** finish gateway JWT-verification middleware; route table for all planned endpoints (even stubs); WS upgrade proxying scaffolded (used starting Sprint 3, but the plumbing belongs here so Sprint 3 isn't blocked on infra).
- **Hanane:** refresh-token table + rotation strategy; OAuth provider research/spike (pick one: 42, Google, or GitHub) and register the OAuth app credentials; profile endpoint (`GET /me`).
- **Nouss:** login form + protected-route pattern in React (redirect to login if no valid token); profile page skeleton; error/loading states.

**Explicitly do NOT start in Sprint 2:** chat, game-service authoritative loop, friends, stats. Those need Sprint 2's auth foundation to be *finished and merged*, not "mostly working," before they build on top of it (Rule 4/Rule 6 — but note Rule 6 also means don't wait until Sprint 4 to touch the frontend/backend integration for auth; that integration IS this sprint's deliverable).

**Sprint 2 Definition of Done additions:** login + register + protected route works end-to-end through the gateway with TLS; a teammate who wasn't involved can register, log in, and hit a protected `/me` route from a fresh clone.

---

## F. Product Backlog (abridged — organize into these epics in Trello)

*(Full acceptance-criteria-per-ticket detail should live in Trello; this gives you the prioritized shape and owners so you can transcribe quickly.)*

**EPIC 1 — Infrastructure** (P0): docker-compose skeleton, NGINX+TLS, service skeletons, CI lint — Malika — Sprint 1
**EPIC 2 — Authentication** (P0/P1): register, login, JWT, refresh, OAuth, 2FA-if-scoped — Hanane/Nouss — Sprint 1–2, OAuth Sprint 5
**EPIC 3 — User Management** (P1): profile, avatar upload, account deletion (GDPR) — Hanane — Sprint 2, 7
**EPIC 4 — API Gateway** (P0): routing, WS proxying, JWT middleware — Malika — Sprint 1–2
**EPIC 5 — Real-Time Infrastructure** (P1): authenticated Socket.IO pattern, reconnect handling — Malika/whoever owns game — Sprint 3
**EPIC 6 — Pac-Man Core Engine** (P1): maze model, movement, collisions, scoring (local, single-player correctness first) — Sprint 3
**EPIC 7 — Multiplayer** (P1, module #8): server-authoritative sync for 2+ remote players, match lifecycle, disconnect/reconnect — Sprint 4
**EPIC 8 — Ghost AI** (P2): scripted movement first, "smart" chase/scatter behavior later if time allows — Sprint 4–6
**EPIC 9 — Chat** (P1, module #9): messaging, persistence, DMs, block, game-invite-from-chat — Sprint 5–6
**EPIC 10 — Game Statistics** (P2, module #10): match history, per-user stats — Sprint 6
**EPIC 11 — Leaderboard** (P2): global ranking view — Sprint 6
**EPIC 12 — Friends/Social** (P1, part of module #5): add/remove friend, online status — Sprint 5–6
**EPIC 13 — Security** (P0 ongoing): input validation everywhere, rate limiting, secrets hygiene, HTTPS enforcement, CORS — every sprint, hardened Sprint 7
**EPIC 14 — Accessibility/UI** (P2, modules #11–13): responsive pass, browser compat, a11y pass — Sprint 7
**EPIC 15 — DevOps/Observability** (P3): structured logs, health checks (basic; skip full monitoring stack unless you add that module deliberately) — ongoing, light
**EPIC 16 — Testing** (P1 ongoing): unit + integration tests per service, don't defer to Week 8
**EPIC 17 — Documentation** (P1): README built incrementally per epic, not at the end
**EPIC 18 — Evaluation Preparation** (P0 in Week 8): module validation checklist, demo script, defense rehearsal

---

## G. Dependency Graph (your actual chain, not the generic example)

```text
Docker Compose + service skeletons (Malika, Wk1)
        │
        ▼
Postgres + Prisma schema (Hanane, Wk1)
        │
        ▼
Registration → Login → JWT (Hanane+Nouss, Wk1–2)
        │
        ├──────────────► Gateway JWT middleware / routing (Malika, Wk2)
        │                         │
        │                         ▼
        │                Authenticated WebSocket pattern (Wk3)
        │                         │
        │              ┌──────────┴──────────┐
        │              ▼                     ▼
        │        Chat MVP (Wk5)        Game engine, local (Wk3)
        │              │                     │
        │              ▼                     ▼
        │      DMs/Block/Invite       Authoritative multiplayer (Wk4)
        │              │                     │
        ▼              ▼                     ▼
   Profile/Friends  Chat persistence    Match lifecycle → Stats (Wk6) → Leaderboard (Wk6)
        │
        ▼
  OAuth remote auth (Wk5, parallel — only needs base auth, not chat/game)
        │
        ▼
  GDPR / i18n / a11y / browser-compat (Wk7, parallel, no downstream dependents)
```

Two independent branches exist after JWT auth lands: **the game branch** and **the chat branch**. They don't block each other — this is your best opportunity for parallel work once Malika/Hanane/Nouss split up in Sprint 3–4, and it's a good landing spot for Zineb in Week 5 on whichever branch has the more isolated remaining surface area (likely social/stats UI).

---

## H. Project-Wide Definition of Done

A task is **Done** only when ALL of the following are true:
1. Implementation matches the acceptance criteria written on the card — not just "runs on my machine."
2. Automated test exists (unit for logic, integration for endpoints/sockets) and passes in a clean container, not just locally.
3. Errors are handled explicitly — no unhandled promise rejections, no silent failures; user-facing errors are readable, not stack traces.
4. Input is validated server-side regardless of client-side validation.
5. Security checklist applied where relevant: no secrets in code, parameterized queries (Prisma gives this by default — don't bypass with raw SQL string concat), auth-required routes actually enforce it, CORS restricted to your frontend origin, rate limiting on auth endpoints.
6. Documentation updated: README section for the feature, any new env vars documented in `.env.example`.
7. Code reviewed and approved by at least one teammate via PR — no self-merges to `develop`.
8. Git hygiene followed: feature branch, Conventional Commits, no direct pushes to `main`/`develop`.
9. Verified inside Docker Compose, not just on a bare host — "works outside Docker" doesn't count.
10. Verified in-browser with dev tools open — zero console errors/warnings introduced.
11. If the task contributes to a claimed module, it's checked against that module's specific evaluator-demonstrable behavior (Section J), not just "the feature exists."

---

## I. Risk Register

| Risk | Prob. | Impact | Mitigation | Contingency |
|---|---|---|---|---|
| 8-week deadline vs. scope | High | High | Trim module list now (Section J); vertical slices; weekly scope review | Cut modules #10/#13/#14 first — they're additive, not foundational |
| Team is largely new to web dev | High | High | Pair Hanane/Nouss on auth; Malika documents infra patterns for reuse; no one works in total isolation on unfamiliar tech | Bring in AI-assisted review (per your own AI-usage rules) for unfamiliar patterns, but every owner must be able to explain their code at defense |
| Microservices complexity | Med | High | Exactly 4 services, no more; shared validation/auth patterns documented once | If Sprint 3 shows the split is too slow, consider merging chat into game-service temporarily — don't merge auth (security boundary) |
| Real-time networking/sync bugs | High | High | Build local single-player-correct game first (Wk3) before adding network layer (Wk4); test with 2 real browser tabs from day 1 of multiplayer work | Fall back to lock-step simpler sync (no client prediction) if interpolation causes desync near defense |
| WebSocket auth/reconnect edge cases | Med | Med | Build the authenticated-socket + reconnect pattern once, generically, in Wk3 | Accept "reconnect drops you to lobby" as MVP behavior if full state-resume isn't ready |
| Docker networking issues | Med | Med | Malika owns this exclusively Wk1, gets it working before others build on top | Timebox to 3 days; escalate/pair if stuck day 2 |
| Database-per-service discipline erodes under time pressure | Med | Med | Code review explicitly checks for cross-schema queries | Document any exception in README with rationale — never silently |
| Auth/security shortcuts under deadline pressure | Med | High | Security items are part of Definition of Done, not a Week 7 add-on | Week 7 has an explicit security-hardening pass as a checklist, not vague "improve security" |
| Scope creep (adding modules mid-project) | High | High | Module list frozen after Sprint 2 planning; new ideas go to a "Backlog — not this cycle" list | PO (Hanane) has explicit authority to say no to new scope after Week 2 |
| Zineb's temporary absence | Low (planned for) | Med if mishandled | Sprint 1–2 has zero tasks assigned to her; Wk5 re-entry point is a bounded, non-blocking slice | If she's out longer, the Wk5 slice becomes optional/cut, not redistributed in a panic |
| Integration conflicts between services | Med | High | Integrate early (chat/game skeletons touch the gateway in Wk3, not Wk7) | Daily 10-min sync during integration-heavy weeks (3–4, 7–8) |
| Claimed module fails validation at defense | Med | High | Section J checklist run explicitly in Week 8, not assumed | Have a prioritized "cut list" — pull a shaky module from your README claim rather than let the evaluator discover it |
| Testing left until the end | High | High | Testing is part of Definition of Done every sprint | Week 7 includes a dedicated regression pass, not first-time testing |

---

## J. Evaluation Strategy — Recommended Target Module List

Given the risk profile above, **I recommend trimming your target from the 14 candidate modules to a safer 9–10**, still well clear of the 14-point minimum, while protecting your actual playable, defensible product:

**Commit to (core, ~16–18 pts):**
1. Framework backend (Major, 2) — comes free with your architecture
2. Front-end framework/toolkit (Minor, 1) — comes free with React
3. Database backend (Minor, 1) — comes free with Postgres
4. Microservices (Major, 2) — comes free with your architecture
5. Standard user management (Major, 2) — core to the product
6. Remote players / functional networked game (Major, 2) — core to the product
7. Live chat (Major, 2) — explicitly in your brief
8. Remote authentication / OAuth (Major, 2) — explicitly in your brief
9. Stats dashboards (Minor, 1) — explicitly in your brief

**Defer to "if time allows" (do not claim in README until validated in Week 7):**
- 2FA+JWT as its own module (needs actual 2FA, not just JWT) — decide by end of Sprint 1
- GDPR compliance — cheap if added in Sprint 2 schema, otherwise drop
- Multiple language support — decide by Sprint 2, expensive to bolt on late
- Browser compatibility / device support / accessibility — these are genuinely achievable in Week 7's hardening pass; keep them in scope

For every module you DO claim, the checklist is:

```text
What we implement → How we test it → How we demonstrate it → What fails it
```

- **Standard user management:** implement register/login/profile/friends → integration tests + manual → live demo: register a new account, add a friend, show online status → fails if any CRUD path errors or duplicate accounts aren't prevented.
- **Remote players:** implement server-authoritative match between 2 browsers → automated 2-client test + manual on 2 machines/tabs → live demo: two evaluators (or evaluator + teammate) play a match live → fails if state desyncs, or if the client (not server) is shown to control the outcome (e.g., via devtools tampering with a client-side score).
- **Live chat:** implement DM + persistence + block → integration test + manual → live demo: send a message, block a user, show it persists after refresh → fails if messages aren't persisted or block isn't enforced server-side.
- **Remote auth:** implement one OAuth provider fully → manual OAuth flow test with a real account → live demo: log in via the provider → fails if the flow errors, or if account-linking silently creates duplicate users.
- **Microservices:** demonstrate service boundaries → show `docker compose ps` with 4 running services + explain data ownership → fails if the evaluator finds one monolith pretending to be four containers (e.g., all services importing each other's Prisma clients directly).

---

## K. Final 2-Week Hardening Strategy (your Weeks 7–8)

**Week 7 — feature freeze + hardening**
1. **Feature freeze at start of Week 7** — no new features, only finishing in-flight work from Week 6.
2. Integration pass: every epic's happy path tested end-to-end together, not in isolation.
3. Bug triage: fix blockers and module-invalidating bugs first; cosmetic issues last.
4. Security pass: re-check the Definition of Done security checklist across every endpoint, not just new ones.
5. Multiplayer stress test: multiple simultaneous matches, deliberate disconnects, slow network simulation.
6. Browser compatibility pass on your two target browsers.
7. Docker clean-deploy test: `docker compose down -v && docker compose up` from a fresh clone on a machine that's never run it.
8. Database validation: migrations run clean on an empty DB; seed/demo data script ready for evaluation.

**Week 8 — validation + defense prep**
9. Module-by-module validation using the Section J checklist — literally check each one off with evidence (screenshot/test log).
10. README finalized: architecture, module list + justification, schema, individual contributions, challenges/solutions, AI usage section.
11. Peer evaluation simulation: have someone outside the team (or a teammate playing "hostile evaluator") try to break each claimed module.
12. Demo script written and rehearsed by every team member, not just Hanane — Rule 8 (whole team understands the whole system).
13. Backup/rollback plan: tagged release commit, a known-good Docker image/tag, and a documented rollback command in case a last-minute change breaks the demo.

---

## Final Outputs

### 1. Critical Path
Docker Compose skeleton → Postgres/Prisma schema → registration → login/JWT → gateway auth middleware → authenticated WebSocket pattern → local single-player-correct game loop → server-authoritative multiplayer. Everything else (chat, friends, stats, hardening modules) branches off *after* the WebSocket pattern lands in Week 3 and does not block the game branch.

### 2. MVP (must exist before any optional/bonus work)
Register/login/JWT, one working 2-player remote match with authoritative server state and correct win/loss, basic chat (send/receive/persist), basic profile + friends, one page of match history. Everything in Section J's "core" list, nothing from "if time allows."

### 3. Module Completion Order (safest sequence)
Framework backend + DB + microservices (structural, arrive for free with your architecture) → Standard user management → Remote auth (OAuth) → Remote players (core game) → Live chat → Stats dashboards → (if time) 2FA, GDPR, i18n, accessibility/browser/device modules in Week 7.

### 4. Updated Backlog
Use Section F's epic breakdown directly as your Trello lists-within-lists; Section D's two cards are ready to paste into Sprint 1 today; Section E's three work items are ready for Sprint 2 planning at the end of this week.

### 5. Immediate Next Actions

**Today — Malika:** start the Docker Compose skeleton and NGINX+TLS stub (Card 1). This is the critical-path root; nothing else can be fully tested until containers boot.

**Today — Hanane:** write the Prisma `users` schema and get a local Postgres instance running standalone (don't wait on Malika's full pipeline to start schema work); open the OAuth-provider decision as a same-day team decision (pick 42, Google, or GitHub) so Card setup in Sprint 2 isn't blocked; make the 2FA/GDPR/i18n in-or-out calls this week per Section A's flags, since they're cheap now and expensive later.

**Today — Nouss:** scaffold the React registration form against a mocked/local endpoint while Hanane finishes the schema, then wire to the real endpoint once it's up — don't sit idle waiting.

**Explicitly wait on:** chat-service, game-service authoritative loop, friends, stats, leaderboard, and any of the deferred modules (2FA specifics, GDPR, i18n, accessibility pass) — none of these should be touched before Sprint 3 at the earliest, per the dependency graph in Section G.

**This week, as a team (not "today," but before Sprint 1 ends):** finalize the trimmed module list (Section J) as an explicit decision in your README draft, not left implicit — this is the single highest-leverage planning action left, since it resolves the biggest ambiguity flagged in Section A.
