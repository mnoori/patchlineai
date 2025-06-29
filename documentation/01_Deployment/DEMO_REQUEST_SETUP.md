# Demo Request System Setup

## Overview

The Patchline demo request system provides an interactive, ARIA-powered experience for potential customers to request demos. It features:

- **Interactive ARIA greeting** with typewriter effects
- **Conversational form flow** with smooth animations
- **AWS DynamoDB storage** for demo requests
- **Vibrant gradient orb background** for brand consistency
- **Real-time form validation** and submission

## Setup Instructions

### 1. Create DynamoDB Table

Run the table creation script:

```bash
npx tsx scripts/create-demo-requests-table.ts
```

This creates a `DemoRequests-production` table with:
- Primary key: `id` (string)
- Global Secondary Indexes: `email-index`, `createdAt-index`
- Provisioned capacity: 5 RCU/5 WCU

### 2. Environment Variables

Add to your `.env.local` or Amplify environment:

```env
DEMO_REQUESTS_TABLE=DemoRequests-production
```

### 3. Check Demo Requests

To view new demo requests, run:

```bash
npx tsx scripts/check-demo-requests.ts
```

This will display all demo requests with status "NEW".

## API Endpoint

**POST** `/api/demo-request`

Request body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Indie Records",
  "role": "label",
  "message": "I'd like to learn more about ARIA",
  "newsletter": true
}
```

Response:
```json
{
  "success": true,
  "message": "Demo request submitted successfully",
  "requestId": "uuid-here"
}
```

## Data Structure

Each demo request is stored with:
- `id`: Unique identifier (UUID)
- `type`: Always "DEMO_REQUEST"
- `name`: Requester's name
- `email`: Contact email
- `company`: Company/artist name
- `role`: One of: artist, label, manager, educator, other
- `message`: Their specific needs
- `newsletter`: Boolean for newsletter subscription
- `createdAt`: ISO timestamp
- `status`: "NEW", "CONTACTED", "SCHEDULED", etc.
- `source`: Always "website"

## User Experience Flow

1. **Landing**: User clicks "Request a Demo" on homepage
2. **Greeting**: ARIA introduces herself with typewriter effect
3. **Form**: Interactive form with field-by-field animations
4. **Submission**: Data saved to DynamoDB
5. **Confirmation**: Success message with next steps

## Monitoring & Notifications

Currently, demo requests are stored in DynamoDB. To add email notifications:

1. Install AWS SES client: `npm install @aws-sdk/client-ses`
2. Uncomment the SES code in `/api/demo-request/route.ts`
3. Verify `mehdi@patchline.ai` in SES
4. Update the notification email template

## Future Enhancements

- [ ] Email notifications via AWS SES
- [ ] Slack webhook integration
- [ ] CRM integration (HubSpot/Salesforce)
- [ ] Automated follow-up sequences
- [ ] Demo scheduling integration
- [ ] Analytics dashboard for conversion tracking

## Troubleshooting

### Table Creation Fails
- Check AWS credentials in `.env.local`
- Verify AWS region is correct
- Ensure IAM user has DynamoDB permissions

### Form Submission Errors
- Check browser console for API errors
- Verify DynamoDB table exists
- Check CloudWatch logs for Lambda errors

### No Demo Requests Showing
- Verify table name matches environment variable
- Check if requests have correct status ("NEW")
- Use AWS Console to inspect table directly 