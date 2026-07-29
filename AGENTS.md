# Pilot Tide Planner - Project Overview

## What is Pilot Tide Planner?
A web-based navigation decision support system for marine operators. It automates the process of determining suitable navigation periods based on tide information by applying configurable rules through a Navigation Engine.

## Tech Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui + TanStack Query + React Router + React Hook Form + Zod
- **Backend**: Node.js + Express.js + TypeScript + Prisma ORM
- **Database**: PostgreSQL
- **Libraries**: Multer (file upload), SheetJS/xlsx (Excel parsing)

## Architecture
```
Monorepo structure:
pilot-tide-planner/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Express backend
├── packages/
│   ├── navigation-engine/  # Pure calculation engine (core)
│   ├── excel-parser/       # Excel file parsing
│   ├── validation/         # Validation utilities
│   └── shared-types/       # Shared TypeScript types
├── prisma/           # Database schema & migrations
└── docs/
```

Key architectural rule: **Navigation Engine** is pure TypeScript, independent of React, Express, and PostgreSQL. It is the single source of truth for all navigation calculations.

## Core Concept
- **Tide Indicators**: HIGH/LOW tide events with time and water level
- **Hourly Tide Levels**: Hourly water level readings
- **Navigation Window**: Generated output with hourly status (RED/YELLOW/GREEN)
- **Rule Profiles**: Configurable thresholds (redDifference, yellowDifference, greenDifference, yellow time restrictions)

## Navigation Engine State Machine
```
START → WAIT_HIGH_TIDE → HIGH DETECTED → HIGH_TIDE_DESCENDING → WAIT_LOW_TIDE → LOW DETECTED → LOW_TIDE_RISING → WAIT_HIGH_TIDE (loop)
```
- **RED**: Water level >= (HIGH tide - redDifference) OR >= (LOW tide + redDifference)
- **YELLOW**: Water level >= yellow threshold (disabled between configurable hours, default 07:00-19:00)
- **GREEN**: Water level >= (LOW tide + greenDifference) after low tide recovery

## Database Tables
1. `rule_profiles` - Navigation calculation configurations
2. `tide_indicators` - HIGH/LOW tide events
3. `hourly_tide_levels` - Hourly tide readings
4. `navigation_windows` - Generated daily navigation output
5. `navigation_window_items` - Hourly navigation status items

## API Endpoints
- `GET/POST/PUT/DELETE /api/tide-indicators` - CRUD tide indicators
- `POST /api/tide-indicators/import` - Import via Excel
- `GET/POST/PUT/DELETE /api/hourly-levels` - CRUD hourly levels
- `POST /api/hourly-levels/import` - Import via Excel
- `GET/PUT /api/rule-profiles` - Manage rule profiles
- `POST /api/navigation/generate` - Generate navigation window
- `GET /api/navigation/today` - Get today's window
- `GET /api/navigation/date/:date` - Get by date
- `GET /api/navigation/history` - History with pagination
- `GET /api/dashboard?date=` - Aggregated dashboard data

## Frontend Pages
- `/dashboard` - Main operational dashboard (DateSelector, TideIndicatorPanel, NavigationWindowTable, GenerateButton)
- `/tide-indicators` - CRUD management for tide indicators
- `/hourly-levels` - CRUD management for hourly tide levels
- `/navigation-windows` - Historical navigation window view
- `/rule-profiles` - Rule profile configuration

## Development Phases (in order)
1. Project Foundation - Setup monorepo, frontend, backend
2. Database & Backend API - Prisma schema, repositories, CRUD APIs
3. Navigation Engine - Domain models, threshold calculators, state machine, color assignment
4. Frontend Dashboard - Layout, dashboard page, CRUD pages
5. Import System - Excel upload and parsing
6. Testing & Deployment

## Critical Rules
1. Never put navigation logic inside React
2. Never put navigation logic inside Express controllers
3. Never let database models directly control business rules
4. Navigation Engine must remain framework independent
5. Every external input must be converted into domain models
6. Controllers only handle HTTP; Services handle workflows; Repositories handle database
7. Navigation Engine handles ALL calculations
8. Frontend never calculates navigation status
9. No hardcoded colors in frontend
10. Build Navigation Engine first, UI later
