---
sidebar_position: 2
title: Agent quickstart
description: Wire up an agent to the Enclz REST API or the MCP server in a few lines.
---

# Agent quickstart

You have an invitation code from the [orchestrator quickstart](./orchestrator). Now wire your agent up to use it.

There are three integration paths. Pick whichever your runtime already speaks.

## Path A — REST API

Plain HTTP. Works from any language. No SDK required.

### Register and get the API key

```bash
curl -X POST https://api.enclz.com/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{"invitation_code":"YOUR_ONE_TIME_CODE"}'
```

Response:

```json
{
  "api_key": "ek_live_...",
  "agent_wallet_pda": "8g7Kca...",
  "group_config_pda": "7Vtnen...",
  "limits": {
    "per_tx_limit": 0.10,
    "daily_limit": 1.00,
    "hourly_tx_cap": 10
  }
}
```

Store the `api_key` securely. Discard the invitation code — it's already redeemed.

### Make a transfer

```bash
curl -X POST https://api.enclz.com/v1/transfer \
  -H "Authorization: Bearer ek_live_..." \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "GjwoT1Hf2Rhet9NEr4D5jgN5VdfpxdmxbbPLLgUrjgyy",
    "amount": 0.05,
    "memo": "rpc-call-#a8f2"
  }'
```

If the recipient is whitelisted and the limits are satisfied, the response is:

```json
{
  "status": "confirmed",
  "tx_signature": "5JxKp...",
  "amount_sent": 0.05,
  "fee": 0.00005,
  "remaining_today": 0.95
}
```

If a check fails, you get a structured `403` with one of:

- `whitelist_violation` — recipient not in your whitelist
- `whitelist_expired` — recipient was whitelisted but the TTL has passed
- `whitelist_amount_exhausted` — recipient was whitelisted but the budget is consumed
- `per_tx_limit_exceeded` — `amount > per_tx_limit`
- `daily_limit_exceeded` — `amount + spent_today > daily_limit`
- `hourly_freq_exceeded` — already hit `hourly_tx_cap` in the last 60 minutes

See the [REST API reference](../integration/rest-api) for the full endpoint list.

## Path B — MCP server

If your agent runs in Claude Desktop, Cursor, or any MCP runtime, install the Enclz MCP server and your agent gets eight native tools (`enclz_transfer`, `enclz_swap`, `enclz_simulate`, etc.) without writing any HTTP glue.

```bash
npx @enclz/mcp-server
```

Configure with one environment variable:

```bash
export ENCLZ_API_KEY=ek_live_...
```

For Claude Desktop, add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "enclz": {
      "command": "npx",
      "args": ["@enclz/mcp-server"],
      "env": {
        "ENCLZ_API_KEY": "ek_live_..."
      }
    }
  }
}
```

The agent now has tools to transfer, swap, deposit, withdraw, simulate, check balance, check limits, and read history — all bounded by the on-chain policy.

See [MCP server](../integration/mcp-server) for the full tool list.

## Path C — `AGENT_SKILL.md`

If your agent uses Claude Skills or any LLM context-injection system, drop our `AGENT_SKILL.md` into the agent's skill set. It's a single markdown file that teaches the LLM how to call the Agent REST API directly:

```bash
curl -O https://raw.githubusercontent.com/enclz/.github/main/AGENT_SKILL.md
```

No SDK, no glue code. The LLM reads the skill, knows the endpoints and the error semantics, and calls the API with `fetch` or its language-of-choice equivalent.

See [AGENT_SKILL.md](../integration/agent-skill) for embedding instructions.

## Simulate before committing

Whichever path you chose, you can dry-run any transfer before sending it on-chain:

```bash
curl -X POST https://api.enclz.com/v1/intents/simulate \
  -H "Authorization: Bearer ek_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "type": "transfer",
    "recipient": "GjwoT1Hf2Rhet9NEr4D5jgN5VdfpxdmxbbPLLgUrjgyy",
    "amount": 0.05
  }'
```

Response:

```json
{
  "would_succeed": true,
  "checks": {
    "whitelisted": true,
    "ttl_remaining_days": 6,
    "amount_remaining": 4.95,
    "per_tx_ok": true,
    "daily_ok": true,
    "hourly_ok": true
  },
  "fee_preview": 0.00005
}
```

This is free and never touches the chain. Useful for cost-bounded planning loops.
