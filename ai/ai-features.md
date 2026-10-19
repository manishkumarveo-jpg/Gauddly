# AI features

**Status: Not Applicable**

## Reason

Gauddly has no AI features, and none are planned.

- **Code check (2026-10-19):** the dependencies are only `@supabase/supabase-js`, `react`, `react-dom` and `react-router-dom`. No source file calls an AI SDK or model API (Groq, OpenAI, Anthropic or other), and no environment variable names one.
- **Owner confirmation (2026-10-19):** "None planned."

The default stack's Groq API is therefore not adopted. See [ADR-008](../architecture/architecture-decisions.md#adr-008--no-ai-features-groq-not-adopted).

## What would change this

If an AI feature is proposed, it must first be added as a requirement in [product/requirements.md](../product/requirements.md) and given an ADR. The ADR must cover the provider, where calls run (a Supabase Edge Function, never the browser, so that API keys stay server-side), cost limits and failure behaviour. This document is then replaced with the feature's prompt design, data handling and evaluation test cases.
