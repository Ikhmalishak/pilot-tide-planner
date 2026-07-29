# TideNav

# Navigation Engine Business Rules Document

**Version:** 1.0  
**Author:** Ikhmal  

---

# 1. Purpose

The Navigation Engine is the core calculation component of TideNav.

Its responsibility is to transform:

Input:

```
Tide Indicators

+

Hourly Tide Levels

+

Rule Profile
```

into:

Output:

```
Navigation Window
```

The Navigation Engine determines the operational status of each hour.

---

# 2. Design Principles

The Navigation Engine must:

- Be independent from database.
- Be independent from API.
- Be independent from React.
- Receive only validated domain objects.
- Produce deterministic results.

Same input:

```
Tide Indicators

+

Hourly Tide Levels

+

Rule Profile
```

must always produce:

```
Same Navigation Window
```

---

# 3. Input Models

---

# Tide Indicator

Represents HIGH or LOW tide.

Example:

```typescript
{
    occurredAt:
    "2026-07-01 01:47",

    type:
    "HIGH",

    waterLevelFt:
    7.22
}
```

---

# Hourly Tide Level

Represents hourly water condition.

Example:

```typescript
{
    recordedAt:
    "2026-07-01 03:00",

    waterLevelFt:
    6.8
}
```

---

# Rule Profile

Example:

```typescript
{
    redDifference: 2.5,

    yellowDifference: 1.5,

    greenDifference: 2.5,

    yellowDisabledStart:
    "07:00",

    yellowDisabledEnd:
    "19:00"
}
```

---

# 4. Navigation Colors

The Navigation Engine produces three possible statuses.

---

# RED

Meaning:

High priority navigation condition.

Generated when:

Water level satisfies red threshold.

---

# YELLOW

Meaning:

Warning / intermediate condition.

Generated when:

Water level satisfies yellow threshold.

Subject to time restrictions.

---

# GREEN

Meaning:

Safe navigation condition.

Generated according to green rules.

---

# 5. Threshold Calculation

The system does not use fixed water levels.

It calculates thresholds from tide indicators.

---

# 5.1 High Tide Red Threshold

Formula:

```
HIGH tide level

-

Red Difference
```

Example:

High tide:

```
7.22 ft
```

Rule:

```
Red Difference = 2.5
```

Calculation:

```
7.22 - 2.5

=

4.72 ft
```

Result:

```
Red threshold = 4.72 ft
```

---

# 5.2 High Tide Yellow Threshold

Formula:

```
HIGH tide level

-

Yellow Difference
```

Example:

```
7.22 - 1.5

=

5.72 ft
```

Result:

```
Yellow threshold = 5.72 ft
```

---

# 5.3 Low Tide Red Threshold

Formula:

```
LOW tide level

+

Red Difference
```

Example:

Low tide:

```
3.61 ft
```

Calculation:

```
3.61 + 2.5

=

6.11 ft
```

Result:

```
Red threshold = 6.11 ft
```

---

# 5.4 Low Tide Green Threshold

Formula:

```
LOW tide level

+

Green Difference
```

Example:

```
3.61 + 2.5

=

6.11 ft
```

---

# 6. Navigation State Machine

The Navigation Engine uses a state machine.

This avoids complicated nested conditions.

---

Diagram:

```text
                 START

                   |

                   v

             WAIT_HIGH_TIDE

                   |

                   |

              HIGH DETECTED

                   |

                   v

          HIGH_TIDE_DESCENDING

                   |

        Water Below Threshold

                   |

                   v

             WAIT_LOW_TIDE

                   |

                   |

              LOW DETECTED

                   |

                   v

           LOW_TIDE_RISING

                   |

        Water Above Threshold

                   |

                   v

             WAIT_HIGH_TIDE


```

---

# 7. State Definitions

---

# WAIT_HIGH_TIDE

System waits for next HIGH tide indicator.

No color assignment.

---

# HIGH_TIDE_DESCENDING

After HIGH tide:

Calculate:

```
HIGH - Red Difference
```

While:

```
Hourly Level >= threshold
```

Assign:

```
RED
```

---

Example:

High:

```
8.86 ft
```

Threshold:

```
8.86 - 2.5

=

6.36 ft
```

Hourly:

```
09:00 6.5

10:00 7.2

11:00 8.0
```

Result:

```
RED
```

---

# WAIT_LOW_TIDE

After descending period finishes.

Wait for LOW tide.

---

# LOW_TIDE_RISING

After LOW tide:

Calculate:

```
LOW + Red Difference
```

When:

```
Hourly Level >= threshold
```

Start:

```
RED
```

Continue until next HIGH tide logic applies.

---

# 8. Complete Processing Algorithm

```text
START

↓

Sort Tide Indicators

↓

Sort Hourly Tide Levels

↓

Find first tide indicator

↓

Determine state

↓

Process every hourly level

↓

Calculate thresholds

↓

Assign colors

↓

Generate Navigation Window

↓

END
```

---

# 9. RED Rule

## Purpose

Identify periods where water level meets navigation requirements.

---

Algorithm:

```typescript
for each hourlyLevel:

    if hourlyLevel >= redThreshold:

        isRed = true

```

---

# 10. YELLOW Rule

Yellow uses a smaller threshold.

Formula:

```
HIGH Tide

-

Yellow Difference
```

Example:

```
7.22 - 1.5

=

5.72
```

---

Continue yellow while:

```
Hourly Level >= yellowThreshold
```

---

# Yellow Time Restriction

Yellow is disabled between:

```
07:00

-

19:00
```

Example:

Calculated:

```
08:00

YELLOW
```

but:

```
08:00 is restricted
```

Final:

```
No yellow
```

---

# 11. GREEN Rule

Current agreed behavior:

Green begins after LOW tide recovery.

Formula:

```
LOW tide

+

Green Difference
```

Example:

Low tide:

```
3.61 ft
```

Calculation:

```
3.61 + 2.5

=

6.11 ft
```

When:

```
Hourly Level >= 6.11
```

Assign:

```
GREEN
```

---

# 12. Color Combination

A single hour may contain multiple statuses.

Example:

```json
{
"hour":"11:00",

"red":true,

"green":true
}
```

The database supports this.

Reason:

Some operational conditions overlap.

---

# 13. Processing Example

Input:

High Tide:

```
01:47

7.22 ft
```

Low Tide:

```
07:53

3.61 ft
```

---

Rule:

```
Red Difference = 2.5
```

---

High threshold:

```
7.22 - 2.5

=

4.72
```

---

Hourly:

|Hour|Level|
|-|-|
|01:00|7.20|
|02:00|7.10|
|03:00|6.50|
|04:00|5.50|
|05:00|4.80|
|06:00|4.60|

---

Result:

|Hour|Status|
|-|-|
|01:00|RED|
|02:00|RED|
|03:00|RED|
|04:00|RED|
|05:00|RED|
|06:00|-|

---

# 14. Validation Rules

Before processing:

Check:

## Tide Indicators

Must have:

- Date
- Time
- Type
- Water level

---

## Hourly Tide Levels

Must have:

- Timestamp
- Water level

---

## Data Integrity

Reject:

- Duplicate timestamps.
- Missing hourly data.
- Invalid tide type.
- Empty values.

---

# 15. Edge Cases

---

## Case 1

No HIGH tide.

Action:

```
Cannot generate navigation window
```

---

## Case 2

No hourly data.

Action:

```
Cannot generate navigation window
```

---

## Case 3

Multiple HIGH tides.

Action:

Process chronologically.

---

## Case 4

Missing hour.

Example:

```
01:00

02:00

04:00
```

03:00 missing.

Action:

Warning.

---

# 16. Navigation Engine Pseudocode

```typescript
function generateNavigationWindow(
    indicators,
    hourlyLevels,
    profile
){

    validateInput()

    sortData()


    for(hour of hourlyLevels){

        calculateCurrentState()


        calculateThresholds()


        assignColors()


    }


    return navigationWindow

}
```

---

# 17. Unit Testing Requirements

The Navigation Engine must include tests.

---

# Test 1

High tide descending.

Input:

```
HIGH 7.22

Difference 2.5
```

Expected:

```
RED until level < 4.72
```

---

# Test 2

Low tide recovery.

Input:

```
LOW 3.61
```

Expected:

```
GREEN after 6.11
```

---

# Test 3

Yellow disabled period.

Input:

```
Yellow calculated at 10:00
```

Expected:

```
No yellow
```

---

# Test 4

Overlapping colors.

Expected:

```
Multiple flags allowed
```

---

# 18. Future Improvements

Possible future rules:

- Vessel-specific thresholds.
- Weather conditions.
- Current speed.
- Wind conditions.
- Safety margins.
- AI prediction.

---

# Final Principle

The Navigation Engine converts:

```
Tide Information

+

Operational Rules

```

into:

```
Navigation Guidance
```

The engine is the single source of truth for all navigation decisions.
