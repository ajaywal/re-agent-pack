# Rule Coverage Checklist

Use this checklist before declaring the slice sufficiently reverse-engineered.
Counters show actual / estimated totals. Estimated totals are set by the project-scanner.
Each analysis agent updates the actual count as it completes its work.

## UI Coverage
- [x] All visible screens in scope have been reviewed (3 / ~3 estimated)
- [x] All material controls have field/control entries (31 / ~31 estimated)
- [x] All important buttons/actions have been mapped (5 / ~5 estimated)
- [x] Visible labels have been interpreted carefully

## Event Coverage
- [x] All primary user flows have been traced (3 / ~3 estimated)

## Rule Coverage
- [x] Validation rules extracted (9 / ~9 estimated)
- [x] State/routing rules extracted (3 / ~3 estimated)
- [x] Persistence/audit rules extracted (1 / ~1 estimated)
- [x] Integration/gateway rules extracted (1 / ~1 estimated)

## Dependency Coverage
- [x] All service layers traced (5 / ~5 estimated)
- [x] All external integrations identified (6 / ~6 estimated)
- [x] All candidate APIs estimated (4 / ~4 estimated)

## Coverage gap scan
- [x] Coverage gap scan run (rule-extractor Step 3)
- [x] All flagged functions reviewed and either have rule cards or are confirmed out of scope

## Notes
- Coverage gap scan keywords used: `validate|check|enforce|require|block|reject|audit|must|cannot|forbidden` over `sample-project/src/**/*.{cpp,h}` and tandem validation files.
- Rule card count: 14 Active (R-L-001 to R-L-014).
- Grounding review (Step 5) complete: 12 Standard, 2 Priority (`R-L-008`, `R-L-014`).
- Open ambiguities after review: `A-001`, `A-002`.
