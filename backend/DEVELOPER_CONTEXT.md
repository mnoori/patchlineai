# PatchlineAI – Developer Context

**Last updated:** July 2024

---

## 🟢 Current Backend State

1. **Amplify Project**
   - App name: `patchlineai`
   - App ID: `d40rmftf5h7p7`
   - Pulled env: **`staging`** (✔ local `amplify` folder now tracks this env)
2. **Installed SDKs**
   - `@aws-sdk/client-dynamodb`
   - `@aws-sdk/lib-dynamodb`
   - `@aws-sdk/util-dynamodb`
   - `uuid` & `@types/uuid`
   These resolve the linter errors in `lib/db.ts` and API routes.
3. **DynamoDB Tables**
   - **Users** table with primary key `userId`
   - **Embeds** table with partition key `userId` and sort key `embedId`
4. **API Routes**
   - `/api/user` for user data management (GET, POST, PUT)
   - `/api/embed` for embeds management (GET, POST)
5. **Platform Connection**
   - `PlatformConnectModal` component restored
   - Instagram OAuth flow (already scaffolded)
   - SoundCloud oEmbed proxy (already scaffolded)
6. **Local repo** sits at `C:\Users\mehdi\code\patchlinerepo`  
   (all CLI commands below assume that as the CWD)

---

## 🟢 Completed Tasks

| Task | Status | Details |
|------|--------|---------|
| **Add DynamoDB storage** | ✅ DONE | Tables created and deployed: Users (PK=userId) and Embeds (PK=userId, SK=embedId) |
| **Install AWS SDK packages** | ✅ DONE | Added required dependencies for DynamoDB operations |
| **Create API Routes** | ✅ DONE | Created `/api/user` and `/api/embed` routes |
| **Restore Platform Connect UI** | ✅ DONE | Recreated `platform-connect-modal.tsx` |

---

## 🚧 Immediate TODOs

| Priority | Task | Notes |
|----------|------|-------|
| P0 | **Bind Settings page to API** | Connect user profile form to `/api/user` endpoint |
| P0 | **Bind Insights page to API** | Display embeds from `/api/embed` endpoint |
| P1 | **Add error handling** | Improve error handling and feedback in API routes |
| P1 | **Add user authentication** | Require authentication for API access |

---

## 🗒️ Next Feature Milestones

1. **Dashboard Integration**  
   • Complete binding of Settings page to `/api/user`  
   • Complete binding of Insights page to `/api/embed`
2. **Authentication & Authorization**  
   • Add authentication checks to API routes  
   • Restrict access to user data
3. **Additional Platform Integrations**  
   • Add more music platforms (YouTube, Beatport, etc.)  
   • Implement analytics aggregation

---

## ℹ️ Useful AWS & Amplify Docs

* Amplify Gen 1 Storage (DynamoDB): <https://docs.amplify.aws/gen1/javascript/build-a-backend/storage/set-up-storage/>
* Headless CLI (CI/CD) parameters: <https://docs.amplify.aws/gen1/react/tools/cli/usage/headless/>
* Connect to existing DynamoDB (Gen 2 reference): <https://docs.amplify.aws/react/build-a-backend/data/connect-to-existing-data-sources/connect-external-ddb-table/>
* AWS SDK for JavaScript v3: <https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/>

---

*Keep this file updated whenever backend infrastructure, auth rules, or critical workflows change.* 