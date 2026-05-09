---
sidebar_position: 3
title: SKILL.md
description: A single markdown file that teaches any LLM how to use Enclz — no SDK, no glue code.
---

# `SKILL.md`

`SKILL.md` is a single markdown file written for LLM consumption. Drop it into your agent's skill set or system prompt and the LLM knows how to call the Agent REST API directly using whatever HTTP primitive it has access to.

This is the integration path for agents that don't run in an MCP runtime — pure-Python agents, custom frameworks, server-side LangChain workflows, anything that just needs HTTP context.

## Where to get it

Canonical source:

```bash
curl -O https://enclz.com/SKILL.md
```

Or read it directly: [SKILL.md](https://enclz.com/SKILL.md).

The file is served from the Enclz webapp and tracks the live API. Pull it fresh when you bump versions of your agent.

## How to use it

Drop it into your agent's context however your framework loads context. Three common patterns:

### As a Claude Skill

Save it to your skills directory:

```bash
mkdir -p ~/.claude/skills/enclz-payments
cp SKILL.md ~/.claude/skills/enclz-payments/SKILL.md
```

Claude auto-discovers it on next session start.

### As a system-prompt include

Many agent frameworks let you compose a system prompt from multiple markdown files. Add `SKILL.md` to that list:

```python
# LangChain example
from langchain.prompts import SystemMessagePromptTemplate

system = SystemMessagePromptTemplate.from_template(
    open("SKILL.md").read() + "\n\n" + your_other_prompt
)
```

### As a tool description

If your framework has a more structured tool-definition system, the markdown can be loaded as the description for an HTTP-call tool:

```python
tools = [
    {
        "name": "enclz_api",
        "description": open("SKILL.md").read(),
        "input_schema": {
            "type": "object",
            "properties": {
                "method": {"type": "string"},
                "path": {"type": "string"},
                "body": {"type": "object"}
            }
        }
    }
]
```

The LLM reads the skill, knows the endpoints and error semantics, and routes its calls through your `enclz_api` HTTP wrapper.

## What's in the file

The skill is structured as:

1. **Identity** — what Enclz is and what it provides.
2. **Authentication** — how to pass the API key.
3. **Endpoints** — every endpoint with input shape, output shape, and error cases.
4. **Idempotency** — how to use `Idempotency-Key`.
5. **Recovery patterns** — what to do when each error code fires.
6. **Common workflows** — paying for an API call, swapping for a different token, depositing into yield, dry-running before committing.

It's written for the LLM, not for a human. The tone is direct and instructional — short sentences, code samples, no marketing.

## Why a markdown file instead of an SDK

The skill file is the *integration*. There's no `pip install enclz` or `npm install @enclz/client`. The agent reads the markdown and calls the API with `requests` / `fetch` / `curl` — whatever HTTP primitive its language already has.

Trade-offs:

- **No version pinning.** If the API changes, the markdown changes; the agent's behavior follows whatever the file says.
- **No type safety in the agent's code.** The LLM does the schema work at inference time.
- **No client-side validation.** Bad payloads get rejected by the API, not by the SDK.

Those trade-offs are deliberate. SDKs need maintenance per language, version, and ecosystem. A markdown file is universal and self-updating from the source. For a pre-1.0 product where the API is still evolving, this scales better.

If you specifically want types and an installer, see the [SDK page](./sdk) — `@enclz/sdk` is published on npm for direct on-chain callers (your *backend*, not your *agent*).

## Embedding inline (advanced)

If your agent's runtime can't fetch from the internet, you can embed `SKILL.md` inline in your prompt as a literal string. We don't recommend this for production — you'll be pinned to whatever version you embedded — but it works.

## Versioning

The file is served from `https://enclz.com/SKILL.md` and tracks the live API. We don't (yet) version the skill explicitly. If the API changes in a non-backward-compatible way, the file changes, and we'll announce on [x.com/enclzai](https://x.com/enclzai).
