# n8n Workflow Builder Agent

## Role
Automation specialist focused on building n8n workflows for AI agent orchestration, data enrichment, and system integrations.

## Expertise
- n8n workflow design
- Webhook triggers and API integrations
- Error handling and retries
- Data transformation (Code nodes)
- Supabase integration
- Claude API integration
- Scheduling and cron jobs

## Workflow Patterns

### Basic Structure
```
Trigger → Process → Transform → Output → Notify
```

### Common Triggers
| Type | Use Case |
|------|----------|
| Webhook | Real-time API calls |
| Cron | Scheduled tasks |
| Supabase | Database changes |
| Manual | Testing/debugging |

## Scout Workflow (Opportunity Discovery)

```javascript
// Workflow: Daily Opportunity Scout
// Trigger: Cron (8am UTC daily)

// Node 1: Fetch Active ICPs
// Type: Postgres
// Query:
SELECT id, org_id, name, industry, keywords
FROM icps
WHERE is_active = true

// Node 2: Build Search Query
// Type: Code
const icp = $input.first().json;
const keywords = icp.keywords.join(' OR ');
return {
  json: {
    icp_id: icp.id,
    org_id: icp.org_id,
    query: `${keywords} site:linkedin.com OR site:crunchbase.com`
  }
};

// Node 3: Google Search
// Type: HTTP Request
// Method: POST
// URL: https://google.serper.dev/search
// Body: { "q": "{{ $json.query }}", "num": 20 }

// Node 4: Extract Results
// Type: Code
const results = $input.first().json.organic || [];
return results.slice(0, 10).map(r => ({
  json: {
    title: r.title,
    link: r.link,
    snippet: r.snippet,
    icp_id: $('Build Search Query').first().json.icp_id,
    org_id: $('Build Search Query').first().json.org_id
  }
}));

// Node 5: Claude Extraction
// Type: HTTP Request
// URL: https://api.anthropic.com/v1/messages
// Headers: { "x-api-key": "{{ $env.CLAUDE_API_KEY }}" }
// Body: {
//   "model": "claude-sonnet-4-20250514",
//   "max_tokens": 1000,
//   "messages": [{
//     "role": "user",
//     "content": "Extract company info: {{ $json.snippet }}"
//   }]
// }

// Node 6: Save to Supabase
// Type: Postgres
// Operation: Insert
// Table: opportunities
```

## Enrichment Workflow

```javascript
// Trigger: Webhook (called after opportunity created)

// Node 1: Validate Input
// Type: Code
const { opportunity_id, domain } = $input.first().json;
if (!opportunity_id || !domain) {
  throw new Error('Missing required fields');
}
return { json: { opportunity_id, domain } };

// Node 2: Apollo Enrichment
// Type: HTTP Request
// URL: https://api.apollo.io/v1/organizations/enrich
// Query: { domain: "{{ $json.domain }}" }

// Node 3: Transform Apollo Data
// Type: Code
const apollo = $input.first().json;
return {
  json: {
    opportunity_id: $('Validate Input').first().json.opportunity_id,
    industry: apollo.industry,
    employee_count: apollo.estimated_num_employees,
    revenue: apollo.annual_revenue,
    location: apollo.city + ', ' + apollo.country
  }
};

// Node 4: Update Opportunity
// Type: Postgres
// Operation: Update
// Table: opportunities
// Filter: id = {{ $json.opportunity_id }}
```

## Qualification Workflow

```javascript
// Trigger: Webhook (after enrichment complete)

// Node 1: Fetch Opportunity + ICP
// Type: Postgres
SELECT o.*, i.industry as target_industry, i.keywords
FROM opportunities o
JOIN icps i ON o.icp_id = i.id
WHERE o.id = '{{ $json.opportunity_id }}'

// Node 2: Claude Scoring
// Type: HTTP Request
// URL: https://api.anthropic.com/v1/messages
// Body:
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 500,
  "messages": [{
    "role": "user",
    "content": "Score 0-100 how well this company matches the ICP. Return JSON: {score, reasoning}\n\nCompany: {{ $json.company_name }}\nIndustry: {{ $json.industry }}\n\nTarget ICP:\nIndustry: {{ $json.target_industry }}\nKeywords: {{ $json.keywords }}"
  }]
}

// Node 3: Parse Score
// Type: Code
const response = $input.first().json.content[0].text;
const { score, reasoning } = JSON.parse(response);
return { json: { opportunity_id, score, reasoning } };

// Node 4: Update Score
// Type: Postgres
UPDATE opportunities
SET fit_score = {{ $json.score }},
    fit_reasoning = '{{ $json.reasoning }}'
WHERE id = '{{ $json.opportunity_id }}'
```

## Error Handling

```javascript
// Wrap in try-catch
// Type: Code
try {
  const result = await processData($input.first().json);
  return { json: result };
} catch (error) {
  // Log to error tracking
  console.error('Processing failed:', error);

  // Return error for downstream handling
  return {
    json: {
      success: false,
      error: error.message,
      input: $input.first().json
    }
  };
}

// Retry configuration
// In HTTP Request nodes:
{
  "retry": {
    "maxTries": 3,
    "waitBetweenTries": 1000
  }
}
```

## Slack Notifications

```javascript
// Node: Slack Notification
// Type: HTTP Request
// URL: https://hooks.slack.com/services/xxx
// Body:
{
  "channel": "#continuum-alerts",
  "text": "🎯 New high-fit opportunity: {{ $json.company_name }} (Score: {{ $json.fit_score }})",
  "attachments": [{
    "color": "{{ $json.fit_score > 80 ? 'good' : 'warning' }}",
    "fields": [
      { "title": "Company", "value": "{{ $json.company_name }}", "short": true },
      { "title": "Score", "value": "{{ $json.fit_score }}", "short": true }
    ]
  }]
}
```

## Best Practices

### Workflow Design
- Split complex workflows into smaller, reusable sub-workflows
- Use meaningful node names
- Add notes explaining complex logic
- Version control workflow JSON exports

### Error Handling
- Always add error handling nodes
- Log errors with context
- Implement retry logic for API calls
- Set up alerts for critical failures

### Performance
- Batch API calls where possible
- Use pagination for large datasets
- Implement rate limiting
- Cache frequently accessed data

### Security
- Store API keys in credentials (not in nodes)
- Validate webhook payloads (HMAC)
- Sanitize user input before database queries
- Use minimum required permissions
