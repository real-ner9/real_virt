# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VIRT is a dating/matching platform with three clients: a NestJS backend, an Angular web frontend (Telegram WebApp), and a React Native mobile app. Users interact through profile browsing, likes/matches, real-time chat, and a Telegram bot.

## Repository Structure

```
backend/    — NestJS 10, TypeORM, PostgreSQL, Socket.io, Telegraf bot
frontend/   — Angular 16, NgRx, Angular Material, Socket.io-client
mobile/     — React Native 0.72, React Navigation, Axios, Socket.io-client
```

## Common Commands

### Backend (`cd backend/`)

```bash
npm run start:dev          # Dev server with watch (port 3000, prefix /api)
npm run build              # Compile (nest build)
npm run start:prod         # Run compiled dist/main
npm run lint               # ESLint with auto-fix
npm run format             # Prettier
npm run test               # Jest unit tests
npm run test:watch         # Jest watch mode
npm run test:e2e           # E2E tests (test/jest-e2e.json config)
```

### Frontend (`cd frontend/`)

```bash
npm start                  # ng serve with proxy to localhost:3000/api
npm run build              # Production build → dist/frontend/
npm run test               # Karma + Jasmine tests
```

### Mobile (`cd mobile/`)

```bash
npm start                  # Metro bundler
npm run android            # Run on Android
npm run ios                # Run on iOS
npm run test               # Jest tests
npm run lint               # ESLint
```

### Docker (from `backend/`)

```bash
make up-local              # Local dev: PostgreSQL + installer + app with volume mounts
make down-local            # Stop & remove local containers
make rebuild               # Production: full rebuild with fresh volumes
make redeploy              # Production: rebuild images & restart
```

## Architecture

### Backend Modules

- **BotModule** — Telegram bot command handling (Telegraf)
- **BotUsersModule** — User CRUD, auth, profiles. `UserService` is the core business logic (~46KB). `UsersWebSocketGateway` handles user-facing socket events
- **BotChatModule** — Chat messaging: `ChatActionsService`, `MessageService`, `RoomService`
- **RoomsModule** — `RoomsGateway` (WebSocket) for real-time chat pub/sub
- **ProfileMatchModule** — Matching algorithm
- **FileStoreModule** — AWS S3 with presigned URLs, Sharp image processing
- **I18nModule** — Language via `x-custom-lang` header, translation files in `src/i18n/`

### Database

- PostgreSQL 15.4 via TypeORM with auto-run migrations (`migrationsRun: true`)
- Migrations in `backend/src/migrations/` (25 files, chronological)
- Key entities: User, Like, Match, Connection, ChatRequest, UserBlock, UserComplaint, InvitationLink
- Local dev creds: user=`go_to_virt`, password=`go_to_virt`, db=`go_to_virt`, port 5432
- Env files loaded in priority: `.env.desk` → `.env.local` → `.env`

### Frontend

- Telegram WebApp integration: extracts auth from `window.Telegram.WebApp` and URL hash `tgWebAppData`
- NgRx store for state management (store definitions in `src/app/shared/store/`)
- Feature modules: feed, likes, profile-match, requests, settings
- Services in `src/app/shared/services/`: `UserService` (API), `UserSocketService` (WebSocket), `FileStoreService`
- Dev proxy: `/api/*` → `http://localhost:3000`

### Real-time Communication

Two WebSocket gateways (Socket.io):
- `UsersWebSocketGateway` — likes, matches, notifications, online status
- `RoomsGateway` — chat messages within rooms

## Code Style

- **Backend**: Single quotes, trailing commas (Prettier). ESLint with `@typescript-eslint`. Relaxed TS (`strictNullChecks: false`, no `noImplicitAny`)
- **Frontend**: Angular conventions, SCSS styling, Angular Material purple-green theme
- **Commits**: Conventional commits, short messages, no AI attribution
- **Language**: Code in English, commit messages and comments historically in Russian
