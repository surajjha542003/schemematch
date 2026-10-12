# Eligibility Logic — Deep Dive

This document explains exactly how Scheme Finder's eligibility engine works, how to read its output, and how to write `eligFn` functions when adding new schemes.

---

## Overview

The engine lives in `frontend/src/utils/eligibility.js`.

Every scheme in `frontend/src/data/schemes.js` has an `eligFn` — a plain JavaScript function that takes a `UserProfile` object and returns a scored result. There is no database query, no API call, and no fuzzy logic. Just deterministic rules.

```
UserProfile → eligFn(UserProfile) → { score, reasons, blocks }
```

---

## The UserProfile Object

```js
{
  name:   "Priya Sharma",        // string — display only
  age:    "20",                  // string
  gender: "Female",              // "Male" | "Female" | "Other / Transgender"
  state:  "Maharashtra",         // full state name
  cat:    "OBC",                 // category (see below)
  inc:    "1to2.5",              // income bracket key (see below)
  edu:    "ug-tech",             // education level key (see below)
  marks:  "78",                  // string, percentage
  stream: "engineering",         // subject stream key (see below)
  disability: "No",              // "Yes" | "No" — the STUDENT's own disability status (≥40%)
}
```

### Category values (`cat`)

| Value | Meaning |
|-------|---------|
| `"General"` | General / Unreserved |
| `"OBC"` | Other Backward Classes |
| `"SC"` | Scheduled Caste |
| `"ST"` | Scheduled Tribe |
| `"EWS"` | Economically Weaker Section |
| `"Minority"` | Minority (generic) |
| `"Minority (Muslim)"` | Muslim minority |
| `"Minority (Christian)"` | Christian minority |
| `"Minority (Buddhist)"` | Buddhist minority |
| `"Minority (Jain)"` | Jain minority |
| `"Minority (Sikh)"` | Sikh minority |

### Income bracket keys (`inc`)

| Key | Meaning |
|-----|---------|
| `"under1"` | Below ₹1 lakh/year |
| `"1to2.5"` | ₹1L – ₹2.5L/year |
| `"2.5to4.5"` | ₹2.5L – ₹4.5L/year |
| `"4.5to8"` | ₹4.5L – ₹8L/year |
| `"above8"` | Above ₹8L/year |

The `incAtOrBelow(userInc, limit)` helper uses an ordered array so income comparisons are correct:

```js
const INCOME_BRACKETS = ['under1', '1to2.5', '2.5to4.5', '4.5to8', 'above8'];

// Example: does "1to2.5" fall at or below "2.5to4.5"?
// indexOf("1to2.5") = 1, indexOf("2.5to4.5") = 2 → 1 <= 2 → true ✅
incAtOrBelow('1to2.5', '2.5to4.5')  // → true
incAtOrBelow('4.5to8', '2.5to4.5')  // → false
```

### Education level keys (`edu`)

| Key | Meaning |
|-----|---------|
| `"9-10"` | Class 9 or 10 |
| `"11-12"` | Class 11 or 12 |
| `"diploma"` | Diploma / ITI |
| `"ug-arts"` | BA / BSc / BCom |
| `"ug-tech"` | BTech / BE (AICTE-approved) |
| `"ug-medical"` | MBBS / BDS / Nursing |
| `"pg"` | MA / MSc / MTech / MBA |
| `"phd"` | PhD / Research |

---

## The `eligFn` Return Object

```js
{
  score:   75,       // 0–100 — higher = stronger match
  reasons: [         // positive signals shown to user
    "✓ Category (OBC) matches",
    "✓ Education level is post-matric",
    "✓ Income within ₹2.5L limit"
  ],
  blocks:  []        // hard disqualifiers — if non-empty, not eligible
}
```

### How score is computed

- **Hard block** — if a mandatory criterion fails, the function returns immediately with `score: 0` and a populated `blocks` array. No further scoring happens.
- **Soft scores** — positive criteria add points. Points are design-weighted (category check = 40, education = 30, income = 30 for most schemes).
- Score is capped at 100.

### Eligibility classification

```js
function isEligible(result) {
  return result.blocks.length === 0 && result.score >= 30;
}
```

| Condition | Classification |
|-----------|---------------|
| `blocks.length === 0` AND `score >= 30` | ✅ Fully Eligible |
| `blocks.length > 0` AND `score > 0` | ⚠️ Partially Eligible |
| Early return with block | ❌ Not Eligible |

---

## Writing a New `eligFn`

When adding a scheme, start with the official notification (on the scheme's portal). Identify:

1. **Hard disqualifiers** — who is completely excluded (wrong category, wrong gender, wrong education level)
2. **Income limit** — use `incAtOrBelow()` helper
3. **Merit criterion** — usually minimum marks percentage
4. **Special conditions** — state domicile, disability certificate, exam qualification, etc.

```js
eligFn(u) {
  let score = 0;
  const reasons = [], blocks = [];
  const add = (points, reason) => { score += points; reasons.push(reason); };

  // 1. Hard disqualifiers first — return early if fails
  if (u.gender !== 'Female') {
    blocks.push('This scheme is exclusively for female students');
    return { score: 0, reasons, blocks };
  }

  if (!H.EDU_TECH.includes(u.edu)) {
    blocks.push('Must be in an AICTE-approved technical course');
    return { score: 0, reasons, blocks };
  }

  // 2. Positive scoring
  add(35, '✓ Female student');
  add(35, '✓ Technical course (BTech/BE)');

  // 3. Income gate — soft block
  if (H.incAtOrBelow(u.inc, '4.5to8')) {
    add(30, '✓ Family income within ₹8L limit');
  } else {
    blocks.push('Family income must be below ₹8 lakh per year');
  }

  return { score: Math.min(score, 100), reasons, blocks };
}
```

---

## Category Helper Reference

```js
isMinority(cat)   // true for all 6 minority groups
isSC(cat)         // true for "SC"
isST(cat)         // true for "ST"
isOBC(cat)        // true for "OBC"
isEWS(cat)        // true for "EWS"
isReserved(cat)   // true for OBC, SC, ST, EWS, all Minority groups
isNorthEast(state) // true for all 8 NE states
```

---

## Testing a New eligFn

Before opening a PR, manually test these six profiles against your scheme:

```js
// Profile A — General, high income, BTech
{ cat: 'General', inc: 'above8', edu: 'ug-tech', gender: 'Male', marks: '80' }

// Profile B — OBC, low income, BTech
{ cat: 'OBC', inc: '1to2.5', edu: 'ug-tech', gender: 'Male', marks: '65' }

// Profile C — SC, very low income, Class 11
{ cat: 'SC', inc: 'under1', edu: '11-12', gender: 'Female', marks: '72' }

// Profile D — Minority female, Class 10
{ cat: 'Minority (Muslim)', inc: '1to2.5', edu: '9-10', gender: 'Female', marks: '55' }

// Profile E — PhD student, any category
{ cat: 'General', inc: '2.5to4.5', edu: 'phd', gender: 'Male', marks: '85' }

// Profile F — NE state, UG student
{ cat: 'OBC', inc: '1to2.5', edu: 'ug-arts', gender: 'Female', state: 'Assam', marks: '68' }
```

Document expected results in your PR description.
