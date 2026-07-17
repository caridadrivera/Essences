# OpenAI Content Moderation Integration

## Overview

This implementation integrates OpenAI's Moderation API into your Essences app to automatically moderate user-generated content (posts and comments) for harmful, inappropriate, or policy-violating material.

## Implementation Details

### Architecture

```
User Creates Post/Comment
        ↓
Client-side Service (moderationService.js)
        ↓
Supabase Edge Function (moderate-content/index.js)
        ↓
OpenAI Moderation API
        ↓
Response with categories and severity scores
        ↓
Decision: Allow/Block/Flag for Review
        ↓
Create Post/Comment in Database
```

### Components

#### 1. **Supabase Edge Function** (`supabase/functions/moderate-content/index.js`)
- Accepts POST requests with text to moderate
- Calls OpenAI's Moderation API (`text-moderation-latest` model)
- Returns moderation results with:
  - `flagged`: boolean indicating if content violates policy
  - `categories`: flags for specific violation types
  - `category_scores`: confidence scores (0-1) for each category
  - `severity`: calculated severity level (high/medium/low)

**OpenAI Categories Detected:**
- violence
- harassment
- hate
- harassment_threatening_violence
- self_harm
- sexual
- sexual_minors
- illegal_activity
- illicit_drugs
- weapons
- profanity

#### 2. **Client-Side Service** (`services/moderationService.js`)
Provides three main functions:

- **`moderateContent(text)`**: Raw moderation check
  - Returns: `{ success, flagged, categories, category_scores, severity }`

- **`canPostContent(text, options)`**: Decision logic with customizable policies
  - Returns: `{ canPost, severity, message, flaggedCategories, requiresReview }`
  - Options:
    - `blockFlaggedContent` (default: true): Block posts flagged by OpenAI
    - `allowHighSeverity` (default: false): Allow high severity content
    - `allowMediumSeverity` (default: false): Allow medium severity content

- **`getModerationReport(result)`**: Formatted report of flagged categories

#### 3. **Updated Services**
- **`postService.js`**: Moderates post content before creating/updating
- **`commentService.js`**: Moderates comment content before creating

### Database Schema Changes

Add these optional columns to your `posts` and `comments` tables to track moderation:

```sql
-- For posts table
ALTER TABLE posts ADD COLUMN flaggedForReview BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN reviewReason TEXT;

-- For comments table
ALTER TABLE comments ADD COLUMN flaggedForReview BOOLEAN DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN reviewReason TEXT;
```

## Setup Instructions

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (it won't be displayed again)

### 2. Configure Environment Variables

Add to your `.env.local` or `.env.production.local`:

```
OPENAI_API_KEY=sk-...your_key_here...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

### 3. Deploy Supabase Edge Function

```bash
# From your project root
supabase functions deploy moderate-content
```

The function will automatically have access to `OPENAI_API_KEY` from your environment configuration.

### 4. Update Database Schema

If you want to track flagged content:

```bash
supabase migration new add_moderation_columns
```

Then add the SQL from "Database Schema Changes" section above.

## Usage Examples

### Basic Usage in Components

```jsx
import { canPostContent } from '../services/moderationService';

const handleCreatePost = async (postContent) => {
  const moderationCheck = await canPostContent(postContent);
  
  if (!moderationCheck.canPost) {
    Alert.alert('Content Not Allowed', moderationCheck.message);
    return;
  }
  
  // Proceed with post creation
  const result = await createOrUpdatePost({ body: postContent });
};
```

### With Custom Policy

```jsx
const strictPolicy = {
  blockFlaggedContent: true,
  allowHighSeverity: false,
  allowMediumSeverity: false,  // Flag medium severity for review
};

const moderationCheck = await canPostContent(text, strictPolicy);

if (moderationCheck.requiresReview) {
  // Show warning but allow posting
  console.warn('Content flagged for review:', moderationCheck.message);
}
```

### Error Handling

The moderation service is designed to fail gracefully:

```jsx
const result = await canPostContent(userText);

if (!result.success) {
  // Moderation service unavailable - allow posting
  console.log(result.message); // "Content verification unavailable"
  // Post will be created normally
}
```

## Response Examples

### Flagged Content
```json
{
  "success": true,
  "canPost": false,
  "severity": "high",
  "message": "Content violates policy: harassment, hate",
  "flaggedCategories": ["harassment", "hate"],
  "requiresReview": false
}
```

### Requires Review
```json
{
  "success": true,
  "canPost": true,
  "severity": "medium",
  "message": "Content flagged for review - may be hidden from feeds",
  "requiresReview": true
}
```

### Approved Content
```json
{
  "success": true,
  "canPost": true,
  "severity": "low",
  "message": "Content approved",
  "requiresReview": false
}
```

## Cost Considerations

OpenAI Moderation API pricing:
- **Cost**: $0.001 per request (currently free for most users in beta)
- **Response time**: ~200-500ms typically
- **Rate limits**: 120,000 requests per minute per organization

For a typical social app:
- 1,000 posts/day = $0.03/day = ~$0.90/month

## Security Considerations

✅ **API Key Security**:
- OpenAI API key is only stored in server-side Edge Function
- Never exposed to client
- Environment variable protected

✅ **Rate Limiting**:
- Consider adding rate limiting to the edge function
- Implement per-user or per-IP request throttling

⚠️ **False Positives**:
- Moderation can flag legitimate content
- Allow user appeals/reports
- Manual review process for flagged content

## Testing

### Local Testing

```bash
# Test the edge function locally
supabase functions serve

# In another terminal
curl -X POST http://localhost:54321/functions/v1/moderate-content \
  -H "Content-Type: application/json" \
  -d '{"text":"This is a test"}'
```

### Test Cases

```javascript
// Should be approved
await canPostContent("I love this beautiful sunset"); // ✓

// Should be flagged
await canPostContent("I'm going to hurt you"); // ✗

// Should require review
await canPostContent("Some mildly offensive content"); // ⚠️
```

## Customization

### Adjust Severity Thresholds

Edit `moderate-content/index.js`:

```javascript
function calculateSeverity(scores) {
  const dangerousCategories = [
    scores.violence,
    scores.harassment,
    scores.hate,
    scores.self_harm,
  ];

  const maxScore = Math.max(...dangerousCategories);

  // Customize thresholds here
  if (maxScore > 0.7) return 'high';      // Change from 0.7
  if (maxScore > 0.4) return 'medium';    // Change from 0.4
  return 'low';
}
```

### Track Moderation History

Store moderation results in a separate table:

```sql
CREATE TABLE moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT,
  content_id UUID,
  result JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Troubleshooting

### Edge Function Not Found
- Ensure you deployed: `supabase functions deploy moderate-content`
- Check function deployment status: `supabase functions list`

### OPENAI_API_KEY Not Set
- Verify environment variable is set: `echo $OPENAI_API_KEY`
- For Supabase Cloud, set via dashboard: Project Settings → Edge Functions

### 401 Unauthorized
- Check if API key is valid
- Verify key is not expired
- Try creating new key in OpenAI dashboard

### Timeout Issues
- Increase axios timeout in `moderationService.js`
- Check internet connectivity
- OpenAI API might be experiencing issues

## Next Steps

1. **Database Migration**: Add `flaggedForReview` and `reviewReason` columns
2. **Admin Dashboard**: Create moderation queue to review flagged content
3. **User Messaging**: Show clear feedback when content is blocked
4. **Appeals Process**: Allow users to appeal rejected posts
5. **Analytics**: Track moderation metrics (false positives, categories, etc.)
6. **Rate Limiting**: Implement request throttling per user

## References

- [OpenAI Moderation API Docs](https://platform.openai.com/docs/guides/moderation)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://docs.deno.com)
