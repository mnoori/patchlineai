# Patchline – Authoritative Build & Deployment Scripts

The following scripts form the *golden path* for local development and CI/CD.  Anything **not** on this list is considered non-critical and is subject to quarantine in `legacy/`.

## Top-level orchestration

| Purpose | Path |
|---------|------|
| Rebuild full infra (lambdas + agents + collaborations) | `scripts/rebuild_everything.py` |
| Rebuild agents only | `scripts/rebuild_agents.py` |

## Lambda management

| Purpose | Path |
|---------|------|
| Deploy / recreate Lambda functions | `backend/scripts/manage-lambda-functions.py` |

## Agent utilities

| Purpose | Path |
|---------|------|
| Create a single Bedrock agent (called internally) | `backend/scripts/create-bedrock-agent.py` |
| (deprecated) Set up collaborations for supervisor | `scripts/setup-collaborations.py` |

## One-off helpers (still supported)

| Purpose | Path |
|---------|------|
| Deploy only the Scout Lambda (Windows) | `scripts/deploy-scout-lambda.ps1` |
| Deploy all Lambdas (PowerShell) | `scripts/deploy-all.ps1` |

---

If you add a new script that is meant to be run by other developers or CI, **add it here** in the same PR.  CI fails if a referenced path does not exist. 