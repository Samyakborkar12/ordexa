# ORDEXA System Architecture

"One Platform. Every Queue. Real-Time."

## Overview

ORDEXA is a multi-tenant, real-time customer-flow and queue-management platform. It provides:
1. **Customer App (Mobile-First):** Mobile web/PWA interface for discovering organizations, exploring services, joining virtual queues, tracking real-time queue position and estimated wait times, and receiving instant call alerts.
2. **Admin Web Console (Desktop-First):** Full-featured SaaS dashboard for organization setup, service and counter configuration, operator management, live queue control (Call Next, Recall, Hold, Skip, Complete), walk-in ticketing, and live queue analytics.
3. **Real-Time Synchronized Data Layer:** Centralized repository engine with `BroadcastChannel` and DOM sync bus for instantaneous multi-tab/window coordination.
4. **Backend Ready:** Architecture structured cleanly for FastAPI, PostgreSQL/Neon, Alembic migrations, and WebSocket queue broadcasting without rewriting frontend logic.

## Directory Structure
```
ORDEXA/
├── frontend/
│   ├── customer-app/     # Mobile-first customer experience
│   └── admin-web/        # Desktop-first SaaS management portal
├── backend/
│   └── ordexa-api/       # FastAPI REST & WebSocket service
├── database/
│   └── seed/             # Schema & migration contracts
└── docs/                 # Architectural specifications
```
