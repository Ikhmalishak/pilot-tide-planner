# TideNav

# API Specification Document

**Version:** 1.0  
**Author:** Ikhmal  

**Backend:** Express.js + TypeScript  
**Database:** PostgreSQL  
**API Style:** REST API  

---

# 1. API Overview

The TideNav API provides communication between:

```
React Frontend

        |

        v

Express Backend

        |

        v

PostgreSQL Database

```

The API is responsible for:

- Managing tide indicators.
- Managing hourly tide levels.
- Managing rule profiles.
- Generating navigation windows.
- Retrieving dashboard data.

---

# 2. Base URL

Development:

```
http://localhost:3001/api
```

Production:

```
https://domain.com/api
```

---

# 3. Response Format

All APIs use a consistent response structure.

Success:

```json
{
    "success": true,
    "data": {}
}
```

---

Error:

```json
{
    "success": false,
    "message": "Invalid tide data",
    "code": "INVALID_DATA"
}
```

---

# 4. API Modules

```
/tide-indicators

/hourly-levels

/navigation

/rule-profiles

/dashboard

```

---

# 5. Tide Indicator API

## 5.1 Get Tide Indicators

Retrieve tide indicators by date.

```
GET

/api/tide-indicators?date=2026-07-01
```

---

Response:

```json
{
    "success": true,

    "data": [

        {
            "id":
            "uuid",

            "occurredAt":
            "2026-07-01T01:47:00",

            "type":
            "HIGH",

            "waterLevelFt":
            7.22
        },


        {
            "id":
            "uuid",

            "occurredAt":
            "2026-07-01T07:53:00",

            "type":
            "LOW",

            "waterLevelFt":
            3.61
        }

    ]
}
```

---

# 5.2 Create Tide Indicator

```
POST

/api/tide-indicators
```

Request:

```json
{
    "occurredAt":
    "2026-07-01T01:47:00",

    "type":
    "HIGH",

    "waterLevelFt":
    7.22
}
```

---

Validation:

Required:

```
occurredAt

type

waterLevelFt
```

Allowed type:

```
HIGH

LOW
```

---

# 5.3 Update Tide Indicator

```
PUT

/api/tide-indicators/:id
```

Request:

```json
{
    "waterLevelFt":7.30
}
```

---

# 5.4 Delete Tide Indicator

```
DELETE

/api/tide-indicators/:id
```

---

# 6. Hourly Tide Level API

---

# 6.1 Get Hourly Tide Levels

```
GET

/api/hourly-levels?date=2026-07-01
```

Response:

```json
{
    "success":true,

    "data":[

        {
            "recordedAt":
            "2026-07-01T01:00:00",

            "waterLevelFt":
            7.20
        }

    ]
}
```

---

# 6.2 Create Hourly Tide Level

```
POST

/api/hourly-levels
```

Request:

```json
{
    "recordedAt":
    "2026-07-01T01:00:00",

    "waterLevelFt":
    7.20
}
```

---

# 6.3 Bulk Import Hourly Levels

Used for Excel upload.

```
POST

/api/hourly-levels/import
```

Content Type:

```
multipart/form-data
```

Example:

```
file:
july-hourly.xlsx
```

---

Response:

```json
{
    "success":true,

    "inserted":24,

    "failed":0
}
```

---

# 7. Rule Profile API

---

# 7.1 Get Rule Profiles

```
GET

/api/rule-profiles
```

Response:

```json
{
    "success":true,

    "data":[

        {
            "id":"uuid",

            "name":
            "Default",

            "redDifference":
            2.5,

            "yellowDifference":
            1.5,

            "greenDifference":
            2.5
        }

    ]
}
```

---

# 7.2 Update Rule Profile

```
PUT

/api/rule-profiles/:id
```

Request:

```json
{
    "redDifference":2.5,

    "yellowDifference":1.5
}
```

---

# 8. Navigation Window API

---

# 8.1 Generate Navigation Window

This triggers the Navigation Engine.

```
POST

/api/navigation/generate
```

Request:

```json
{
    "date":
    "2026-07-01",

    "profileId":
    "uuid"
}
```

---

Processing:

```
Load Tide Indicators

↓

Load Hourly Tide Levels

↓

Load Rule Profile

↓

Navigation Engine

↓

Save Navigation Window

```

---

Response:

```json
{
    "success":true,

    "data":{

        "id":
        "uuid",

        "date":
        "2026-07-01",

        "status":
        "GENERATED"

    }
}
```

---

# 8.2 Get Today's Navigation Window

```
GET

/api/navigation/today
```

---

Response:

```json
{
    "success":true,

    "data":{

        "date":
        "2026-07-01",


        "items":[

            {
                "hour":
                "01:00",

                "waterLevelFt":
                7.2,

                "red":
                true,

                "yellow":
                false,

                "green":
                false
            }

        ]

    }
}
```

---

# 8.3 Get Navigation Window By Date

```
GET

/api/navigation/date/:date
```

Example:

```
GET

/api/navigation/date/2026-07-01
```

---

# 8.4 Get Navigation History

```
GET

/api/navigation/history
```

Optional filters:

```
?page=1

&limit=20

&from=2026-07-01

&to=2026-07-31
```

---

# 9. Dashboard API

The dashboard should not call many APIs.

Provide one aggregated endpoint.

---

## Get Dashboard Data

```
GET

/api/dashboard?date=2026-07-01
```

---

Response:

```json
{
    "success":true,

    "data":{

        "date":
        "2026-07-01",


        "tideIndicators":[

            {
                "type":"HIGH",

                "time":"01:47",

                "level":7.22
            }

        ],


        "navigationWindow":{

            "generated":true,


            "items":[

                {
                    "hour":"01:00",

                    "status":[
                        "RED"
                    ]

                }

            ]

        }

    }
}
```

---

# 10. Excel Import API

---

# 10.1 Import Tide Indicators

```
POST

/api/tide-indicators/import
```

Content:

```
multipart/form-data
```

Example:

```
file:

tide-indicator.xlsx
```

---

Excel Format:

|Date|Time|Type|Level|
|-|-|-|-|
|1|0147|HIGH|7.22|
|1|0753|LOW|3.61|

---

Processing:

```
Excel

↓

Parser

↓

Validation

↓

Database

```

---

# 10.2 Import Hourly Tide Levels

```
POST

/api/hourly-levels/import
```

Excel:

|Time|Level|
|-|-|
|0100|7.2|
|0200|7.1|

---

# 11. Validation Errors

---

## Missing Data

Response:

```json
{
    "success":false,

    "code":
    "MISSING_DATA",

    "message":
    "Hourly tide level missing"
}
```

---

## Duplicate Timestamp

```json
{
    "success":false,

    "code":
    "DUPLICATE_TIME",

    "message":
    "Hourly record already exists"
}
```

---

## Invalid Tide Type

```json
{
    "success":false,

    "code":
    "INVALID_TIDE_TYPE",

    "message":
    "Only HIGH or LOW allowed"
}
```

---

# 12. HTTP Status Codes

|Code|Meaning|
|-|-|
|200|Success|
|201|Created|
|400|Bad Request|
|404|Not Found|
|422|Validation Error|
|500|Server Error|

---

# 13. Authentication (Future)

Future implementation:

```
POST /api/auth/login

GET /api/users

GET /api/roles

```

Roles:

```
ADMIN

SUPERVISOR

OPERATOR

```

---

# 14. API Development Rules

## Rule 1

Controllers only handle HTTP.

---

## Rule 2

Services handle workflows.

---

## Rule 3

Repositories handle database.

---

## Rule 4

Navigation Engine handles calculations.

---

## Rule 5

Frontend never calculates navigation status.

---

# 15. Final API Flow

```
React Dashboard

        |

        v

GET /api/dashboard

        |

        v

Express Controller

        |

        v

Dashboard Service

        |

        +------------+

        |            |

        v            v

 Tide Repository   Navigation Repository


        |

        v

PostgreSQL

```

---

# End of Document
