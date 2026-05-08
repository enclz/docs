---
sidebar_position: 5
title: Webhooks
description: HMAC-signed event notifications for confirmed transfers, payments received, and policy alerts.
---

# Webhooks

Webhooks let your backend react to on-chain events without polling. Every webhook payload is HMAC-SHA256 signed using a shared secret you provide at subscription time.

Subscribe via:

- **Agent webhooks** — `POST /v1/webhooks` (Bearer agent key) — events scoped to one agent.
- **Fleet webhooks** — `POST /v1/orchestrator/groups/{group_pda}/webhooks` (Bearer SIWS JWT) — events scoped to the whole group.

## Subscription request

```json
{
  "url": "https://your-server.com/enclz-webhook",
  "events": ["transfer.confirmed", "policy.whitelist_voided"],
  "secret": "your-shared-secret"
}
```

The URL must:

- Use HTTPS.
- Resolve to a public IP (private/loopback/RFC1918 are rejected — DNS rebinding protection).
- Not include credentials in the user-info portion.
- Not redirect (the dispatcher refuses to follow redirects).

## Signature verification

Every dispatched webhook includes:

```
X-Enclz-Signature: sha256=<hex>
X-Enclz-Event: transfer.confirmed
X-Enclz-Timestamp: 1735689600
```

Verify with:

```ts
import { createHmac } from 'crypto';

function verify(payload: string, signature: string, secret: string) {
  const expected = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex');
  // Use a constant-time compare to avoid timing attacks
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

Reject any payload whose signature doesn't match. Reject any payload older than 5 minutes (use the timestamp header) — same hardening as Stripe webhooks.

## Event taxonomy

### Transfer events

#### `transfer.confirmed`

A successful `execute_transfer` confirmed on-chain.

```json
{
  "event": "transfer.confirmed",
  "agent_wallet_pda": "8g7Kca...",
  "group_config_pda": "7Vtnen...",
  "tx_signature": "5JxKp...",
  "amount": 0.05,
  "fee": 0.00005,
  "recipient": "GjwoT...",
  "memo": "rpc-call-#a8f2",
  "task_id": "experiment-2026-05",
  "confirmed_at": "2026-05-08T17:23:44Z"
}
```

#### `payment.received`

An external party transferred tokens *into* an agent's ATA. Useful for agents that earn — receiving a tip, a bounty payout, etc.

```json
{
  "event": "payment.received",
  "agent_wallet_pda": "8g7Kca...",
  "tx_signature": "...",
  "amount": 1.00,
  "from": "5DjN...",
  "received_at": "..."
}
```

### Policy events (fleet-level)

#### `policy.transfer_blocked`

An attempted `execute_*` was rejected by the on-chain program. Fires for every blocked transaction with the structured error attached.

```json
{
  "event": "policy.transfer_blocked",
  "agent_wallet_pda": "8g7Kca...",
  "error": {
    "code": "whitelist_violation",
    "details": { "recipient": "..." }
  },
  "attempted_amount": 0.05,
  "blocked_at": "..."
}
```

Watch this stream for patterns — repeated `whitelist_violation` from one agent often means a misconfigured prompt or a compromised key.

#### `policy.limit_threshold`

An agent crossed 80% of its daily limit (or hourly cap) within the rolling window.

```json
{
  "event": "policy.limit_threshold",
  "agent_wallet_pda": "8g7Kca...",
  "threshold": "daily",
  "spent_today": 0.85,
  "daily_limit": 1.00
}
```

#### `policy.whitelist_expiring`

A whitelist entry's TTL is < 24h. Fires once per entry.

```json
{
  "event": "policy.whitelist_expiring",
  "group_config_pda": "7Vtnen...",
  "whitelist_entry_pda": "...",
  "recipient": "GjwoT...",
  "label": "Helius RPC",
  "ttl_expires_at": "2026-05-09T17:00:00Z"
}
```

#### `policy.whitelist_amount_threshold`

A whitelist entry consumed 80% of its `approved_amount`.

```json
{
  "event": "policy.whitelist_amount_threshold",
  "whitelist_entry_pda": "...",
  "recipient": "...",
  "amount_used": 4.00,
  "approved_amount": 5.00
}
```

#### `policy.whitelist_voided`

A whitelist entry auto-voided on-chain (consumed its full `approved_amount`).

```json
{
  "event": "policy.whitelist_voided",
  "whitelist_entry_pda": "...",
  "recipient": "...",
  "final_amount_used": 5.00,
  "voided_at": "..."
}
```

#### `policy.whitelist_violation`

Same as `policy.transfer_blocked` with `error.code = "whitelist_violation"`. Surfaces separately so you can route just the violations to a security channel.

### Agent lifecycle

#### `agent.api_key_rotated`

The agent's API key was rotated by the orchestrator. The old key is invalid.

#### `agent.revoked`

The agent was revoked. No further `execute_*` instructions will succeed.

#### `agent.emergency_withdraw`

The orchestrator drained the agent via `emergency_withdraw`. The agent's ATA balance is zero and `is_active = revoked`.

## Delivery guarantees

- **At-least-once.** A confirmed event will be retried with exponential backoff until your endpoint acknowledges with a 2xx HTTP status.
- **Best-effort ordering** within an agent. Don't *rely* on order for correctness.
- **5-second timeout** per delivery attempt. Slow endpoints get retried.
- **No follow-up redirects.** If your endpoint returns 30x, the dispatcher treats it as a delivery error.

## Replay protection

Each payload includes:

- `event_id` — a stable identifier you can dedupe on if you receive the same event twice.
- `X-Enclz-Timestamp` — Unix timestamp; reject anything older than 5 minutes.

## Where to set up

For one-off agent webhooks: call `POST /v1/webhooks` from the agent itself.

For fleet-level policy alerts: configure from the **Settings** page of the dashboard, or via `POST /v1/orchestrator/groups/{group_pda}/webhooks`.

Most teams point fleet webhooks at a Slack or PagerDuty integration, and agent webhooks at their own backend's audit log.
