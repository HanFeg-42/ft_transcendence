# Sprint 1 Summary

## Overview

**Project:** ft_transcendence --- Pacova\
**Sprint:** Sprint 1\
**Duration:** 1 week\
**Team:** Hanane, Malika, Noussaiba, Zineb\
**Status:** Completed

> This document summarizes the work completed during Sprint 1. It is
> intended to help absent team members catch up and to keep a clear
> record of the project's progress and decisions for future reference.

------------------------------------------------------------------------

## Sprint Goal

The main goal of Sprint 1 was to establish the project's technical
foundation and deliver the first working feature: **user registration**.

The sprint focused on two main areas:

-   Setting up the initial microservices and Docker infrastructure.
-   Building and integrating the user registration flow.

------------------------------------------------------------------------

## Work Completed

### 1. Microservices Infrastructure

The initial project architecture was set up using Docker Compose.

The project currently contains the following services:

-   **Frontend** --- React application served through Nginx.
-   **API Gateway** --- Entry point for backend API requests.
-   **Auth Service** --- Handles authentication-related functionality.
-   **Game Service** --- Initial service prepared for game-related
    functionality.
-   **PostgreSQL** --- Database server used by the backend services.

All services communicate through the same Docker network.

------------------------------------------------------------------------

### 2. Database Setup

PostgreSQL was integrated into the Docker environment with persistent
storage.

The architecture currently separates application data into:

-   `auth_db` --- authentication/user data.
-   `game_db` --- game-related data.

Prisma was introduced in the Auth service to manage the user schema and
database migrations.

------------------------------------------------------------------------

### 3. User Registration Backend

The first authentication feature was implemented:

`POST /register`

The registration backend currently:

-   Receives username, email, and password.
-   Validates the required input.
-   Checks basic username, email, and password requirements.
-   Hashes passwords using bcrypt before storage.
-   Creates the user through Prisma.
-   Handles duplicate username/email cases.
-   Returns appropriate HTTP responses.

Passwords are stored as hashes and never as plain text.

------------------------------------------------------------------------

### 4. Registration Frontend

A registration interface was implemented using React, TypeScript, and
Vite.

The form allows the user to provide:

-   Username
-   Email
-   Password

It also displays loading, success, and error states based on the backend
response.

More complete frontend validation can be improved in future sprints.

------------------------------------------------------------------------

### 5. API Gateway Integration

The frontend and Auth service were connected through the API Gateway.

The registration request now follows this flow:

``` text
Browser
   ↓
Frontend / Nginx
   ↓
API Gateway
   ↓
Auth Service
   ↓
Prisma
   ↓
PostgreSQL
```

The frontend sends registration requests to:

``` text
/api/auth/register
```

rather than communicating directly with the Auth service.

This keeps backend services internal to the Docker network.

------------------------------------------------------------------------

### 6. Docker & Makefile Workflow

The project can now be built and managed using the root Makefile.

The main commands are:

``` bash
make
make build
make up
make down
make status
make logs
make clean
make fclean
make re
```

Prisma client generation was integrated into the Auth Docker image
build.

A migration step was also added so committed Prisma migrations can be
applied to the database after the containers start.

------------------------------------------------------------------------

## Integration & Merge Work

The registration implementation and microservices infrastructure were
initially developed on separate feature branches.

During integration, we resolved conflicts involving:

-   Environment configuration.
-   `.gitignore`.
-   Auth dependencies.
-   Frontend dependencies.
-   PostgreSQL initialization.
-   Frontend Docker configuration.
-   Docker Compose configuration.
-   Package lockfiles.

After resolving the Git conflicts, we tested the combined application
and fixed runtime integration problems.

The main issues discovered were:

-   Docker services using different environment variable names.
-   Using `localhost` where a Docker service name was required.
-   The frontend attempting to contact the Auth service directly.
-   Prisma migrations not being applied to a fresh database.
-   Prisma client generation needing to work inside Docker.

These issues were fixed before considering the integrated version
stable.

------------------------------------------------------------------------

## Current Architecture

At the end of Sprint 1, the application follows this general structure:

``` text
                    Browser
                       │
                       ▼
               Frontend / Nginx
                       │
                       ▼
                  API Gateway
                    /     \
                   /       \
                  ▼         ▼
               Auth        Game
                 │           │
                 └─────┬─────┘
                       ▼
                   PostgreSQL
```

------------------------------------------------------------------------

## Git Workflow

The team uses:

``` text
feature branches
       ↓
      dev
       ↓
      main
```

Feature work is developed on dedicated branches and reviewed through
Pull Requests before being integrated.

At the end of the sprint, the reviewed and stable `dev` version was
prepared for integration into `main`.

------------------------------------------------------------------------

## Important Decisions From This Sprint

-   Use a **microservices architecture**.
-   Use **Docker Compose** to manage the development environment.
-   Use **React + TypeScript + Vite** for the frontend.
-   Use **Node.js + Express** for backend services.
-   Use an **API Gateway** as the backend entry point.
-   Use **PostgreSQL** for persistent data.
-   Use **Prisma** for database access and migrations in the Auth
    service.
-   Use **bcrypt** for password hashing.
-   Keep sensitive local configuration in `.env`.
-   Commit `.env.example` with safe example values.
-   Keep services behind the Docker network rather than unnecessarily
    exposing internal ports.
-   Continue using feature branches and PR reviews before merging into
    `dev` or `main`.

------------------------------------------------------------------------

## What Zineb Should Catch Up On

Before starting work in the next sprint, the main things to understand
are:

1.  The role of each service: Frontend, API Gateway, Auth, Game, and
    PostgreSQL.
2.  How the services communicate through Docker.
3.  The registration flow from the frontend to the database.
4.  The purpose of Prisma in the Auth service.
5.  The team's Git workflow and branch strategy.
6.  How to build and run the complete project using the Makefile.

The most important flow from this sprint is:

``` text
User submits registration form
        ↓
Frontend sends the request
        ↓
API Gateway routes it
        ↓
Auth validates the request
        ↓
Password is hashed
        ↓
Prisma creates the user
        ↓
PostgreSQL stores the data
        ↓
Response returns to the frontend
```

------------------------------------------------------------------------

## End-of-Sprint State

Sprint 1 successfully established the project's initial technical
foundation and integrated the first end-to-end feature.

By the end of the sprint:

-   The microservices environment is operational.
-   Docker Compose manages the application services.
-   PostgreSQL persistence is configured.
-   The Auth service is connected to its database through Prisma.
-   User registration is implemented.
-   Password hashing is implemented.
-   The registration frontend is implemented.
-   Frontend requests pass through the API Gateway.
-   The registration flow was integrated with the Docker architecture.
-   The project can be managed through the root Makefile.
-   The sprint changes were reviewed before promotion to the stable
    branch.

------------------------------------------------------------------------

## Next Sprint

Sprint 2 should build on this foundation rather than recreate or bypass
it.

New features should respect the established architecture, Git workflow,
and service boundaries. Any database changes should be handled through
the appropriate schema/migration workflow, and new backend functionality
should remain accessible through the API Gateway.

This document should be updated or followed by a new sprint summary at
the end of each sprint so that the team keeps a clear history of the
project's evolution.
