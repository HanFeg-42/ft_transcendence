
# ft_transcendence - Multiplayer Pac-Man Web Application

## Overview
`ft_transcendence` is a web application developed as the final Common Core project within the 42 Network curriculum. The application provides a full-featured online multiplayer Pac-Man experience built on a microservices architecture using the PERN stack (PostgreSQL, Express, React via Vite, Node.js).

The system focuses on modular design, secure data isolation, real-time bidirectional communication, and clean service decoupling to ensure maintainability and production-grade engineering compliance.

---

## Core System Services

* **Authentication Service:** Manages user registration, secure session authentication, JWT issuance, and password hashing.
* **User Profile Service:** Handles player profiles, statistical data, avatars, and match history records.
* **Real-time Chat Service:** Facilitates direct messaging, channel creation, blocking mechanisms, and real-time social interactions via WebSockets.
* **Game Service & Engine:** Executes real-time multiplayer Pac-Man game loops, state synchronization, input processing, and match outcomes.
* **Global Leaderboard Service:** Aggregates player match metrics to compute live dynamic ranks and global ratings.

---

## Repository Structure

```text
ft_transcendence/
├── README.md
├── frontend/
├── api-gateway/
├── auth/
├── chat/
├── game/
└── postgres-db/

```

---

## Git Workflow & Compliance Policy

To ensure repository integrity and maintain strict peer-evaluation standards, all team members must adhere to the following Git discipline.

### Branch Protection & Rules

* Direct pushes to `main` and `dev` are strictly prohibited.
* The `main` branch contains production-ready code only.
* The `dev` branch serves as the central integration target.
* All development work must take place on isolated feature, fix, or test branches targeting `dev`.
* Merges into `dev` require a Pull Request (PR) and at least one peer code review.

GitHub Quickstart Commands
1. Clone the Repository
```Bash
git clone git@github.com:HanFeg-42/ft_transcendence.git
cd ft_transcendence
```
2. Checkout Integration Branch
```Bash
git checkout dev
git pull origin dev
```
3. Create a Feature Branch
```Bash
git checkout -b feat/<name>-<short-description>
```
4. Save & Push Changes
```Bash
git add .
git commit -m "feat: add express registration router"
git push -u origin feat/<name>-<short-description>
```

### Branch Naming Convention

Branches must strictly follow lower-case naming with dash separators using the format `<type>/<author>-<short-description>`:

* **Features:** `feat/<name>-<short-description>`
*Example:* `feat/malika-login-ui`
* **Bug Fixes:** `fix/<name>-<short-description>`
*Example:* `fix/zinb-jwt-expiration`
* **Testing:** `test/<name>-<short-description>`
*Example:* `test/nouss-auth-endpoints`

### Commit Message Standards

Commits must follow Conventional Commits standard specifications to maintain an explicit version history:

* `feat: add express registration router`
* `fix: correct postgres connection string validation`
* `test: verify jwt token generation payload`
