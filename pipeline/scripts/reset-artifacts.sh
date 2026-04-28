#!/bin/bash
# reset-artifacts.sh
# Restores pipeline artifacts to the baseline state so the workflow can be run from scratch.
#
# Three modes:
#   --full              Resets everything (analysis artifacts + governance).
#                       Use this to run from Step 1.
#
#   --governance        Resets governance files only (rule register, ambiguity log,
#                       rerun log, coverage checklist). Analysis artifacts are kept.
#                       Use this to replay Step 5 (governance review + Review Priority
#                       stamping) with stable, predictable content.
#
#   --save-as-baseline  Saves the current artifacts/ state as the new baseline.
#                       Use this after a successful pipeline run to checkpoint
#                       your project's own artifacts for future resets.
#
# Usage:
#   bash pipeline/scripts/reset-artifacts.sh --full
#   bash pipeline/scripts/reset-artifacts.sh --governance
#   bash pipeline/scripts/reset-artifacts.sh --save-as-baseline
#   bash pipeline/scripts/reset-artifacts.sh          (prompts you to choose)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASELINE_DIR="$SCRIPT_DIR/../baseline"
ARTIFACTS_DIR="$SCRIPT_DIR/../../artifacts"
FINAL_OUTPUT_DIR="$SCRIPT_DIR/../../docs/final_output"

MODE="$1"

echo ""
echo "RE Agent Pack — Artifact Reset"
echo "============================================"
echo ""

# If no argument given, prompt
if [[ -z "$MODE" ]]; then
    echo "Choose mode:"
    echo ""
    echo "  1) --governance        Reset rule register + governance files only"
    echo "                         Resume from Step 5 (predictable content)"
    echo ""
    echo "  2) --full              Reset everything including analysis artifacts"
    echo "                         Resume from Step 1 (agents regenerate content each run)"
    echo ""
    echo "  3) --save-as-baseline  Save current artifacts as the new baseline"
    echo "                         Use after a successful run to checkpoint your project"
    echo ""
    read -p "Enter 1, 2, or 3: " choice
    case "$choice" in
        1) MODE="--governance" ;;
        2) MODE="--full" ;;
        3) MODE="--save-as-baseline" ;;
        *) echo "Invalid choice. Reset cancelled."; exit 1 ;;
    esac
fi

# --save-as-baseline: copy current artifacts to baseline
if [[ "$MODE" == "--save-as-baseline" ]]; then
    echo "Saving current artifacts as baseline..."
    echo ""
    cp "$ARTIFACTS_DIR/rule_register.governance.md"           "$BASELINE_DIR/rule_register.governance.md"           && echo "  ✓ rule_register.governance.md"
    cp "$ARTIFACTS_DIR/ambiguity_log.governance.md"           "$BASELINE_DIR/ambiguity_log.governance.md"           && echo "  ✓ ambiguity_log.governance.md"
    cp "$ARTIFACTS_DIR/re_run_log.governance.md"              "$BASELINE_DIR/re_run_log.governance.md"              && echo "  ✓ re_run_log.governance.md"
    cp "$ARTIFACTS_DIR/rule_coverage_checklist.governance.md" "$BASELINE_DIR/rule_coverage_checklist.governance.md" && echo "  ✓ rule_coverage_checklist.governance.md"
    cp "$ARTIFACTS_DIR/session_state.governance.md"           "$BASELINE_DIR/session_state.governance.md"           && echo "  ✓ session_state.governance.md"
    cp "$ARTIFACTS_DIR/source_checksums.governance.md"        "$BASELINE_DIR/source_checksums.governance.md"        && echo "  ✓ source_checksums.governance.md"
    cp "$ARTIFACTS_DIR/generated_screen_inventory.md"         "$BASELINE_DIR/generated_screen_inventory.md"         2>/dev/null && echo "  ✓ generated_screen_inventory.md"
    cp "$ARTIFACTS_DIR/field_dictionary.md"                   "$BASELINE_DIR/field_dictionary.md"                   2>/dev/null && echo "  ✓ field_dictionary.md"
    cp "$ARTIFACTS_DIR/reverse_engineering_report.md"         "$BASELINE_DIR/reverse_engineering_report.md"         2>/dev/null && echo "  ✓ reverse_engineering_report.md"
    cp "$ARTIFACTS_DIR/screen_action_api_estimation.md"       "$BASELINE_DIR/screen_action_api_estimation.md"       2>/dev/null && echo "  ✓ screen_action_api_estimation.md"
    cp "$ARTIFACTS_DIR/service_decomposition.md"              "$BASELINE_DIR/service_decomposition.md"              2>/dev/null && echo "  ✓ service_decomposition.md"
    cp "$ARTIFACTS_DIR/traceability_matrix.md"                "$BASELINE_DIR/traceability_matrix.md"                2>/dev/null && echo "  ✓ traceability_matrix.md"
    echo ""
    echo "Baseline saved. Future --full and --governance resets will restore this state."
    echo ""
    exit 0
fi

# Validate mode
if [[ "$MODE" != "--full" && "$MODE" != "--governance" ]]; then
    echo "Unknown mode: $MODE"
    echo "Usage: bash pipeline/scripts/reset-artifacts.sh [--full | --governance | --save-as-baseline]"
    exit 1
fi

# Confirm and describe what will happen
if [[ "$MODE" == "--governance" ]]; then
    echo "Mode: governance reset"
    echo ""
    echo "Will restore:"
    echo "  - artifacts/rule_register.governance.md   (rules → Active, Review Priority cleared)"
    echo "  - artifacts/ambiguity_log.governance.md"
    echo "  - artifacts/re_run_log.governance.md"
    echo "  - artifacts/rule_coverage_checklist.governance.md"
    echo "  - artifacts/session_state.governance.md         (cleared to baseline)"
    echo "  - artifacts/source_checksums.governance.md      (cleared to baseline)"
    echo "  - docs/final_output/                            (all 8 deliverables deleted — prevents append-on-rerun)"
    echo ""
    echo "Will NOT touch:"
    echo "  - Analysis artifacts (screen inventory, field dictionary, rules report, etc.)"
    echo ""
    echo "NOTE: After reset, run 'bash pipeline/scripts/update-checksums.sh' to re-populate checksums."
    echo ""
    echo "Resume point: Step 5 — reviewer (grounding review + Review Priority stamping)"
else
    echo "Mode: full reset"
    echo ""
    echo "Will restore:"
    echo "  - All governance files (rule register reset to Active, Review Priority cleared)"
    echo "  - artifacts/session_state.governance.md         (cleared to baseline)"
    echo "  - artifacts/source_checksums.governance.md      (cleared to baseline)"
    echo "  - All analysis artifacts (screen inventory, field dictionary, rules report,"
    echo "    screen/action/API estimation, service decomposition, traceability matrix)"
    echo "  - docs/final_output/                            (all 8 deliverables deleted — prevents append-on-rerun)"
    echo ""
    echo "NOTE: When you run from Step 1, agents will read the source code and"
    echo "regenerate the analysis artifacts. Output will be valid but may vary"
    echo "slightly in phrasing each time."
    echo ""
    echo "Resume point: Step 1 — analysis planner"
fi

echo ""
read -p "Are you sure? This will overwrite any changes since the last reset. (y/N): " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Reset cancelled."
    exit 0
fi

echo ""

# Always reset governance files
cp "$BASELINE_DIR/rule_register.governance.md"     "$ARTIFACTS_DIR/rule_register.governance.md"     && echo "  ✓ rule_register.governance.md"
cp "$BASELINE_DIR/ambiguity_log.governance.md"           "$ARTIFACTS_DIR/ambiguity_log.governance.md"           && echo "  ✓ ambiguity_log.governance.md"
cp "$BASELINE_DIR/re_run_log.governance.md"              "$ARTIFACTS_DIR/re_run_log.governance.md"              && echo "  ✓ re_run_log.governance.md"
cp "$BASELINE_DIR/rule_coverage_checklist.governance.md" "$ARTIFACTS_DIR/rule_coverage_checklist.governance.md" && echo "  ✓ rule_coverage_checklist.governance.md"
cp "$BASELINE_DIR/session_state.governance.md"           "$ARTIFACTS_DIR/session_state.governance.md"           && echo "  ✓ session_state.governance.md"
cp "$BASELINE_DIR/source_checksums.governance.md"        "$ARTIFACTS_DIR/source_checksums.governance.md"        && echo "  ✓ source_checksums.governance.md"

# Clear final_output so Step 7 writes each file fresh (prevents append-on-rerun duplication)
if [[ -d "$FINAL_OUTPUT_DIR" ]]; then
    rm -f "$FINAL_OUTPUT_DIR"/*.md "$FINAL_OUTPUT_DIR"/*.json 2>/dev/null
    echo "  ✓ docs/final_output/ cleared"
fi

# Full reset also restores analysis artifacts
if [[ "$MODE" == "--full" ]]; then
    cp "$BASELINE_DIR/generated_screen_inventory.md"   "$ARTIFACTS_DIR/generated_screen_inventory.md"   && echo "  ✓ generated_screen_inventory.md"
    cp "$BASELINE_DIR/field_dictionary.md"             "$ARTIFACTS_DIR/field_dictionary.md"             && echo "  ✓ field_dictionary.md"
    cp "$BASELINE_DIR/reverse_engineering_report.md"   "$ARTIFACTS_DIR/reverse_engineering_report.md"   && echo "  ✓ reverse_engineering_report.md"
    cp "$BASELINE_DIR/screen_action_api_estimation.md" "$ARTIFACTS_DIR/screen_action_api_estimation.md" && echo "  ✓ screen_action_api_estimation.md"
    cp "$BASELINE_DIR/service_decomposition.md"        "$ARTIFACTS_DIR/service_decomposition.md"        && echo "  ✓ service_decomposition.md"
    cp "$BASELINE_DIR/traceability_matrix.md"          "$ARTIFACTS_DIR/traceability_matrix.md"          && echo "  ✓ traceability_matrix.md"
fi

echo ""

if [[ "$MODE" == "--governance" ]]; then
    echo "Reset complete. Governance files and session state restored. Rules are Active with Review Priority cleared."
    echo ""
    echo "Resume at Step 5 — see pipeline/GUIDE.md"
else
    echo "Reset complete. All artifacts and session state restored to baseline. Rules are Active with Review Priority cleared."
    echo ""
    echo "Resume at Step 1 — see pipeline/GUIDE.md"
fi

echo ""
