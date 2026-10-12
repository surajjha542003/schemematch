# Changelog

All notable changes to Scheme Finder are documented here.

This project follows [Semantic Versioning](https://semver.org/) and [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) conventions.

---

## [1.0.0] — 2025-10-31 · Stage 1 Launch 🎉

### ✅ Added
- Complete frontend application — no build step required
- **Real eligibility engine** — rule-based scoring per scheme, not fake hardcoded percentages
  - Each scheme has an `eligFn(userProfile)` function with actual criteria checks
  - Hard blocks for disqualifying criteria (wrong category, wrong education level, etc.)
  - Soft scoring for positive signals (income within limit, marks sufficient, etc.)
  - Results genuinely differ by category, income, gender, education, state, stream, and marks
- **12 schemes** from the Ministry of Education ecosystem:
  - NSP Post-Matric Scholarship
  - Central Sector Scholarship
  - AICTE Pragati Scholarship (girls)
  - INSPIRE Scholarship (DST)
  - CSIR-UGC NET JRF
  - Begum Hazrat Mahal Scholarship
  - PM Research Fellowship (PMRF)
  - AICTE Saksham Scholarship
  - Maulana Azad National Fellowship
  - NSP Pre-Matric Scholarship
  - Ishan Uday Scholarship
  - PM-YASASVI Scholarship
- **AI Chat Assistant** — natural language queries with live eligibility matching
  - Profile parsing from free text ("I'm OBC, BTech, 1.5 lakh income")
  - Pattern-matched responses for common queries (NSP, certificates, exams, etc.)
  - Scheme cards with apply/document buttons inside chat
- **Personalised Dashboard**
  - Live match count and benefit potential
  - Top 3 eligible schemes widget
  - Deadline urgency tracker
  - Trending topics
  - Scholarship calculator teaser
  - Application checklist progress
- **Eligibility Checker** — full form with 9 fields, split into Fully Eligible vs. Partially Eligible results with exact reasons
- **All Schemes Browser** — filterable grid (all, scholarships, fellowships, grants, girls, minority, technical, research, NE, differently-abled)
- **Deadline Tracker** — 6 upcoming deadlines with urgency colours
- **Education News Feed** — 6 latest MoE/NTA/UGC news items
- **Exam Calendar** — JEE Main, NEET, CUET, GATE, UGC NET, CAT with preparation tips
- **Scholarship Calculator** — annual + total degree benefit estimate by profile, loan vs. scholarship comparison
- **College Comparator** — IITs, NITs, Central Universities, Medical Colleges, IIMs
- **User Profile panel** — display saved profile data
- **Onboarding modal** — 4-step profile setup on first visit
- CSS design system with design tokens (colours, spacing, typography)
- India flag bar, Syne + Plus Jakarta Sans typography
- Vercel deployment config
- GitHub Actions CI/CD workflow
- Professional file structure (data/, utils/, styles/ separation)

### 📁 Tech Stack (Stage 1)
- HTML5, CSS3, Vanilla JavaScript (ES6+)
- Zero external dependencies (other than Google Fonts)
- Zero build step

---

## [Unreleased] — Stage 2 Preview

### 🔜 Planned
- React 18 + Vite migration
- Node.js + Express backend
- MongoDB Atlas database
- User accounts and saved profiles
- Ministry of Social Justice schemes (~15 new)
- Ministry of Minority Affairs schemes (~8 new)
- JWT-based authentication
- Vercel (frontend) + Railway (backend) deployment
