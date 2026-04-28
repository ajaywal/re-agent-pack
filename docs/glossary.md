# Glossary — Code Identifiers and Business Terms

Canonical plain-English definitions for the code identifiers, system names, and integration terms that appear in the TrackAll sample source and in the extracted rule cards. Use this file when writing the `Plain-English` field of a rule card, when explaining a term in the FRD, or when a stakeholder asks "what does this code mean?"

Every entry below is grounded in the sample source files under `sample-project/`. If a new term appears that is not in this glossary, add it here before using it in a client-facing document.

---

## Legacy data identifiers

| Code identifier | Plain-English term | Where it appears | Meaning |
|---|---|---|---|
| `CLTMNT` | "Client Maintenance routing code" | `TmeGatewayAdapter.cpp` | Default gateway message name used when a client has no routing configuration. **Placeholder value** — real production identifiers differ. |
| `QREQ` | "Quote Request routing mnemonic" | `TmeGatewayAdapter.cpp` | Default gateway mnemonic paired with `CLTMNT` for quote requests. **Placeholder value** — real production identifiers differ. |
| `QUOTE_REQD` | "Quote required flag" | `LoanRules.cpp`, loan records | A flag on a loan's cycle configuration indicating whether a premium quote must be obtained before the loan result is displayed. `Y` = required, `N` = not required. |
| `FCI_CODE` | "Servicer identifier code" | `EDINotificationWriter.cpp`, loan records | A code on each loan identifying the entity servicing the loan. The prefix of this code determines how the outbound EDI notification is formatted. |
| `CYCLE_TYPE` | "Cycle category" | `LoanRules.cpp` | Categorises a client's workflow cycle (e.g. Mortgage, Non-Mortgage). Paired with `Step` to form a full workflow stage. |
| `Cycle` | "Workflow cycle" | Client records, loan records | A named stage in the client's workflow. Paired with a `Step` to represent a precise position in the workflow. Implementation in the sample uses string codes; real production may use FK references. |
| `Step` | "Workflow step" | Client records, loan records | A sub-stage within a `Cycle`. Together they identify where in the workflow a client or loan currently sits. |

---

## External systems and integrations

| Term | Plain-English description | Role in the system |
|---|---|---|
| **Tandem** (also HP NonStop) | A high-availability back-end platform running COBOL programs. | Hosts the legacy master data (client records, loan records) and the TKA900 processing programs. |
| **TmeGatewayAdapter** | "Tandem message gateway" | Adapter that packages and routes requests to Tandem COBOL programs using a message name + mnemonic envelope. |
| **RataBase** (also RataBaseServiceAdapter) | "Premium rating service" | External service that returns premium estimates given a loan's characteristics. Called when `QUOTE_REQD` indicates a quote is needed. |
| **Black Knight** | "Black Knight servicer format" | A specific mortgage-servicer organisation. Requires fixed-width format for EDI notifications. Identified by an `FCI_CODE` beginning with `BK`. |
| **SSP** | "Standard Servicer Protocol format" | A delimited EDI format used by non-Black Knight servicers. |
| **14E EDI** | "Placement notification" | The specific outbound EDI message type sent when a loan is placed with a servicer. Format depends on the servicer type. |
| **TKA900** | "TrackAll Tandem loan search program" | The COBOL program (`sample-project/tandem/TKA900.cbl`) that executes loan search and cycle-step query logic on the Tandem back-end, triggered via the `LOAN_SEARCH` mnemonic. |
| **TKA920** | "TrackAll Tandem EDI dispatch program" | The COBOL program that processes outbound 14E EDI notifications on the Tandem back-end, triggered via the `14E_NOTIFY` mnemonic. |
| **AIP930** | "Kentucky ISO advisory service" | The Tandem program that provides ISO information required for Kentucky state premium quotes, called via the `KY_ISO_QUERY` mnemonic before the RataBase rating call. |
| **LSS001T** | "Loan servicing routing table" | The SQL/MP routing table that maps TME mnemonic names (`LOAN_SEARCH`, `14E_NOTIFY`, `KY_ISO_QUERY`) to their target Tandem COBOL program names. Loaded at startup by `CTMELibAdapter::LoadRoutingTable`. |
| **LSS_SCHEMA** | "Loan servicing schema" | SQL/MP DDL defining the legacy loan servicing tables (`sample-project/tandem/LSS_SCHEMA.sql`). |

---

## Grounding labels (also defined in `docs/AGENT_OPERATING_RULES.md`)

| Label | Meaning |
|---|---|
| `[SG]` / `code-grounded` | Direct code evidence — reliable. |
| `[SG-influenced]` / `source-grounded` | Source-pack grounded but unconfirmed against real schema. |
| `[inferred]` | Reasoned from context — mark clearly; do not promote to fact. |
| `[placeholder]` | Sample-only values (e.g. `CLTMNT`, `QREQ`). Never present as production facts. |
| `[SD]` / `sample-only` | Synthetic/illustration label — clearly marked. |

---

## How to use this glossary

1. **Before writing a `Plain-English` rule field** — check whether the rule uses any term in this table. Use the plain-English term from the middle column instead of the code identifier.
2. **Before introducing a new term** in a client-facing document — add it here first with a grounded definition.
3. **When reviewing** (reviewer agent Mode 1) — cross-check `Plain-English` fields against this glossary; any unresolved code identifier in a `Plain-English` field is a rewrite candidate.

