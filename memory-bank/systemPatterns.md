# System Patterns

## Architecture
Monorepo with three independent packages (backend, frontend, mobile) — no shared code or workspace linking. Each has its own `package.json` and `node_modules`.

## Backend Patterns

### Module Structure (NestJS)
Each domain is a NestJS module with service + controller/gateway:
- `BotModule` → Telegram bot commands
- `BotUsersModule` → User entity, UserService (core logic, largest file), UserController (REST), UsersWebSocketGateway
- `BotChatModule` → ChatActionsService, MessageService, RoomService
- `RoomsModule` → RoomsGateway (WebSocket)
- `ProfileMatchModule` → matching algorithm
- `FileStoreModule` → S3 integration

### Database
- TypeORM entities in `src/bot-users/schemas/` and `src/rooms/schemas/`
- Migrations in `src/migrations/`, auto-run on startup
- User entity is central, referenced by Like, Match, Connection, ChatRequest, UserBlock, etc.

### Dual WebSocket Gateways
- `UsersWebSocketGateway` — user-level events (likes, matches, online status)
- `RoomsGateway` — room-level events (chat messages)

### File Storage
- Upload via multer → Sharp processing → AWS S3
- Download via presigned S3 URLs
- Static serving at `/rooms/file-store/`

## Frontend Patterns

### State Management (NgRx)
- Store, effects, entity, router-store in `src/app/shared/store/`
- Feature modules are route-based: feed, likes, profile-match, requests, settings

### Auth Flow
- `window.Telegram.WebApp` provides user identity
- `tgWebAppData` extracted from URL hash fragment
- Cookie fallback via `ngx-cookie-service`

### Services
- `UserService` — REST API calls to backend
- `UserSocketService` — Socket.io connection management
- `FileStoreService` — file upload/download

## Communication Pattern
```
Telegram Bot ←→ Backend (Telegraf)
Frontend     ←→ Backend (REST /api + Socket.io)
Mobile       ←→ Backend (REST /api + Socket.io)
```
