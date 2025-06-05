# PatchlineAI – Developer Context

**Last updated:** July 2024

---

## 🟢 Current Backend State

1. **Amplify Project**
   - App name: `patchlineai`
   - App ID: `d40rmftf5h7p7`
   - Pulled env: **`staging`** (✓ local `amplify` folder now tracks this env)
2. **Installed SDKs**
   - `@aws-sdk/client-dynamodb`
   - `@aws-sdk/lib-dynamodb`
   - `@aws-sdk/util-dynamodb`
   - `uuid` & `@types/uuid`
   - `react-markdown`
3. **DynamoDB Tables**
   - **Users** table with primary key `userId`
   - **Embeds** table with partition key `userId` and sort key `embedId`
   - **BlogPosts** table with primary key `id`
   - **ContentDrafts** table with primary key `id`
4. **API Routes**
   - `/api/user` for user data management (GET, POST, PUT)
   - `/api/embed` for embeds management (GET, POST)
   - `/api/blog` for blog post management (GET, POST)
   - `/api/content` for content generation (GET, POST)
5. **Platform Connection**
   - `PlatformConnectModal` component for connecting external platforms
   - Instagram OAuth flow (scaffolded)
   - SoundCloud embedding via oEmbed
6. **Local repo** sits at `C:\Users\mehdi\code\patchlinerepo`  
   (all CLI commands below assume that as the CWD)

---

## 🟢 Completed Tasks

| Task | Status | Details |
|------|--------|---------|
| **Add DynamoDB storage** | ✅ DONE | Tables created and deployed: Users, Embeds, BlogPosts, ContentDrafts |
| **Install AWS SDK packages** | ✅ DONE | Added required dependencies for DynamoDB operations |
| **Create API Routes** | ✅ DONE | Created user, embed, blog, and content routes |
| **Restore Platform Connect UI** | ✅ DONE | Implemented platform integration components |
| **Implement Content Creation** | ✅ DONE | Built content creator workflow with preview and publishing |

---

## 🚧 Immediate TODOs

| Priority | Task | Notes |
|----------|------|-------|
| P0 | **Bind Settings page to API** | Connect user profile form to `/api/user` endpoint |
| P0 | **Bind Insights page to API** | Display embeds from `/api/embed` endpoint |
| P0 | **Implement Bedrock Integration** | Replace mock content generation with AWS Bedrock/Claude |
| P1 | **Add error handling** | Improve error handling and feedback in API routes |
| P1 | **Add user authentication** | Require authentication for API access |

---

## 🚀 Getting Started

1. **Set up local dev environment**
   ```bash
   pnpm install
   amplify pull --appId d40rmftf5h7p7 --envName staging
   ```

2. **Create required DynamoDB tables**
   ```bash
   amplify add storage
   # Follow prompts to create each table
   ```

3. **Run the development server**
   ```bash
   pnpm run dev
   ```

4. **Navigate to the content creator**
   - http://localhost:3000/dashboard/content

---

## 🔗 Useful References

- [AWS Amplify Documentation](https://docs.amplify.aws)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [React Markdown](https://github.com/remarkjs/react-markdown)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Amplify Gen 1 Storage (DynamoDB)](https://docs.amplify.aws/gen1/javascript/build-a-backend/storage/set-up-storage/)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html)

---

*Keep this file updated whenever backend infrastructure, auth rules, or critical workflows change.*
