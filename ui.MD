# TideNav

# Frontend UI Design Document

**Version:** 1.0  
**Author:** Ikhmal  

**Frontend:** React + TypeScript  
**Styling:** TailwindCSS  
**Component Library:** shadcn/ui  

---

# 1. Purpose

This document defines the frontend structure and user interface design for TideNav.

The frontend is responsible for:

- Displaying marine information.
- Collecting user input.
- Showing generated navigation windows.
- Managing user interaction.

The frontend is NOT responsible for:

- Calculating tide thresholds.
- Applying navigation rules.
- Generating colors.
- Running the Navigation Engine.

---

# 2. Design Philosophy

The dashboard should support operational decisions quickly.

The operator should immediately understand:

1. Current tide indicators.
2. Current hourly tide condition.
3. Navigation availability.

The main screen should avoid unnecessary information.

---

# 3. Application Structure

Main pages:

```
Dashboard

Tide Indicators

Hourly Tide Levels

Navigation Windows

Rule Profiles

Settings
```

---

# 4. Frontend Folder Structure

```
apps/web/src/

│

├── api/

│   ├── client.ts

│   ├── dashboardApi.ts

│   ├── tideApi.ts

│   └── navigationApi.ts


│

├── components/

│   ├── dashboard/

│   ├── tables/

│   ├── forms/

│   ├── common/


│

├── pages/

│   ├── DashboardPage.tsx

│   ├── TideIndicatorPage.tsx

│   ├── HourlyLevelPage.tsx

│   ├── NavigationPage.tsx

│   └── RuleProfilePage.tsx


│

├── hooks/

│

├── layouts/

│

├── routes/

│

├── types/

│

└── utils/

```

---

# 5. Application Routing

Example:

```typescript
/dashboard

/tide-indicators

/hourly-levels

/navigation-windows

/rule-profiles
```

---

# 6. Dashboard Design

The dashboard is the main operational screen.

Layout:

```
+---------------------------------------------------------------+

                         TideNav

                    Date: 01 July 2026


+----------------------+----------------------------------------+

| Tide Indicators      | Navigation Window                     |
|                      |                                        |
| ▲ HIGH               | Time       Status                     |
| 01:47                |                                        |
| 7.22 ft              | 01:00      🔴 RED                    |
|                      |                                        |
| ▼ LOW                | 02:00      🔴 RED                    |
| 07:53                |                                        |
| 3.61 ft              | 03:00      🟡 YELLOW                 |
|                      |                                        |
| ▲ HIGH               | 04:00      🟢 GREEN                  |
| 13:45                |                                        |
| 8.86 ft              |                                        |
+----------------------+----------------------------------------+

```

---

# 7. Dashboard Components

Component tree:

```
DashboardPage


├── DateSelector

├── TideIndicatorPanel

│
├── TideIndicatorCard


├── NavigationWindowPanel

│
├── NavigationTimelineTable


├── StatusLegend

└── GenerateButton

```

---

# 8. Tide Indicator Panel

Purpose:

Display important tide events.

Example:

```
HIGH

01:47

7.22 ft

```

Component:

```
TideIndicatorCard
```

Props:

```typescript
{
    type:
    "HIGH",

    time:
    "01:47",

    level:
    7.22
}
```

---

# 9. Navigation Window Table

This is the most important component.

Example:

|Time|Level|Status|
|-|-|-|
|01:00|7.2|🔴|
|02:00|7.1|🔴|
|03:00|6.5|🟡|
|04:00|5.5|🟢|

---

Component:

```
NavigationTimelineTable
```

---

Data:

```typescript
interface NavigationItem {

    hour:string;

    waterLevel:number;

    red:boolean;

    yellow:boolean;

    green:boolean;

}
```

---

# 10. Color Display Rules

The frontend only displays colors from backend response.

Example:

Backend:

```json
{
    "red":true,

    "yellow":false,

    "green":false
}
```

Frontend:

```
🔴 RED
```

---

Multiple statuses:

Example:

```json
{
    "red":true,

    "green":true
}
```

Display:

```
🔴 🟢
```

---

# 11. Color Legend

Component:

```
StatusLegend
```

Display:

```
🔴 RED

High operational condition


🟡 YELLOW

Warning condition


🟢 GREEN

Safe condition

```

---

# 12. Tide Indicator Management Page

Route:

```
/tide-indicators
```

Purpose:

Manage HIGH and LOW tide data.

---

Layout:

```
+------------------------------------------------+

 Tide Indicators

 [Add Indicator]

 Date Filter


|Date|Time|Type|Level|Action|
|----|----|----|-----|------|
|01/07|01:47|HIGH|7.22|Edit|

+------------------------------------------------+

```

---

Features:

- Add.
- Edit.
- Delete.
- Import Excel.

---

# 13. Hourly Tide Levels Page

Route:

```
/hourly-levels
```

Purpose:

Manage hourly readings.

---

Layout:

```
Hourly Tide Levels


|Time|Level|Action|
|-|-|-|
|01:00|7.20|Edit|
|02:00|7.10|Edit|

```

---

Features:

- Manual entry.
- Excel import.
- Data validation.

---

# 14. Navigation Window History

Route:

```
/navigation-windows
```

Purpose:

View generated results.

---

Layout:

```
Navigation History


|Date|Profile|Generated|
|-|-|-|
|01 July|Default|08:30|
|02 July|Default|08:25|

```

---

# 15. Rule Profile Page

Route:

```
/rule-profiles
```

Purpose:

Manage calculation configuration.

---

Example:

```
Default Profile


Red Difference

[ 2.5 ]


Yellow Difference

[ 1.5 ]


Green Difference

[ 2.5 ]


Yellow Disabled

07:00 - 19:00


[Save]

```

---

# 16. Form Design

All forms should include:

- Label.
- Input.
- Validation message.
- Submit action.

Example:

```
Water Level

[ 7.22 ]

✓ Valid

```

---

# 17. File Import Component

Component:

```
ExcelUploader
```

Flow:

```
Select File

↓

Upload

↓

Backend Validation

↓

Show Result

```

---

Success:

```
Imported successfully

24 records created

```

---

Failure:

```
Import failed

Missing time column

```

---

# 18. Loading States

Every API request must have loading feedback.

Example:

```
Generating Navigation Window...


[Loading Spinner]

```

---

# 19. Empty States

Example:

No navigation window:

```
No Navigation Window Generated

Import tide data and generate result.

[Generate]

```

---

# 20. Error States

Example:

```
Unable to load dashboard.

Please try again.

[Retry]

```

---

# 21. Responsive Design

Desktop:

Primary target.

```
1920x1080

1366x768
```

---

Tablet:

Support:

```
768px+
```

---

Mobile:

Basic support.

Dashboard should stack:

```
Tide Indicators

↓

Navigation Window

```

---

# 22. State Management

Use:

```
TanStack Query
```

For:

- Dashboard data.
- Tide indicators.
- Navigation windows.

---

React state:

Use for:

- Dialog visibility.
- Form state.
- Selected date.

---

# 23. Frontend API Flow

Example:

Generate button:

```
User clicks Generate

↓

React Mutation

↓

POST /api/navigation/generate

↓

Backend processes

↓

Return Navigation Window

↓

Refresh Dashboard

```

---

# 24. Component Rules

## Rule 1

Components only display data.

---

## Rule 2

No tide calculation inside React.

---

## Rule 3

No hardcoded colors.

---

Wrong:

```typescript
if(level > 5)
{
color="red"
}
```

---

Correct:

```typescript
if(item.red)
{
display RED
}
```

---

# 25. Accessibility

Requirements:

- Clear color labels.
- Do not rely only on color.
- Use text labels.

Example:

Wrong:

```
🔴
```

Correct:

```
🔴 RED
```

---

# 26. Future UI Improvements

Version 2:

- Dark mode.
- Mobile optimized layout.
- Export screenshot.
- Charts.
- Map integration.

---

# Final Frontend Principle

React is only a window into the navigation system.

The frontend displays:

```
Navigation Engine Result
```

It does not create the result.
