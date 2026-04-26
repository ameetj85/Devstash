# AI Integration Plan

> Research findings for integrating OpenAI `gpt-5-nano` into Scribbles.

---

## Table of Contents

- [SDK & Architecture Decision](#sdk--architecture-decision)
- [OpenAI Client Setup](#openai-client-setup)
- [Feature Implementations](#feature-implementations)
  - [Auto-Tagging](#1-auto-tagging)
  - [AI Summaries](#2-ai-summaries)
  - [Code Explanation](#3-code-explanation)
  - [Prompt Optimization](#4-prompt-optimization)
- [Streaming vs Non-Streaming](#streaming-vs-non-streaming)
- [Error Handling & Rate Limiting](#error-handling--rate-limiting)
- [Pro User Gating](#pro-user-gating)
- [Cost Optimization](#cost-optimization)
- [UI Patterns](#ui-patterns)
- [Security Considerations](#security-considerations)
- [Implementation Order](#implementation-order)

---

## SDK & Architecture Decision

### Recommended: Vercel AI SDK + `@ai-sdk/openai`

Use the **Vercel AI SDK** (`ai` package) with the `@ai-sdk/openai` provider rather than the raw `openai` SDK directly. Reasons:

1. **Built for Next.js** — first-class support for server actions, API routes, and streaming
2. **Unified API** — `generateText()` for non-streaming, `streamText()` for streaming, `generateObject()` / `Output.object()` for structured output with Zod schemas
3. **Provider abstraction** — can swap models (e.g., switch to Claude or local models) by changing one line
4. **React hooks** — `useChat()`, `useCompletion()` for client-side streaming state management
5. **Streaming helpers** — `createStreamableValue()` for server actions, `toUIMessageStreamResponse()` for API routes

### Packages to Install

```bash
npm install ai @ai-sdk/openai
```

### Environment Variables

```env
OPENAI_API_KEY=sk-...          # Required — the @ai-sdk/openai provider reads this automatically
```

---

## OpenAI Client Setup

### `src/lib/ai.ts` — Singleton Configuration

```typescript
import { openai } from '@ai-sdk/openai';

// Model constants
export const AI_MODEL = openai('gpt-5-nano');

// Shared system prompts
export const SYSTEM_PROMPTS = {
  autoTag: `You are a developer knowledge management assistant. Given an item's title, content, and type, suggest 3-5 relevant tags. Tags should be lowercase, hyphenated, and specific to the technology or concept. Return only the tags as a JSON array of strings.`,
  
  summarize: `You are a concise technical writer. Summarize the given content in 1-3 sentences. Focus on what the content does, not how it works. Keep it developer-friendly.`,
  
  explainCode: `You are a senior developer explaining code to a colleague. Provide a clear, plain-English explanation of what this code does, why it's useful, and any important patterns or gotchas. Use markdown formatting.`,
  
  optimizePrompt: `You are an AI prompt engineering expert. Improve the given prompt to be more specific, structured, and effective. Preserve the original intent but make it clearer and more likely to produce high-quality results. Return the improved prompt text.`,
};
```

---

## Feature Implementations

### 1. Auto-Tagging

**Pattern:** Non-streaming, structured output with Zod schema  
**Trigger:** Button click after saving an item, or automatic suggestion on create  
**Returns:** Array of tag strings

```typescript
// src/actions/ai.ts
'use server';

import { generateText, Output } from 'ai';
import { z } from 'zod';
import { auth } from '@/auth';
import { AI_MODEL, SYSTEM_PROMPTS } from '@/lib/ai';

const tagSuggestionSchema = z.object({
  tags: z.array(z.string().max(30)).min(1).max(5),
});

export async function suggestTags(data: { title: string; content: string; type: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const isPro = session.user.isPro ?? false;
  if (!isPro) {
    return { success: false as const, error: 'AI features require a Pro subscription.' };
  }

  try {
    const { output } = await generateText({
      model: AI_MODEL,
      system: SYSTEM_PROMPTS.autoTag,
      prompt: `Type: ${data.type}\nTitle: ${data.title}\nContent: ${data.content?.slice(0, 2000) || 'N/A'}`,
      output: Output.object({ schema: tagSuggestionSchema }),
    });

    return { success: true as const, data: output.tags };
  } catch (error) {
    console.error('AI tag suggestion failed:', error);
    return { success: false as const, error: 'Failed to generate tag suggestions. Please try again.' };
  }
}
```

**Why non-streaming:** Tags are short, structured data — streaming adds complexity with no UX benefit. `Output.object()` with Zod ensures type-safe, validated responses.

### 2. AI Summaries

**Pattern:** Non-streaming (summaries are short) or streaming (for longer content)  
**Trigger:** Button click in item drawer  
**Returns:** Summary text string

```typescript
// In src/actions/ai.ts

export async function generateSummary(data: { title: string; content: string; type: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const isPro = session.user.isPro ?? false;
  if (!isPro) {
    return { success: false as const, error: 'AI features require a Pro subscription.' };
  }

  try {
    const { text } = await generateText({
      model: AI_MODEL,
      system: SYSTEM_PROMPTS.summarize,
      prompt: `Title: ${data.title}\nType: ${data.type}\nContent:\n${data.content?.slice(0, 4000) || 'No content'}`,
      maxTokens: 200,
    });

    return { success: true as const, data: text };
  } catch (error) {
    console.error('AI summary failed:', error);
    return { success: false as const, error: 'Failed to generate summary. Please try again.' };
  }
}
```

**Why non-streaming:** Summaries are 1-3 sentences. The response time for `gpt-5-nano` is fast enough (~200-500ms) that streaming adds unnecessary complexity.

### 3. Code Explanation

**Pattern:** Streaming via API route (explanations can be lengthy)  
**Trigger:** "Explain This Code" button in item drawer for snippets/commands  
**Returns:** Streamed markdown text

```typescript
// src/app/api/ai/explain/route.ts
import { streamText } from 'ai';
import { auth } from '@/auth';
import { AI_MODEL, SYSTEM_PROMPTS } from '@/lib/ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!session.user.isPro) {
    return new Response(JSON.stringify({ error: 'Pro subscription required' }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { code, language } = await req.json();
  if (!code || typeof code !== 'string') {
    return new Response(JSON.stringify({ error: 'Code content is required' }), { status: 400 });
  }

  const result = streamText({
    model: AI_MODEL,
    system: SYSTEM_PROMPTS.explainCode,
    prompt: `Language: ${language || 'unknown'}\n\nCode:\n\`\`\`${language || ''}\n${code.slice(0, 4000)}\n\`\`\``,
    maxTokens: 1000,
  });

  return result.toDataStreamResponse();
}
```

**Client-side consumption:**

```typescript
// In the item drawer component
import { useCompletion } from '@ai-sdk/react';

const { completion, isLoading, complete } = useCompletion({
  api: '/api/ai/explain',
});

// Trigger:
await complete('', { body: { code: item.content, language: item.language } });

// Render: show `completion` with ReactMarkdown, `isLoading` for spinner
```

**Why streaming:** Explanations can be several paragraphs. Streaming gives immediate feedback and reduces perceived latency by ~70%.

### 4. Prompt Optimization

**Pattern:** Streaming via API route (optimized prompts can be substantial)  
**Trigger:** "Optimize Prompt" button for prompt-type items  
**Returns:** Streamed improved prompt text

```typescript
// src/app/api/ai/optimize-prompt/route.ts
import { streamText } from 'ai';
import { auth } from '@/auth';
import { AI_MODEL, SYSTEM_PROMPTS } from '@/lib/ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!session.user.isPro) {
    return new Response(JSON.stringify({ error: 'Pro subscription required' }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { prompt } = await req.json();
  if (!prompt || typeof prompt !== 'string') {
    return new Response(JSON.stringify({ error: 'Prompt content is required' }), { status: 400 });
  }

  const result = streamText({
    model: AI_MODEL,
    system: SYSTEM_PROMPTS.optimizePrompt,
    prompt: `Original prompt:\n\n${prompt.slice(0, 4000)}`,
    maxTokens: 1500,
  });

  return result.toDataStreamResponse();
}
```

---

## Streaming vs Non-Streaming

| Feature | Pattern | Why |
|---------|---------|-----|
| **Auto-tagging** | `generateText` + `Output.object()` | Short, structured JSON — needs Zod validation, no UX benefit from streaming |
| **AI Summaries** | `generateText` | 1-3 sentences, fast with `gpt-5-nano` (~200-500ms) |
| **Code Explanation** | `streamText` + API route | Multi-paragraph markdown — streaming reduces perceived latency |
| **Prompt Optimizer** | `streamText` + API route | Substantial output — users want to see it build up |

### When to Use Each

- **Server Actions + `generateText`**: Short, structured responses where you need the full result before rendering (tags, summaries). Fits the existing `{ success, data, error }` pattern.
- **API Routes + `streamText`**: Long-form text where token-by-token display improves UX. Use `toDataStreamResponse()` on server, `useCompletion()` on client.

---

## Error Handling & Rate Limiting

### AI-Specific Rate Limiting

Add a new limiter to the existing `src/lib/rate-limit.ts`:

```typescript
// Add to existing limiters
ai: new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),  // 20 AI calls per hour per user
  prefix: 'ratelimit:ai',
}),
```

**Key:** Rate limit by `userId` (not IP) since AI features are Pro-only and authenticated.

### Error Handling Pattern

```typescript
try {
  const result = await generateText({ ... });
  return { success: true, data: result.text };
} catch (error) {
  // OpenAI-specific errors
  if (error instanceof Error) {
    if (error.message.includes('rate_limit')) {
      return { success: false, error: 'AI rate limit reached. Please wait a moment and try again.' };
    }
    if (error.message.includes('context_length')) {
      return { success: false, error: 'Content is too long for AI processing. Try with a shorter item.' };
    }
  }
  console.error('AI error:', error);
  return { success: false, error: 'AI service temporarily unavailable. Please try again.' };
}
```

### Timeout Handling

- Set `maxTokens` on all calls to cap output length and cost
- For streaming API routes, set `export const maxDuration = 30` (Next.js route segment config)
- The AI SDK handles AbortController internally for cancellation

---

## Pro User Gating

Follows the existing pattern in the codebase:

### Server Actions (non-streaming)
```typescript
const isPro = session.user.isPro ?? false;
if (!isPro) {
  return { success: false as const, error: 'AI features require a Pro subscription.' };
}
```

### API Routes (streaming)
```typescript
if (!session.user.isPro) {
  return new Response(JSON.stringify({ error: 'Pro subscription required' }), { status: 403 });
}
```

### Client-Side UI Gating
- Show AI buttons to all users but with a "PRO" badge
- Free users clicking an AI button get a toast: "Upgrade to Pro to use AI features" + link to `/settings`
- Pro users see the action execute normally

---

## Cost Optimization

### GPT-5 Nano Pricing (as of March 2026)

| | Per 1M Tokens | Cached Input |
|---|---|---|
| **Input** | $0.05 | $0.005 (90% discount) |
| **Output** | $0.40 | N/A |

### Strategies

1. **Truncate input** — Limit content sent to the model:
   - Auto-tagging: first 2,000 chars of content
   - Summaries: first 4,000 chars
   - Code explanation: first 4,000 chars
   - Prompt optimization: first 4,000 chars

2. **Cap output tokens** — Set `maxTokens` on every call:
   - Auto-tagging: 100 tokens (just a JSON array)
   - Summaries: 200 tokens
   - Code explanation: 1,000 tokens
   - Prompt optimization: 1,500 tokens

3. **Use structured output** — `Output.object()` with Zod eliminates wasted tokens on formatting/explanation for structured data (tags).

4. **Prompt caching** — The system prompts are static and identical across users. OpenAI's automatic prompt caching gives a 90% input token discount on cache hits. Keep system prompts long and stable to maximize cache hits.

5. **Estimated cost per operation** (rough):
   - Auto-tag: ~$0.00005 input + ~$0.00004 output = **~$0.0001**
   - Summary: ~$0.0001 input + ~$0.00008 output = **~$0.0002**
   - Code explanation: ~$0.0001 input + ~$0.0004 output = **~$0.0005**
   - Prompt optimization: ~$0.0001 input + ~$0.0006 output = **~$0.0007**

6. **Usage monitoring** — Log token usage from API responses to track costs per user and set alerts.

---

## UI Patterns

### Loading States

| Feature | Loading UI |
|---------|-----------|
| Auto-tagging | Shimmer/skeleton on tag pills below the tag input |
| AI Summary | Skeleton text block in the drawer, replaced with summary |
| Code Explanation | Streaming text appearing line-by-line with a blinking cursor |
| Prompt Optimizer | Streaming text in a separate panel/section |

### Accept / Reject Pattern

For **auto-tags**:
```
[Suggested tags: react, hooks, state-management, useEffect, cleanup]
[✓ Accept All]  [✗ Dismiss]  (or click individual tags to add/remove)
```

For **summaries**:
```
[AI Summary: "This snippet implements a custom React hook for..." ]
[💾 Save as Description]  [✗ Dismiss]
```

For **code explanation** and **prompt optimizer**:
```
[Streaming markdown content...]
[📋 Copy]  [✗ Close]
```
For prompt optimizer, additionally:
```
[✓ Replace Original]  [📋 Copy]  [✗ Dismiss]
```

### Button Placement

- **Auto-tag**: Sparkles icon button next to the tags input in create/edit mode
- **Summarize**: Sparkles icon button in the item drawer action bar (view mode)
- **Explain Code**: `Brain` icon button in the code editor header (view mode, snippets/commands only)
- **Optimize Prompt**: `Wand` icon button in the markdown editor header (view mode, prompts only)

### Pro Badge on AI Buttons

For free users, AI action buttons should show a small "PRO" badge (same pattern as sidebar file/image types).

---

## Security Considerations

1. **API Key** — `OPENAI_API_KEY` stored only in `.env` / environment variables, never exposed to the client. All AI calls happen server-side (server actions or API routes).

2. **Input sanitization** — Truncate content before sending to the model to prevent:
   - Token bombing (sending huge content to run up costs)
   - Prompt injection (limit user content to a defined field within the prompt template)

3. **Output sanitization** — For code explanation (rendered as markdown), use `react-markdown` which already sanitizes HTML by default. Do not use `dangerouslySetInnerHTML`.

4. **Authentication** — Every AI endpoint checks `session.user.id` and `session.user.isPro`.

5. **Rate limiting** — Per-user rate limits (not just IP-based) prevent a single Pro user from making excessive API calls.

6. **Content truncation** — All user content is `.slice()`d before being included in prompts:
   - Prevents excessively long prompts
   - Limits cost exposure per request
   - Reduces prompt injection surface area

7. **No user data in system prompts** — System prompts are static templates. User content goes in the `prompt` field only.

---

## Implementation Order

Recommended order based on complexity and user value:

| Phase | Feature | Effort | Notes |
|-------|---------|--------|-------|
| 1 | **SDK Setup** | Small | Install packages, create `src/lib/ai.ts`, add env var |
| 2 | **Auto-Tagging** | Medium | Non-streaming, structured output. Highest daily-use value. |
| 3 | **AI Summaries** | Small | Non-streaming, simple text. Reuses same pattern as tagging. |
| 4 | **Code Explanation** | Medium | First streaming feature. Needs API route + `useCompletion`. |
| 5 | **Prompt Optimizer** | Small | Same streaming pattern as code explanation. |

### File Structure

```
src/
├── lib/
│   └── ai.ts                          # Model config, system prompts
├── actions/
│   └── ai.ts                          # Server actions (auto-tag, summarize)
├── app/
│   └── api/
│       └── ai/
│           ├── explain/
│           │   └── route.ts            # Streaming code explanation
│           └── optimize-prompt/
│               └── route.ts            # Streaming prompt optimization
└── components/
    └── ai/
        ├── ai-tag-suggestions.tsx      # Tag suggestion UI with accept/reject
        ├── ai-summary.tsx              # Summary display with save option
        ├── code-explanation.tsx         # Streaming explanation panel
        └── prompt-optimizer.tsx         # Streaming optimizer panel
```

---

## Sources

- [GPT-5 Nano Model — OpenAI API](https://developers.openai.com/api/docs/models/gpt-5-nano)
- [GPT-5 Nano Pricing Guide](https://gptbreeze.io/blog/gpt-5-nano-pricing-guide/)
- [Streaming API Responses — OpenAI](https://developers.openai.com/api/docs/guides/streaming-responses)
- [Vercel AI SDK — Getting Started](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)
- [Vercel AI SDK — OpenAI Provider](https://ai-sdk.dev/providers/ai-sdk-providers/openai)
- [GPT-5 Integration in Next.js — Vladimir Siedykh](https://vladimirsiedykh.com/blog/gpt-5-integration-nextjs-saas-features)
- [OpenAI Node.js SDK — GitHub](https://github.com/openai/openai-node)
- [OpenAI API Pricing](https://developers.openai.com/api/docs/pricing)
