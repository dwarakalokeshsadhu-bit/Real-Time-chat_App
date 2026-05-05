# Real-Time Chat Application (Slack Clone)

MERN + Socket.IO project based on the PRD.

## Open in VS Code
```bash
cd realtime-chat-app
code .
```

## Setup
```bash
npm run install:all
```

Create environment files:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Start MongoDB and Redis locally, then run:
```bash
npm run dev
```

Client: http://localhost:5173  
Server: http://localhost:5000

## Included features
- JWT register/login/current-user
- Channels CRUD basics
- Channel messages
- Message edit/delete
- Emoji reactions
- Thread replies
- Direct messages
- Socket.IO rooms
- Typing indicator
- Online/offline presence
- Basic React workspace UI

## Not production-ready yet
File upload signed URLs, full Redis adapter scaling, refresh-token rotation, admin panel polish, and full audit logging still need hardening before deployment.
