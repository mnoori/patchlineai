# Simultaneous Frontend (v0) and Backend (Cursor) Development Workflow

This document outlines the agreed-upon workflow for developing Patchline AI with **v0.dev** (frontend) and **Cursor** (backend).

---

## 1. Use Git as the Source of Truth

1. v0 currently cannot push directly to external Git repos  export code manually.
2. Cursor work happens in feature branches  commit early & often.

---

## 2. Clear API Contracts

1. Define TypeScript interfaces for every endpoint / DTO.
2. Share these in /shared/types so both FE & BE import the same contracts.

---

## 3. Feature-Branch Workflow

1. **frontend/**  code synced from v0 in its own feature branch.
2. **backend/**  Cursor work in parallel feature branch.
3. PRs merge to main after review & CI pass.

---

## 4. Daily Development Cycle

| Time | Activity |
|------|----------|
| **Morning** | Pull main, review open PRs, plan tasks. |
| **Frontend (v0)** | Build UI with mock data conforming to shared types. Export & commit. |
| **Backend (Cursor)** | Implement endpoints & logic. Unit-test & commit. |
| **Integration** | Merge FE export  run locally, fix contract drift, push. |

---

## 5. Tooling

* **Mock API**  MSW / json-server for FE without BE.
* **Type Safety**  	sc --build over /shared/types.
* **CI**  lint, type-check, unit tests for both sides.
* **Env Management**  .env.local, .env.production, parameter store.

---

## Example Directory Layout

`	ext
/project-root
  frontend/          # Exported v0 code
  backend/           # Cursor backend
  shared/
    types/           # TypeScript contracts
    utils/
  developer-context/ # Docs like this one
  infra/             # CDK/Terraform
` 

---

_Last updated: 2025-05-15_ 

