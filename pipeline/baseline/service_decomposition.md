# Service Decomposition

Produced by dependency-mapper (Step 4). Proposes a candidate target service split based on the current analysis artifacts.

This is an estimation worksheet derived from legacy code analysis — not a final architecture decision.

## Candidate service groups

| Candidate service | Responsibilities | Related screens / actions | Related legacy evidence | Suggested APIs | Rationale for grouping | Confidence / ambiguity notes |
|---|---|---|---|---|---|---|

## Boundary stance

- Treat validation modules as internal domain logic first; do not split into separate deployable services unless source evidence shows a separately owned rules engine.
- Treat audit/logging as an internal sink first; do not add a read API unless the analysis specifically requires audit retrieval.
