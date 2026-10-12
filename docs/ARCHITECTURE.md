# Architecture

This document describes Scheme Finder's system design across all three stages.

---

## Stage 1 — Current Architecture

Stage 1 is intentionally minimal. The entire app is a single HTML file with inlined CSS and JS, supported by well-structured companion files in `data/`, `utils/`, and `styles/`.

**No build step. No bundler. No server. No framework.**

```
Browser
  └── frontend/src/index.html          ← Single entry point
        │
        ├── [inlined CSS]              ← From styles/tokens.css + styles/base.css
        │
        └── [inlined JavaScript]
              │
              ├── data/schemes.js      ← Scheme definitions + eligFn rules
              ├── data/deadlines.js    ← Deadline data
              ├── data/news.js         ← News feed data
              ├── data/exams.js        ← Exam calendar
              ├── data/colleges.js     ← College comparison tables
              │
              ├── utils/eligibility.js ← Core scoring engine (pure functions)
              ├── utils/chat.js        ← AI reply generator
              └── utils/helpers.js     ← Formatting, DOM, colour utilities
```

*Note: The `data/`, `utils/`, and `styles/` files are the canonical source. The inlined code in `index.html` mirrors them. In Stage 2, `index.html` will import these directly as ES modules.*

---

## Eligibility Engine — Data Flow

```
User fills onboarding modal or eligibility form
          │
          ▼
    UserProfile = {
      cat, edu, inc, gender, marks, state, stream
    }
          │
          ▼
  scoreAllSchemes(SCHEMES, userProfile)
          │
          ├── For each scheme in SCHEMES:
          │     scheme.eligFn(userProfile)
          │       → Hard blocks? → score: 0, blocks: [reason]
          │       → Positive checks → score += points, reasons.push(...)
          │       → Return { score, reasons, blocks }
          │
          ├── eligible  = score >= 30 AND blocks.length === 0
          ├── partial   = score > 0 AND blocks.length > 0
          │
          ▼
    Sort eligible[] descending by score
          │
          ▼
    Render in:
      - Dashboard (top 3 matches)
      - Eligibility Checker (full list with reasons)
      - AI Chat (inline scheme cards)
      - Schemes Browser (live match % per card)
```

---

## AI Chat — Reply Flow

```
User types message
          │
          ▼
  generateReply(rawText, currentProfile)   [utils/chat.js]
          │
          ├── 1. Greeting pattern          → welcome message + quick replies
          ├── 2. Self-description detected → parseProfileFromText(rawText)
          │                                   └── scoreAllSchemes(SCHEMES, parsed)
          │                                   └── render top eligible scheme cards
          ├── 3. NSP / specific scheme     → scheme detail card + apply steps
          ├── 4. Income/caste certificate  → step-by-step document guide
          ├── 5. Girl / women schemes      → filtered scheme list
          ├── 6. Fellowships / research    → research fellowship cards
          ├── 7. Deadlines                 → deadline urgency list
          ├── 8. JEE / NEET / exam         → preparation guide
          ├── 9. General category          → merit-based schemes explanation
          └── 10. Fallback                 → suggestions + eligibility checker CTA
          │
          ▼
    HTML string → rendered in chat bubble
```

---

## Stage 2 — Planned Architecture (Q1 2026)

```
┌─────────────────────────────────────────────────┐
│  React 18 + Vite  (frontend/)                   │
│  Deployed on Vercel                             │
└───────────────────────┬─────────────────────────┘
                        │ HTTPS / REST API
                        ▼
┌─────────────────────────────────────────────────┐
│  Node.js + Express  (backend/)                  │
│  Deployed on Railway / Render                   │
│                                                 │
│  /api/v1/auth     ← Register, login (JWT)       │
│  /api/v1/schemes  ← List, filter, match API     │
│  /api/v1/user     ← Saved profile, apps         │
└───────────────────────┬─────────────────────────┘
                        │ Mongoose ODM
                        ▼
┌─────────────────────────────────────────────────┐
│  MongoDB Atlas                                  │
│                                                 │
│  users         ← Profile, auth data            │
│  schemes       ← Full scheme DB (seeded)        │
│  applications  ← User's saved applications     │
└─────────────────────────────────────────────────┘
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| JS data files | `camelCase.js` | `schemes.js` |
| JS utility files | `camelCase.js` | `eligibility.js` |
| CSS files | `kebab-case.css` | `tokens.css` |
| Scheme IDs | `kebab-case` | `nsp-postmatric` |
| Variables/functions | `camelCase` | `scoreScheme()` |
| Constants | `SCREAMING_SNAKE_CASE` | `INCOME_BRACKETS` |

---

## Key Design Decisions

**Why Vanilla JS in Stage 1?**
Zero dependencies means zero setup friction. Anyone can clone and open the file. No Node.js required.

**Why inline CSS/JS in `index.html` for Stage 1?**
Single-file deployment. The separated files in `data/`, `utils/`, and `styles/` are the canonical source and will be imported directly in Stage 2 as ES modules.

**Why rule-based scoring instead of ML?**
Government scheme eligibility criteria are published in official notifications. They're deterministic — not probabilistic. A rule-based engine is more accurate, more transparent, and easier to maintain than any ML model for this use case.

**Why not use NSP's API directly?**
NSP doesn't have a public API. Stage 3 will explore scraping or official data-sharing partnerships.
