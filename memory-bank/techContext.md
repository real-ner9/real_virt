# Tech Context

## Tech Stack

### Backend
- **Runtime**: Node.js 18 (Docker), TypeScript 5.1
- **Framework**: NestJS 10
- **Database**: PostgreSQL 15.4 via TypeORM 0.3
- **WebSocket**: Socket.io 4.7 (@nestjs/platform-socket.io)
- **Bot**: Telegraf 4.13
- **File storage**: AWS S3 SDK v3 with presigned URLs
- **Image processing**: Sharp 0.32
- **Scheduling**: node-cron
- **i18n**: nestjs-i18n 10.3

### Frontend
- **Framework**: Angular 16
- **State management**: NgRx 16 (store, effects, entity, component-store, router-store)
- **UI**: Angular Material 16, Angular CDK, SCSS
- **Cookies**: ngx-cookie-service
- **Infinite scroll**: ngx-infinite-scroll
- **WebSocket client**: socket.io-client 4.7

### Mobile
- **Framework**: React Native 0.72, React 18.2
- **Navigation**: React Navigation 6 (stack + bottom tabs)
- **HTTP**: Axios
- **Storage**: @react-native-async-storage
- **Media**: react-native-image-picker, react-native-video
- **WebSocket client**: socket.io-client 4.7

## Development Setup
- Backend runs on port 3000 with `/api` prefix
- Frontend dev proxy forwards `/api/*` to `localhost:3000`
- Docker Compose for local dev: PostgreSQL + installer + app containers
- Env file priority: `.env.desk` → `.env.local` → `.env`
- Local DB: user/password/db all `go_to_virt`, port 5432

## Technical Constraints
- Backend TypeScript: relaxed strict mode (`strictNullChecks: false`)
- Node memory limit: 4GB (`--max-old-space-size=4096`) in production Docker
- Migrations auto-run on startup (`migrationsRun: true`)
- Frontend tightly coupled to Telegram WebApp API
