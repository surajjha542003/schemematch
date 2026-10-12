## What does this PR do?

<!-- A clear, one-line summary -->

## Type of change

- [ ] 🆕 New scheme added
- [ ] 🐛 Bug fix (eligibility logic / UI)
- [ ] 💅 UI / style improvement
- [ ] 📖 Documentation update
- [ ] 🗞️ Data update (news, exams, deadlines)
- [ ] 🔧 Other (describe below)

## Description

<!-- Explain the change and why it was made -->

## If you added / changed a scheme

**Scheme name:**

**Official source / notification URL:**

**Test profiles checked:**

| Profile | Expected | Actual |
|---------|----------|--------|
| General, BTech, income >₹8L | ❌ Not eligible | |
| OBC, BTech, income ₹1.5L | ✅ Eligible | |
| SC, Class 11, income ₹80K | ✅ Eligible | |
| Girl, BTech, income ₹3L | (eligible / not) | |

## Checklist

- [ ] Tested in Chrome, Firefox, and Safari
- [ ] No `console.log` left behind
- [ ] No unrelated files changed
- [ ] PR title is descriptive (`feat: add XYZ scheme` / `fix: NSP income check`)
