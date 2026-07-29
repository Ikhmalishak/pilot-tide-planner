# TideNav

# Software Architecture Document

**Version:** 1.0  
**Author:** Ikhmal  

**Frontend:** React + TypeScript  
**Backend:** Express.js + TypeScript  
**Database:** PostgreSQL  
**ORM:** Prisma ORM  

---

# 1. Architecture Overview

TideNav follows a modular architecture designed around separation of responsibilities.

The system separates:

- User Interface
- API Layer
- Business Logic
- Data Access
- External Data Processing

The most important component is the **Navigation Engine**.

The Navigation Engine contains all navigation calculation rules and must remain independent from:

- React
- Express
- PostgreSQL
- Excel files

---

# 2. High-Level Architecture

```text
                         User

                          |

                          v

                  React Application

                          |

                    REST API (HTTP)

                          |

                          v

                 Express Backend

                          |

          +---------------+---------------+

          |                               |

          v                               v

    Service Layer                 Validation Layer


          |

          v


                 Navigation Engine


          |

          v


              Repository Layer


          |

          v


               PostgreSQL Database

```

---

# 3. Technology Stack

## Frontend

Technology:

```
React

TypeScript

Vite

TailwindCSS

shadcn/ui

React Router

TanStack Query

React Hook Form

Zod
```

Purpose:

|Technology|Purpose|
|-|-|
|React|UI framework|
|TypeScript|Type safety|
|Vite|Build tool|
|TailwindCSS|Styling|
|TanStack Query|API state management|
|Zod|Frontend validation|

---

# Backend

Technology:

```
Node.js

Express.js

TypeScript

Prisma ORM

PostgreSQL

Multer

SheetJS
```

Purpose:

|Technology|Purpose|
|-|-|
|Express|REST API|
|Prisma|Database access|
|PostgreSQL|Data storage|
|Multer|File upload|
|SheetJS|Excel parsing|

---

# 4. Project Structure

Recommended monorepo structure:

```
tidenav/

│

├── apps/

│   ├── web/

│   │
│   └── api/


│

├── packages/

│   ├── navigation-engine/

│   ├── excel-parser/

│   ├── validation/

│   └── shared-types/


│

├── prisma/

│

├── docs/

│

└── README.md

```

---

# 5. Application Responsibilities

---

# Frontend Application

Location:

```
apps/web
```

Responsible for:

- Displaying dashboard.
- Collecting user input.
- Uploading files.
- Showing validation errors.
- Displaying navigation windows.

The frontend MUST NOT:

- Calculate navigation colors.
- Apply tide rules.
- Calculate thresholds.

---

# Backend Application

Location:

```
apps/api
```

Responsible for:

- REST API.
- Authentication (future).
- Request validation.
- Business workflow.
- Database communication.

The backend MUST NOT contain:

- UI logic.
- React code.
- Calculation rules.

---

# Navigation Engine

Location:

```
packages/navigation-engine
```

This is the core of TideNav.

Responsible for:

- Threshold calculation.
- Tide state processing.
- Color assignment.
- Navigation window generation.

Example:

Input:

```typescript
TideIndicator[]

HourlyTideLevel[]

RuleProfile
```

Output:

```typescript
NavigationWindow[]
```

---

# 6. Navigation Engine Design

The engine is pure TypeScript.

Example:

```typescript
generateNavigationWindow(
    tideIndicators,
    hourlyLevels,
    ruleProfile
)
```

The function:

- Receives data.
- Processes rules.
- Returns result.

It does not:

- Query database.
- Read Excel.
- Call APIs.
- Modify UI.

---

# 7. Data Flow

Complete system flow:

```text

Excel File

     |

     v

Excel Parser

     |

     v

Domain Models

     |

     v

Database

     |

     v

Navigation Engine

     |

     v

Navigation Window

     |

     v

React Dashboard

```

---

# 8. Backend Architecture

Folder structure:

```
apps/api/src/

│

├── controllers/

│

├── routes/

│

├── services/

│

├── repositories/

│

├── validators/

│

├── middleware/

│

├── utils/

│

└── server.ts

```

---

# Controller Layer

Example:

```
navigationController.ts
```

Responsibilities:

- Receive HTTP request.
- Validate request format.
- Call service.
- Return response.

Example:

```typescript
POST /navigation/generate
```

Controller:

```
Request

↓

Service

↓

Response

```

No calculation.

---

# Service Layer

Example:

```
navigationService.ts
```

Responsibilities:

- Coordinate workflow.

Example:

```
Get tide indicators

↓

Get hourly tide levels

↓

Load rule profile

↓

Call Navigation Engine

↓

Save navigation window

```

---

# Repository Layer

Example:

```
tideIndicatorRepository.ts
```

Responsibilities:

Only database operations.

Example:

```typescript
findByDate()

create()

update()

delete()
```

No business logic.

---

# 9. Frontend Architecture

Folder structure:

```
apps/web/src/

│

├── pages/

├── components/

├── layouts/

├── hooks/

├── api/

├── services/

├── types/

├── utils/

└── routes/

```

---

# Page Structure

```
DashboardPage

ImportPage

TideIndicatorPage

HourlyLevelPage

NavigationWindowPage

RuleProfilePage

```

---

# Component Structure

Example:

```
DashboardPage

|

├── DateSelector

├── TideIndicatorPanel

├── NavigationWindowTable

├── StatusLegend

└── GenerateButton

```

---

# 10. State Management

Use two types of state.

---

# Server State

Managed by:

```
TanStack Query
```

Examples:

- Tide Indicators.
- Hourly Tide Levels.
- Navigation Windows.
- Rule Profiles.

---

# Local UI State

Managed by:

```
React State

useState()

useReducer()

```

Examples:

- Modal visibility.
- Selected row.
- Form values.

---

# 11. API Communication

Frontend:

```
React

↓

API Client

↓

Express API

↓

Service

↓

Database

```

Example:

```typescript
navigationApi.generate()
```

---

# 12. Validation Strategy

Validation happens in multiple layers.

---

## Frontend Validation

Purpose:

Improve user experience.

Example:

```
Time field required
```

---

## Backend Validation

Purpose:

Security.

Example:

```
Reject invalid payload
```

---

## Domain Validation

Purpose:

Business correctness.

Example:

```
HIGH tide cannot have invalid values
```

---

# 13. Error Handling

All errors must have consistent format.

Example:

```json
{
    "success": false,
    "message": "Hourly tide level missing",
    "code": "INVALID_TIDE_DATA"
}
```

---

# 14. Logging Strategy

System logs:

- Data import.
- Navigation generation.
- Validation failure.
- System errors.

Example:

```
INFO:
Navigation window generated successfully

ERROR:
Missing hourly tide level
```

---

# 15. Security Considerations

Future authentication:

```
User

↓

Role

↓

Permission

↓

Action
```

Possible roles:

```
ADMIN

SUPERVISOR

OPERATOR
```

---

# 16. Testing Strategy

---

# Navigation Engine Tests

Highest priority.

Test:

- High tide calculation.
- Low tide calculation.
- Threshold crossing.
- Color assignment.
- Edge cases.

---

# Backend Tests

Test:

- API responses.
- Validation.
- Database operations.

---

# Frontend Tests

Test:

- Components.
- User interactions.
- Display states.

---

# 17. Deployment Architecture

Example production setup:

```
                  Internet / Internal Network

                            |

                            v


                     Nginx Reverse Proxy

                            |

             +--------------+--------------+

             |                             |

             v                             v

        React Build                  Express API


                                           |

                                           v

                                     PostgreSQL

```

---

# 18. Future Architecture Expansion

Future live tide data:

```
Marine API

↓

API Adapter

↓

Domain Model

↓

Navigation Engine

↓

Navigation Window

↓

Dashboard

```

No changes required in the calculation engine.

---

# 19. Development Rules

## Rule 1

Never put navigation logic inside React.

---

## Rule 2

Never put navigation logic inside Express controllers.

---

## Rule 3

Never let database models directly control business rules.

---

## Rule 4

Navigation Engine must remain framework independent.

---

## Rule 5

Every external input must be converted into domain models.

---

# 20. Final Architecture Principle

TideNav is built around one central idea:

```
Data Sources

↓

Domain Models

↓

Navigation Engine

↓

Navigation Window

↓

User Interface
```

The system should allow new input methods in the future without changing the core navigation calculation logic.
