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
   - Currently supports SoundCloud embedding via oEmbed

---

## 📝 Content Creation Feature

### Overview
We've implemented an agentic content creation workflow that:
- Enables users to generate blog posts from a simple topic prompt
- Supports customization of tone, length, and target audience
- Provides a live preview with markdown support
- Integrates with the blog system for direct publishing

### Components & Files
1. **Data Models** (`lib/blog-types.ts`)
   - `BlogPost`: Full blog post data model
   - `ContentPrompt`: User input for content generation
   - `ContentDraft`: Generated content with metadata

2. **Data Access** (`lib/blog-db.ts`)
   - DynamoDB integration for blog posts and content drafts
   - Functions for CRUD operations on both models

3. **API Routes**
   - `/api/blog`: For managing blog posts
   - `/api/content`: For content generation and draft management

4. **UI Components**
   - `ContentCreatorForm`: Form for content generation inputs
   - `ContentPreview`: Preview and publish interface for generated content
   
5. **Dashboard Integration**
   - `/dashboard/content`: Main content creator page
   - Added to sidebar navigation

### Workflow
1. User provides a topic and optional parameters
2. System creates a draft record and begins generation
3. Client polls for completion
4. User reviews, with options to copy, edit, or publish
5. On publish, content is saved as a blog post

### Next Steps
1. **Integration with LLM Service**
   - Replace mock content generation with real LLM API
   - Support more advanced prompting with examples

2. **Enhanced Publishing Flow**
   - Image generation for blog post headers
   - SEO metadata management
   - Scheduled publishing

3. **Content Management**
   - Draft saving and resuming
   - Content version history
   - Editorial review workflow

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