# TideNav

# Development Plan Document

**Version:** 1.0  
**Author:** Ikhmal  

**Frontend:** React + TypeScript  
**Backend:** Express.js + TypeScript  
**Database:** PostgreSQL  
**ORM:** Prisma ORM  

---

# 1. Development Strategy

TideNav should be developed in phases.

The development order is intentionally designed to reduce complexity.

The most important rule:

```
Build the Navigation Engine first.

Build UI later.
```

The calculation result is the core product.

---

# 2. Development Phases

```
Phase 1

Project Foundation


↓

Phase 2

Database & Backend API


↓

Phase 3

Navigation Engine


↓

Phase 4

Frontend Dashboard


↓

Phase 5

Import System


↓

Phase 6

Testing & Deployment

```

---

# Phase 1: Project Foundation

## Objective

Create the basic development environment.

---

# Tasks

## Create Repository

Structure:

```
tidenav/

├── apps/

│   ├── web

│   └── api


├── packages/

│   └── navigation-engine


├── prisma/

└── docs/

```

---

# Frontend Setup

Technology:

```
React

TypeScript

Vite

TailwindCSS

shadcn/ui
```

Commands:

```bash
npm create vite web --typescript
```

Install:

```bash
npm install

npm install react-router-dom

npm install @tanstack/react-query

```

---

# Backend Setup

Technology:

```
Express

TypeScript

Prisma

PostgreSQL

```

Install:

```bash
npm init

npm install express

npm install prisma

npm install @prisma/client

```

---

# Deliverable

Complete empty project running.

Expected:

Frontend:

```
localhost:5173
```

Backend:

```
localhost:3001
```

---

# Phase 2: Database Development

## Objective

Create database foundation.

---

# Tasks

Create:

```
RuleProfile

TideIndicator

HourlyTideLevel

NavigationWindow

NavigationWindowItem

```

---

# Prisma Migration

Example:

```bash
npx prisma migrate dev

```

---

# Seed Data

Create default profile:

```
Default Profile


Red Difference

2.5


Yellow Difference

1.5


Green Difference

2.5

```

---

# Create Repository Layer

Examples:

```
tideIndicatorRepository.ts

hourlyLevelRepository.ts

navigationRepository.ts

ruleProfileRepository.ts

```

---

# Deliverable

Database can:

- Store tide indicators.
- Store hourly levels.
- Store profiles.

---

# Phase 3: Navigation Engine

## Objective

Build the core calculation system.

---

# Location

```
packages/navigation-engine

```

---

# Folder Structure

```
navigation-engine/


src/

├── models/

├── rules/

├── calculators/

├── processors/

└── index.ts

```

---

# Development Order

## Step 1

Create domain models.

Example:

```typescript
TideIndicator

HourlyTideLevel

RuleProfile

NavigationItem

```

---

## Step 2

Implement threshold calculator.

Example:

```typescript
calculateHighRedThreshold()

calculateLowRedThreshold()

calculateYellowThreshold()

```

---

## Step 3

Implement state machine.

States:

```
WAIT_HIGH_TIDE

HIGH_DESCENDING

WAIT_LOW_TIDE

LOW_RISING

```

---

## Step 4

Implement color assignment.

Output:

```typescript
{
hour:"01:00",

red:true,

yellow:false,

green:false
}

```

---

# Testing

The Navigation Engine must have unit tests.

Example:

Input:

```
HIGH

7.22 ft

Difference

2.5

```

Expected:

```
RED threshold

4.72 ft

```

---

# Deliverable

A pure function:

```typescript
generateNavigationWindow()

```

works without:

- Database.
- Express.
- React.

---

# Phase 4: Backend API Development

## Objective

Connect database and engine.

---

# Create API Modules

```
/tide-indicators

/hourly-levels

/navigation

/rule-profiles

/dashboard

```

---

# Implement CRUD

## Tide Indicators

Create:

```
POST /api/tide-indicators

```

Read:

```
GET /api/tide-indicators

```

Update:

```
PUT /api/tide-indicators/:id

```

Delete:

```
DELETE /api/tide-indicators/:id

```

---

# Implement Navigation Generation

Flow:

```
Request

↓

Controller

↓

Service

↓

Repository

↓

Navigation Engine

↓

Save Result

↓

Response

```

---

# Deliverable

API can generate:

```
Navigation Window

```

from database data.

---

# Phase 5: Frontend Development

## Objective

Create operational dashboard.

---

# Development Order

## Step 1

Application Layout

Create:

```
Sidebar

Header

Routing

```

---

## Step 2

Dashboard Page

Components:

```
DashboardPage

├── DateSelector

├── TideIndicatorPanel

├── NavigationWindowTable

└── GenerateButton

```

---

## Step 3

CRUD Pages

Create:

```
TideIndicatorPage

HourlyLevelPage

RuleProfilePage

NavigationHistoryPage

```

---

# Deliverable

Operator can:

- View tide indicators.
- View hourly levels.
- Generate navigation window.
- View results.

---

# Phase 6: Import System

## Objective

Support Excel input.

---

# Excel Processing Flow

```
Excel File

↓

Upload API

↓

Excel Parser

↓

Validation

↓

Database Insert

```

---

# Libraries

Backend:

```
SheetJS

xlsx

```

---

# Import Types

Support:

## Tide Indicator Excel

Example:

```
Date

Time

Type

Level

```

---

## Hourly Tide Excel

Example:

```
Time

Level

```

---

# Deliverable

Users can import marine company files.

---

# Phase 7: Testing

---

# Unit Testing

Priority:

Navigation Engine

Test:

- High tide.
- Low tide.
- Threshold calculation.
- Color overlap.
- Missing data.

---

# API Testing

Test:

- CRUD operations.
- Validation.
- Generation workflow.

Tools:

```
Postman

Supertest

```

---

# Frontend Testing

Test:

- Components.
- Forms.
- Dashboard rendering.

---

# Phase 8: Deployment

---

# Production Architecture

```
                     User

                      |

                      v

                    Nginx

                      |

        +-------------+-------------+

        |                           |

        v                           v

 React Application            Express API


                                      |

                                      v

                                PostgreSQL

```

---

# Backend Deployment

Options:

```
Docker

PM2

Linux Service

```

---

# Frontend Deployment

Options:

```
Nginx

Vercel

Static Hosting

```

---

# Database Backup

Strategy:

Daily backup:

```
PostgreSQL dump

```

Example:

```
backup/

2026-07-01.sql

2026-07-02.sql

```

---

# 3-Month Development Timeline

## Month 1

Complete:

```
Project setup

Database

Backend CRUD

Navigation Engine

```

---

## Month 2

Complete:

```
React Dashboard

API integration

Excel import

Testing

```

---

## Month 3

Complete:

```
Deployment

Security

User management

Optimization

```

---

# AI Development Workflow

When using AI coding assistants:

Follow this order.

---

## Step 1

Feed:

```
01-PRD.md

02-ARCHITECTURE.md

03-DATABASE.md

```

Ask AI:

Create project structure.

---

## Step 2

Feed:

```
04-BUSINESS_RULES.md

```

Ask AI:

Implement Navigation Engine only.

---

## Step 3

Test engine.

Do not continue until results match manual calculations.

---

## Step 4

Feed:

```
05-API_SPECIFICATION.md

```

Ask AI:

Create Express API.

---

## Step 5

Feed:

```
06-FRONTEND_UI.md

```

Ask AI:

Create React dashboard.

---

# Development Rules

## Rule 1

Never build UI before engine works.

---

## Rule 2

Never mix calculation and database.

---

## Rule 3

Never trust imported data without validation.

---

## Rule 4

Every feature must have:

- Database change.
- API change.
- Frontend change.
- Test case.

---

# Final Goal

At completion TideNav should allow:

```
Marine Operator

↓

Input Tide Information

↓

Generate Navigation Window

↓

View Safe Operating Periods

↓

Make Navigation Decisions

```

The system replaces manual tide table interpretation with a consistent automated process.
