# Legacy / Quarantined Files

This directory contains scripts or data files that are no longer part of the active build & deploy path but are kept in-repo for reference.  Anything here **MUST NOT** be invoked by CI/CD.

If you discover that a quarantined file is still required, move it back to its original location and add that path to `docs/BUILD_SCRIPTS.md`.

---

### Lambda cleanup batch moved on 2025-06-08

**Incorrect naming convention (replaced with correct versions):**
• `lambda/scoutactions-openapi.json` → replaced by `scout-actions-openapi.json`
• `lambda/blockchainactions-openapi.json` → replaced by `blockchain-actions-openapi.json`  
• `lambda/contractanalysis-openapi.json` → replaced by `legal-actions-openapi.json`

**Backup/duplicate files:**
• `lambda/gmail-action-handler-backup.py` – outdated backup of handler logic
• `lambda/gmail-action-handler-fixed.py` – another backup version
• `lambda/gmail-action-handler.py.zip` – compressed backup

**Naming convention established:**
- Lambda handlers: `{agent}-action-handler.py`
- OpenAPI schemas: `{agent}-actions-openapi.json` (note: "actions" is plural, with dash)

### Scripts cleanup batch moved on 2025-06-08

**Test/debug scripts moved to legacy/scripts/:**
• `test-agent-fix.py` – one-off test script
• `test-agent-config.py` – configuration test script  
• `manage-agents.py` – duplicate of functionality in clean-and-rebuild-agents.py
• `manage-bedrock-agents.ts` – TypeScript version (Python version is canonical)
• `generate-agents.js` – old JavaScript generator
• `generate-agents.ts` – old TypeScript generator

**Test/debug scripts moved to legacy/backend/scripts/:**
• `test-*.py` (20+ files) – various one-off test scripts
• `debug-*.py` – debugging utilities
• `diagnose-*.py` – diagnostic scripts
• `recreate-agent-complete.py` – duplicate of clean-and-rebuild-agents.py
• `deploy-lambda-functions-enhanced.py` – duplicate of manage-lambda-functions.py
• `*.log` files – old deployment logs

**Files kept in active codebase (see docs/BUILD_SCRIPTS.md):**
✅ Core orchestration: `rebuild_everything.py`, `clean-and-rebuild-agents.py`
✅ Lambda management: `backend/scripts/manage-lambda-functions.py`
✅ Agent creation: `backend/scripts/create-bedrock-agent.py`
✅ Collaboration setup: `setup-collaborations.py` 