# AI HR Recruiter – Serverless Agent

This Lambda is triggered whenever a CSV file containing LinkedIn profile URLs is uploaded to the `candidate-seeds` S3 bucket.

```
linkedInUrl
https://www.linkedin.com/in/john-doe-12345/
https://www.linkedin.com/in/jane-smith-54321/
```

## Flow
1. **S3 Trigger** – CSV upload fires the Lambda.
2. **CSV Parse** – Each row (first column) is treated as a LinkedIn public profile URL.
3. **Scrape** – Axios fetches the public page (no login). Cheerio extracts name, title, location, summary.
4. **Persist** – Candidate objects are saved in DynamoDB table `CandidateProfiles` (PK = full URL).
5. **Next steps (future sprints)**
   - Embed profile text into vector DB (Pinecone) for semantic search.
   - Nightly Step-Function to rank candidates vs. role specs.
   - Slack digest + internal dashboard.

## Local test
```bash
pnpm install
aws s3 cp samples/seeds.csv s3://candidate-seeds/test/seeds.csv
```

## Environment variables
| Name | Description |
|------|-------------|
| `CANDIDATE_TABLE` | DynamoDB table to write profiles into. |

## Deploy
Provision via Amplify's **Function** category or CDK:
```ts
new Function(stack, 'HrRecruiter', {
  runtime: Runtime.NODEJS_18_X,
  entry: 'backend/agents/hr_recruiter/handler.ts',
  environment: {
    CANDIDATE_TABLE: table.tableName,
  },
  events: [
    new S3EventSource(bucket, { events: [s3.EventType.OBJECT_CREATED] }),
  ],
});
``` 