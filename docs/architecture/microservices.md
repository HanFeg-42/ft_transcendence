# Microservices & Infrastructure

## Subject requirement (why this exists)
The subject offers a Major DevOps module: **"Backend as microservices"**
> Design loosely-coupled services with clear interfaces. Use REST APIs or message queues for communication. Each service should have a single responsibility.

Combined with the general requirement that the app must have a **frontend, backend and database**, deployed with **containerization, running with a single command**. This is the module our team picked.

## What is a microservice, and why use it
A microservice architecture splits one big backend into several small, independent services, each owning **one responsibility** and **its own database**, talking to each other (and to clients) over the network (HTTP/REST here) instead of function calls.

## Project structure
```
docker-compose.yml
├── frontend        (React/Vite → built, served by nginx, HTTPS)
├── gateway         (Express + http-proxy-middleware — single entry point)
├── auth-service    (Node/Express, own Prisma schema → auth_db)
├── user-service    (Node/Express → user_db)
├── chat-service    (Node/Express, WebSocket)
├── game-service    (Node/Express, WebSocket → game_db)
└── postgres        (one Postgres instance, one database per service)
```
Each backend service is its own container, with its own Prisma schema/tables — no service touches another service's tables directly. Services only reach each other through their HTTP/WebSocket APIs.

## The API Gateway — exposing, proxying, routing
**Why:** without a gateway, the frontend would need to know the address of every microservice, and every service would need to be exposed and secured individually. The gateway solves this by being the **single door** into the backend.

**How it works:**
- The frontend only ever talks to one host: the gateway.
- The gateway uses **http-proxy-middleware** to forward requests based on path, e.g.:
  - `/api/auth/*` → auth-service
  - `/api/users/*` → user-service
  - `/ws/chat` → chat-service (WebSocket)
  - `/ws/game` → game-service (WebSocket)
- For normal HTTP requests, this is plain **reverse proxying**: gateway receives the request, rewrites/forwards it to the right container (using Docker's internal DNS), and relays the response back.
- For **WebSockets**, the proxy is set to `ws: true`, and nginx (in front of the gateway) is configured to forward the `Upgrade`/`Connection` headers — required for the HTTP connection to be upgraded to a WebSocket connection.
- Because browsers can't send custom headers during a WebSocket handshake, auth (JWT) is passed as a **query param or httpOnly cookie** instead of a header.

**Benefit:** services stay private on the internal Docker network (never exposed directly), the frontend has one stable API surface, and routing/auth conventions are centralized in one place instead of duplicated per service.