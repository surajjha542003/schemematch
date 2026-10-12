> Update 10 October 2026: [Verified rules and deployment](VERIFIED_RULES_AND_DEPLOYMENT.md) records the latest annual rates, document guidance, working MongoDB connection and final validation. Earlier pending-status notes below describe the previous review stage.

> Current scope and status: [Data flow and remaining work](DATA_FLOW_AND_REMAINING_WORK.md). The 15-state and 12 other-sector directories are implemented; full current-cycle rules remain pending. This file preserves the earlier proposed review batch.

# Next eligibility implementation — source evidence for review

Prepared 9 October 2026. These are observed conditions from official pages, not complete current-cycle rule approvals. Matching remains disabled for the added listings until referenced guidelines, exceptions and cycle-specific notices are checked. No benefit amounts are proposed for automatic totals yet.

| Programme | Observed official conditions | Missing application data or evidence | Proposed implementation |
|---|---|---|---|
| Tamil Nadu BC/MBC/DNC college assistance | Course and institution determine rules: the published table distinguishes government/aided UG degrees, diplomas, professional courses and other post-matric courses. Some branches have no income ceiling; others use ₹2.5 lakh and first-graduate conditions. | Exact course branch, institution type, government-quota admission, first-graduate/diploma status, domicile and current notification | Separate course branches rather than one generic college-income gate. Unknown branch yields “more information needed”. [Department source](https://bcw.tn.gov.in/sub_page/8) |
| West Bengal SVMCM | General family-income ceiling ₹2.5 lakh has named exceptions. Merit thresholds differ: 60% for several school/UG paths, 53% for general PG, 55% for technical PG; K3 has separate conditions. Regular study, institution/board and concurrent scholarship restrictions matter. | Precise qualifying marks basis, board/university, course, institution state, fresh/renewal status, K3/topper/research exceptions. Page contains 2025 qualifying-year references, so 2026 cycle must be confirmed. | Course-specific rules and explicit exceptions; never apply one marks threshold or general stacking permission to every applicant. [Official guidelines page](https://svmcm.wb.gov.in/page/about.php) |
| Gujarat SC post-matric BCK-6.1 | Department specifies SC status, ₹2.5 lakh ceiling and compliance with the referenced Government of India post-matric guidelines. Fees and academic allowance depend on course group and residential status. | Full referenced guideline and subsequent amendments, recognised course/institution, course group, hosteller/day-scholar status and current cycle | Keep the listing as information-only until the referenced guideline is reviewed; then implement separate eligibility and benefit calculations. [Department source](https://sje.gujarat.gov.in/DSCW/schemes/1521?lang=English) |
| Haryana SC/BC post-matric | Official table specifies Haryana domicile, annual income ≤₹2.5 lakh, attendance ≥75%, SC or BC and government/aided/SFC institutions. It links separate scheme documents. | Exact scheme-document conditions, qualifying course, category certificate, attendance period, recognised institute and fresh/renewal rules | Separate SC and BC programmes; preserve state-specific BC rather than automatically relabelling it OBC. [Official eligibility table](https://harchhatravratti.highereduhry.ac.in/Eligibility) |
| Maharashtra SC post-matric | Scheme page specifies SC/Navbouddha, Maharashtra residence, matriculation and income ≤₹2.5 lakh; failure history and professional-course limits affect assistance. Portal notice directs 2026–27 applications to MahaDBT 2.0. | Current GO/amendments, previous failures, professional-course history, course group, hostel status, institute and cycle confirmation | Keep old information source and current application route separate; implement eligibility without guaranteeing maintenance amounts before rate verification. [Official scheme page](https://mahadbt.maharashtra.gov.in/SchemeData/SchemeData?str=E9DDFA703C38E51ACE99921E698B1EE85995B38445F14746E1B0DD7E66FFF88B) |

## Proposed fields to add to the existing form

| Field | Why it is needed |
|---|---|
| Exact annual family income in rupees and declared period | Published thresholds must be compared precisely; monthly values must be explicitly annualised |
| Certified domicile state and institution state | Studying in a state is not proof of domicile |
| Course name, stage, year and fresh/renewal status | Rules vary by course and application path |
| Institution type, recognition and admission quota | Government, aided, self-financing and government-quota conditions differ |
| Qualifying marks basis, board/university and passing year | Percentage, percentile, honours marks and aggregate marks are distinct |
| Attendance with its relevant period | Required by the Haryana table and potentially other specific guidelines |
| Existing scholarship/stipend and its benefit type | Combination restrictions must follow the programme's own rules |
| Hosteller/day-scholar and exceptional flags | Used only where the verified programme requires them |

Do not request every field from every student. Ask only for the missing facts required by the relevant verified rule. Results should distinguish **meets reviewed conditions**, **fails a stated condition**, and **more information needed**; none guarantees selection or payment.

The user approved conditional additional questions on 9 October 2026: ask only when important for accurate matching. The first implementation checks selected published necessary conditions for Tamil Nadu, Maharashtra, Gujarat and Haryana. It asks progressively, validates and reuses answers, and keeps full eligibility matching disabled for the new directory records. West Bengal remains pending current-cycle evidence. See IMPLEMENTATION_REVIEW.md for implemented fields and validation. The broader table above remains a proposal; not every listed field has been added.
