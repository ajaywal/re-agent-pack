Paste this entire file into any AI (Claude, ChatGPT, Gemini, Copilot) and use this instruction:

"Generate five publication-quality Word documents from this content:
  1. Reverse-Engineered Business Requirements
  2. Reverse-Engineered Technical Specification
  3. Current State Architecture Flow (render all Mermaid diagrams as embedded images)
  4. Modern Stack Architecture Flow (render all Mermaid diagrams as embedded images)
  5. Forward Engineering Modernization Blueprint

Apply the Document Styling Specification below to each document before rendering.
Apply clean professional formatting to each: title page, table of
contents, well-laid-out tables, polished section hierarchy, consistent
heading styles, proper code-block and diagram rendering.

Save the five Word files as:
  Reverse_Engineered_Business_Requirements.docx
  Reverse_Engineered_Technical_Specification.docx
  Current_State_Architecture_Flow.docx
  Modern_Stack_Architecture_Flow.docx
  Forward_Engineering_Modernization_Blueprint.docx

Before finishing, quickly confirm each Word document includes:
- every rule ID from its source section (R-L-001 through R-L-NNN, and
  any UI-NNN / SVC-NNN / DB-NNN spec IDs in the Blueprint)
- the Review Priority label (Priority or Standard) next to each rule
  in the Business Requirements and Technical Specification
- every grounding label ([SG], [SG-influenced], [inferred], [placeholder])
- the Open Items / Ambiguities section with original IDs
- the Traceability Summary / cross-reference tables with one row per rule
- all sections in Current State Architecture Flow (§1 Current State System Context,
  §2 Business Process Flows, §3 Technical Dependency Flows, §5 Integration Map)
- all sections in Modern Stack Architecture Flow (§1.2 Target State System Context,
  §4 Service Boundary Map, §5 Integration Map with Modern Target column,
  §6 Architecture Decision Prompts, §7 Legacy → Modern Mapping)
- Part 0 (Vertical Slice walkthrough) and per-SVC error-response
  contracts in the Blueprint
- color styling applied per the Document Styling Specification section
  (navy table headers, amber/green Review Priority badges, navy H1/H2 headings,
  red Open Items callout)

If any of those items are missing from your draft, add them back
before returning the final documents."

## Document Styling Specification — Apply to All Word Documents

Apply the following color palette and style rules consistently across all five Word documents
generated from this handoff. These are the canonical styles for this document set — do not
substitute with defaults.

### Color Palette

| Token | Hex     | Apply To |
|-------|---------|----------|
| Navy  | #0c2554 | H1, H2, H3 headings; table header row backgrounds; title page background |
| Amber | #f0a500 | Review Priority "Priority" badge background; H3 accent color; callout left border |
| Green | #1a7a4a | Review Priority "Standard" badge background; approved / confirmed status labels |
| Teal  | #0d7377 | DB/storage reference labels; Integration Map "Legacy System" column header |
| Blue  | #1e73be | API/service reference labels; SVC-NNN spec identifier badges |
| Red   | #c0392b | Open Items section heading; warning callout boxes; unresolved ambiguity labels |

### Word Style Mapping

| Word Style Name   | Color           | Apply To |
|-------------------|-----------------|----------|
| Heading 1         | #0c2554 bold    | Document section H1 (e.g. "1. Introduction") |
| Heading 2         | #0c2554         | Sub-section H2 |
| Heading 3         | #0c2554         | Sub-sub-section H3 |
| Table Header      | Background #0c2554, text white | All table header rows |
| Priority Badge    | Background #f0a500, text #0c2554 | Inline "Priority" label in Review Priority column |
| Standard Badge    | Background #1a7a4a, text white   | Inline "Standard" label in Review Priority column |
| Code Inline       | Background #f5f7fb, monospace    | Inline code spans (file::function, rule IDs) |
| Open Item Callout | Left border #c0392b              | Open Items / Ambiguities section callout boxes |
| DB Reference      | Text #0d7377    | Any cell or label identifying a database table or schema |
| API Reference     | Text #1e73be    | Any cell or label identifying an API endpoint or service |

### Application Instructions

1. Apply Navy (#0c2554) as the background color on all table header rows. Use white text on navy backgrounds.
2. In Business Rules Register and Traceability Summary tables, render the Review Priority cell as
   a filled badge: amber background for "Priority", green background for "Standard".
3. In the Blueprint, render SVC-NNN identifiers in blue (#1e73be) and DB-NNN identifiers in teal (#0d7377).
4. Render all Open Items / Ambiguities sections with a red (#c0392b) left border or callout treatment.
5. Title page: navy (#0c2554) background, white heading text, amber (#f0a500) accent line under the document title.
6. If the target AI tool cannot apply inline hex colors, fall back to the nearest named Word theme color
   and note the deviation — do not skip the styling attempt.

## Project Context
- Project Name: TrackAllLoanMaintenanceLegacy
- Company / Client: Assurant
- Subdomain in Scope: Loan Maintenance (Search, Add, Modify, quote orchestration, 14E dispatch)
- Legacy Stack: VC++ MFC, HP NonStop/Tandem COBOL + SQL/MP, TME routing
- Modernisation Target: Angular web UI + .NET Core REST APIs + Azure SQL
- Active Rules range: R-L-001 to R-L-014
- Open Ambiguities range: A-001 to A-002

## BEGIN DOCUMENT: Reverse-Engineered Business Requirements
(Use the complete content from docs/final_output/Reverse_Engineered_Business_Requirements.md verbatim.)

Diagram suggestion callout: Render the Section 2.4 current-state Mermaid as a full-width architecture image with labeled subgraphs and legible edge labels.

## END DOCUMENT: Reverse-Engineered Business Requirements

## BEGIN DOCUMENT: Reverse-Engineered Technical Specification
(Use the complete content from docs/final_output/Reverse_Engineered_Technical_Specification.md verbatim.)

Diagram suggestion callout: Where rule and dependency tables are dense, render tables in landscape orientation for readability.

## END DOCUMENT: Reverse-Engineered Technical Specification

## BEGIN DOCUMENT: Current State Architecture Flow
(Use the complete content from docs/final_output/Current_State_Architecture_Flow.md verbatim.)

Diagram suggestion callout: Render each Mermaid diagram as a separate figure with caption naming section and flow.

## END DOCUMENT: Current State Architecture Flow

## BEGIN DOCUMENT: Modern Stack Architecture Flow
(Use the complete content from docs/final_output/Modern_Stack_Architecture_Flow.md verbatim.)

Diagram suggestion callout: Render Section 7 mapping diagram across a full page with side-by-side Legacy and Modern visual grouping.

## END DOCUMENT: Modern Stack Architecture Flow

## BEGIN DOCUMENT: Forward Engineering Modernization Blueprint
(Use the complete content from docs/final_output/Forward_Engineering_Modernization_Blueprint.md verbatim.)

Diagram suggestion callout: Preserve code fences exactly; do not convert scaffold code blocks into prose.

## END DOCUMENT: Forward Engineering Modernization Blueprint
