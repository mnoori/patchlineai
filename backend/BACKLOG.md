# Patchline AI – Backend Backlog

> Last updated: <!--CURSOR-->

## Pending approvals / external blockers

- [ ] **Public GraphQL Sync API approval** – request submitted to AWS; re-check weekly. If declined, explore AppSync subscriptions or custom WebSocket layer.

## Authentication & Identity

- [ ] **Google (and other social) identity provider support**  
  – Register OAuth client(s) in Google Cloud, configure Cognito IdP, update `aws-exports.ts`, add Google sign-in button.

## Internal "GOD-mode" branch

- [ ] Cut `god-mode` branch and create isolated Amplify env `admin`  
  – Lock down with Cognito group `SuperAdmin`, sub-domain `admin.patchline.ai`.

### Agent 01 – AI HR Recruiter
- [ ] Seed-input UI & CSV upload
- [ ] Scraper Lambda (Playwright + proxy rotation) → S3 HTML snapshots
- [ ] GPT extraction → JSON → DynamoDB  
- [ ] Vector embeddings → Pinecone
- [ ] Scoring agent + nightly Step Function run
- [ ] Admin dashboard table & Slack digest

## Dev Ops / Infrastructure

- [ ] Evaluate move of DNS from GoDaddy to **Route 53** to gain root ALIAS support and unified IaC.
- [ ] Introduce **AWS Step Functions** (or Temporal) as workflow orchestrator for agents.

## Integrations & Automations

- [ ] Slack OAuth integration for internal notifications
- [ ] Email sequencing (SES) for candidate outreach once GDPR policy drafted

## Documentation

- [ ] Expand `ARCHITECTURE.md` with updated agent framework diagram
- [ ] Create investor-facing KPI dashboard mock-ups

---

Feel free to append items in PRs – keep this list single-source-of-truth for upcoming backend work. 