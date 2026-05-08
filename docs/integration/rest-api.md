---
sidebar_position: 1
title: Agent REST API
description: HTTPS endpoints for agents — transfer, swap, deposit, withdraw, simulate, balance, limits, history, webhooks.
---

# Agent REST API

Base URL: `https://api.enclz.com`

OpenAPI 3.1 spec: `https://api.enclz.com/openapi.json`

All requests are authenticated with `Authorization: Bearer <api_key>`. Mutation endpoints (`/v1/transfer`, `/v1/swap`, `/v1/deposit`, `/v1/withdraw`) require an `Idempotency-Key` header — any UUID will do.

## Authentication

The agent's API key is exchanged for a one-time invitation code via:

```
POST /v1/agents/register
{
  "invitation_code": "..."
}
→ { "api_key": "ek_...", "agent_wallet_pda": "...", "limits": {...} }
```

Store `api_key` securely. From then on, use it as a Bearer token. The invitation code is single-use — it's invalidated immediately after exchange.

## Endpoints

### `POST /v1/transfer`

Send tokens to a recipient.

**Body**:
```json
{
  "recipient": "GjwoT1Hf2Rhet9NEr4D5jgN5VdfpxdmxbbPLLgUrjgyy",
  "amount": 0.05,
  "memo": "rpc-call-#a8f2",
  "task_id": "experiment-2026-05"
}
```

- `recipient` — base58 Solana address. Must be in your whitelist.
- `amount` — USDC.
- `memo` — optional, ≤ 200 UTF-8 bytes. Stored in backend log; SHA-256 hash put on-chain.
- `task_id` — optional grouping tag for cost accounting.

**Response (200)**:
```json
{
  "status": "confirmed",
  "tx_signature": "5JxKp...",
  "amount_sent": 0.05,
  "fee": 0.00005,
  "remaining_today": 0.95,
  "recipient_remaining": 4.95
}
```

**Common errors**: `whitelist_violation`, `whitelist_expired`, `whitelist_amount_exhausted`, `per_tx_limit_exceeded`, `daily_limit_exceeded`, `hourly_freq_exceeded`, `insufficient_funds`. See [Errors](../program/errors).

### `POST /v1/swap`

Swap one token for another via the whitelisted DEX router (Jupiter).

**Body**:
```json
{
  "input_mint": "EPjFWdd5...USDC",
  "output_mint": "So111...wSOL",
  "input_amount": 1.00,
  "min_output": 0.0066,
  "slippage_bps": 50
}
```

The DEX router is auto-whitelisted as protocol-type at group initialization, so swaps work immediately.

**Response**: same envelope as transfer, with `output_amount` added.

### `POST /v1/deposit` / `POST /v1/withdraw`

Move tokens to/from a whitelisted lending protocol (Kamino, etc.). The lending protocol's program ID must be a type-2 whitelist entry; the orchestrator adds it once per protocol.

**Body**: protocol-specific. See the protocol's own docs for the `cpi_data` field shape.

### `POST /v1/intents/simulate`

Dry-run a transfer or swap without submitting on-chain. Free, no signature.

**Body**: same as `/v1/transfer` or `/v1/swap`, with a `type` discriminator:
```json
{
  "type": "transfer",
  "recipient": "GjwoT...",
  "amount": 0.05
}
```

**Response**:
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

If a check fails, `would_succeed: false` and the failing check explains why.

Use this in your agent's planning loop: cheap to call, gives you the same visibility the program has, lets you avoid wasting transactions on known-failing requests.

### `GET /v1/balance`

Returns the agent's current SPL token balance.

**Response**:
```json
{
  "mint": "EPjFWdd5...USDC",
  "balance": 0.95,
  "associated_token_account": "..."
}
```

### `GET /v1/limits`

Returns the agent's policy ceiling and current counters.

**Response**:
```json
{
  "per_tx_limit": 0.10,
  "daily_limit": 1.00,
  "hourly_tx_cap": 10,
  "spent_today": 0.05,
  "remaining_today": 0.95,
  "hourly_count": 1,
  "remaining_hourly": 9
}
```

Read directly from on-chain `AgentWallet` PDA — what you see is what the program will enforce.

### `GET /v1/history`

Paginated transfer/swap/deposit/withdraw history.

**Query params**: `limit` (default 50, max 200), `cursor`, `since` (ISO 8601), `type` (filter by op type).

**Response**:
```json
{
  "items": [
    {
      "type": "transfer",
      "tx_signature": "...",
      "amount": 0.05,
      "recipient": "...",
      "memo": "rpc-call-#a8f2",
      "fee": 0.00005,
      "confirmed_at": "2026-05-08T17:23:44Z"
    }
  ],
  "next_cursor": "..."
}
```

### `POST /v1/webhooks`

Subscribe to events.

**Body**:
```json
{
  "url": "https://your-server.com/enclz-webhook",
  "events": ["transfer.confirmed", "policy.whitelist_voided"],
  "secret": "your-shared-secret"
}
```

See [Webhooks](./webhooks) for the event list and payload shapes.

## Idempotency

Mutating endpoints (`/transfer`, `/swap`, `/deposit`, `/withdraw`) require an `Idempotency-Key` header. Recommended: a per-attempt UUID.

If the same idempotency key is replayed within 24h, the original response is returned — no double-spend, no double-tx. This makes safe retries trivial: catch a transient error, retry with the same key.

## Rate limits

Default: 60 requests / minute / agent. Higher tiers available for payment-tier agents on request.

Rate-limit responses are HTTP 429 with `Retry-After` header.

## Error format

All errors share the envelope from [Errors](../program/errors). Codes are stable; match on `error.code`, not on `error.message`.
