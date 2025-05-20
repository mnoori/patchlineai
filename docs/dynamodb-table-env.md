# DynamoDB table environment variables

For each Amplify environment, set the following variables (either in the Amplify Console or via `amplify env`) so Lambda/Next.js API routes pick up the correct tables without code changes.

```
USERS_TABLE=Users-staging
EMBEDS_TABLE=Embeds-staging
BLOG_POSTS_TABLE=BlogPosts-staging
CONTENT_DRAFTS_TABLE=ContentDrafts-staging
```

If you create new environments (e.g. `prod`), just change the suffix accordingly (`Users-prod`, etc.). 