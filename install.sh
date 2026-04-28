#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# RE Agent Pack — Installer
# Usage: curl -sSL https://raw.githubusercontent.com/OWNER/re-agent-pack/main/install.sh | bash
# Run this from the root of the project you want to install into.
# Existing agent files and Copilot instructions are never overwritten.
# ─────────────────────────────────────────────────────────────

REPO_RAW="https://raw.githubusercontent.com/sasCapDev/re-agent-pack/main"
TARGET="$(pwd)"

# ── Colour helpers ────────────────────────────────────────────
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
CYAN="\033[0;36m"
RESET="\033[0m"
BOLD="\033[1m"

INSTALLED=()
SKIPPED=()

echo ""
echo -e "${BOLD}RE Agent Pack — Installer${RESET}"
echo "─────────────────────────────────────────"
echo -e "Installing into: ${CYAN}$TARGET${RESET}"
echo ""

# ── Check for curl or wget ────────────────────────────────────
if command -v curl &>/dev/null; then
  fetch() { curl -fsSL --ssl-no-revoke "$1"; }
elif command -v wget &>/dev/null; then
  fetch() { wget -qO- "$1"; }
else
  echo "Error: curl or wget is required to run this installer."
  exit 1
fi

# ── Helper: install a file only if it does not already exist ──
install_file() {
  local src="$1"   # path relative to repo root
  local dest="$2"  # full destination path

  if [ -f "$dest" ]; then
    SKIPPED+=("$dest")
    echo -e "  ${YELLOW}skipped${RESET}  $dest  (already exists — not overwritten)"
  else
    fetch "$REPO_RAW/$src" > "$dest"
    INSTALLED+=("$dest")
    echo -e "  ${GREEN}✓${RESET} $dest"
  fi
}

# ── Create directories ────────────────────────────────────────
mkdir -p "$TARGET/.github/agents"
mkdir -p "$TARGET/artifacts"
mkdir -p "$TARGET/docs/final_output"
mkdir -p "$TARGET/pipeline/scripts"
mkdir -p "$TARGET/pipeline/baseline"

# ── Agent files ───────────────────────────────────────────────
echo "Agents:"
AGENTS=(
  "project-scanner.agent.md"
  "analysis-planner.agent.md"
  "screen-analyzer.agent.md"
  "rule-extractor.agent.md"
  "dependency-mapper.agent.md"
  "reviewer.agent.md"
  "document-publisher.agent.md"
)

for agent in "${AGENTS[@]}"; do
  install_file ".github/agents/$agent" "$TARGET/.github/agents/$agent"
done

# ── Copilot workspace instructions ────────────────────────────
echo ""
echo "Copilot instructions:"
install_file ".github/copilot-instructions.md" "$TARGET/.github/copilot-instructions.md"

# ── Pipeline guide ────────────────────────────────────────────
echo ""
echo "Pipeline guide:"
install_file "pipeline/GUIDE.md" "$TARGET/pipeline/GUIDE.md"

# ── Agent operating rules ─────────────────────────────────────
echo ""
echo "Agent operating rules:"
install_file "docs/AGENT_OPERATING_RULES.md" "$TARGET/docs/AGENT_OPERATING_RULES.md"

# ── Scripts ───────────────────────────────────────────────────
echo ""
echo "Scripts:"
install_file "pipeline/scripts/update-checksums.sh" "$TARGET/pipeline/scripts/update-checksums.sh"
install_file "pipeline/scripts/reset-artifacts.sh"  "$TARGET/pipeline/scripts/reset-artifacts.sh"
install_file "pipeline/scripts/package.json"        "$TARGET/pipeline/scripts/package.json"

# ── Summary ───────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────"

if [ ${#INSTALLED[@]} -gt 0 ]; then
  echo -e "${BOLD}${GREEN}Installed:${RESET} ${#INSTALLED[@]} file(s)"
fi

if [ ${#SKIPPED[@]} -gt 0 ]; then
  echo -e "${BOLD}${YELLOW}Skipped:${RESET}   ${#SKIPPED[@]} file(s) already existed and were not touched"
fi

if [ ${#INSTALLED[@]} -eq 0 ]; then
  echo ""
  echo "Nothing to install — all RE Agent Pack files are already present."
  echo ""
  exit 0
fi

echo ""
echo -e "${BOLD}Next step — run the project scanner:${RESET}"
echo ""
echo "  1. Open this folder in VS Code"
echo "  2. Open GitHub Copilot chat"
echo "  3. Select agent: ${CYAN}project-scanner${RESET}"
echo "  4. Paste this prompt:"
echo ""
echo -e "     ${CYAN}Scan this project workspace and generate RE_AGENTS_CONFIG.md.${RESET}"
echo ""
echo "  The agent will read your codebase and auto-generate RE_AGENTS_CONFIG.md."
echo "  Review any [REVIEW: ...] fields it flags before moving to Step 1."
echo ""
echo -e "${BOLD}After RE_AGENTS_CONFIG.md is ready (Step 0):${RESET}"
echo ""
echo "  Run the source checksums script to baseline your source files:"
echo ""
echo -e "     ${CYAN}bash pipeline/scripts/update-checksums.sh${RESET}"
echo ""
echo "  This writes artifacts/source_checksums.governance.md, which the"
echo "  analysis-planner uses to detect changed files between runs."
echo ""
echo "  Full run order: pipeline/GUIDE.md"
echo ""
echo -e "${BOLD}Multi-subdomain note:${RESET}"
echo ""
echo "  If your codebase has 30+ dialog files, the project-scanner will"
echo "  automatically enter batch mode and generate:"
echo ""
echo "    RE_AGENTS_CONFIG_MASTER.md         — full subdomain index"
echo "    RE_AGENTS_CONFIG_{SubdomainName}.md — one config per subdomain group"
echo ""
echo "  Artifacts for each subdomain are written to artifacts/{SubdomainName}/"
echo "  and created dynamically by the pipeline — not by this installer."
echo "  Single-subdomain installs are unaffected: artifacts/ root layout is unchanged."
echo ""
echo "  See pipeline/GUIDE.md — Multi-subdomain workflow for the full run order."
echo "─────────────────────────────────────────"
echo ""
