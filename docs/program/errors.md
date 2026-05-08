---
sidebar_position: 4
title: Errors
description: Every error code the Enclz program returns, what it means, and how the backend translates it for HTTP clients.
---

# Errors

The Anchor program defines its errors as a single enum starting at discriminant `6000`. The backend translates each program error into a typed HTTP error code; the agent SDK and MCP server preserve those codes verbatim.

| Discriminant | Program error | HTTP status | API code | What it means |
| --- | --- | --- | --- | --- |
| 6000 | `WhitelistViolation` | 403 | `whitelist_violation` | Recipient address has no `WhitelistEntry` PDA, or the PDA exists but its `entry_type` doesn't match the operation. |
| 6001 | `WhitelistExpired` | 403 | `whitelist_expired` | `now > whitelist_entry.ttl_expires_at` for a type-1 entry. |
| 6002 | `WhitelistAmountExhausted` | 403 | `whitelist_amount_exhausted` | `amount_used + amount > approved_amount` for a type-1 entry. |
| 6003 | `PerTxLimitExceeded` | 403 | `per_tx_limit_exceeded` | `amount > agent_wallet.per_tx_limit`. |
| 6004 | `DailyLimitExceeded` | 403 | `daily_limit_exceeded` | `rolling_24h_spend + amount > agent_wallet.daily_limit`. |
| 6005 | `HourlyFreqExceeded` | 403 | `hourly_freq_exceeded` | `rolling_60min_count + 1 > agent_wallet.hourly_tx_cap`. |
| 6006 | `NonceMismatch` | 409 | `nonce_mismatch` | Expected `agent_wallet.nonce + 1`, got something else. Replay or stale tx. |
| 6007 | `AgentInactive` | 403 | `agent_inactive` | Agent's `is_active` flag is `paused` or `revoked`. |
| 6008 | `Unauthorized` | 401 | `unauthorized` | The signer doesn't match the expected authority (owner vs operator vs agent). |
| 6009 | `InvalidMint` | 400 | `invalid_mint` | Token mint mismatch — the agent's `mint` doesn't match the token account on the instruction. |
| 6010 | `OperationNotSupported` | 400 | `operation_not_supported` | The whitelist entry's `entry_type` doesn't permit this operation (e.g., trying to swap with a type-0 entry). |
| 6011 | `InvalidAmount` | 400 | `invalid_amount` | Amount is zero or exceeds `u64::MAX` after fee calculation. |
| 6012 | `InsufficientFunds` | 400 | `insufficient_funds` | Agent's ATA balance is less than `amount`. |
| 6013 | `EmergencyMode` | 403 | `emergency_mode` | Group is in emergency-withdraw state — no `execute_*` instructions accepted. |

## Error envelope

The Agent REST API wraps every error in a consistent envelope:

```json
{
  "error": {
    "code": "whitelist_amount_exhausted",
    "message": "Recipient GjwoT...uzbh consumed its $5.00 whitelist budget on tx 5JxKp...",
    "details": {
      "recipient": "GjwoT1Hf2Rhet9NEr4D5jgN5VdfpxdmxbbPLLgUrjgyy",
      "approved_amount": 5.00,
      "amount_used": 5.00,
      "auto_voided_at": "2026-05-08T17:23:44Z"
    }
  },
  "trace_id": "01HXYZ..."
}
```

The `code` field is the canonical machine-readable identifier — match on this, not on the message. The message is human-readable and may change between releases.

## Distinguishing causes

When a transfer fails, the order of checks in the program is:

1. PDA seed (existence) — `whitelist_violation`
2. TTL — `whitelist_expired`
3. Amount cap on whitelist — `whitelist_amount_exhausted`
4. Per-tx cap — `per_tx_limit_exceeded`
5. Daily cap — `daily_limit_exceeded`
6. Hourly count — `hourly_freq_exceeded`
7. Nonce — `nonce_mismatch`
8. Token transfer (failure here means insufficient funds or other SPL error) — `insufficient_funds`

So if your transfer returns `whitelist_violation`, you know the recipient isn't whitelisted at all — it's not a TTL or amount issue. If it returns `whitelist_expired`, the entry exists but is past its TTL. And so on.

## Recoverable vs unrecoverable

| Error | Recoverable? | How |
| --- | --- | --- |
| `whitelist_violation` | Yes | Orchestrator adds the recipient via `add_to_whitelist`. |
| `whitelist_expired` | Yes | Orchestrator renews via `renew_whitelist_entry`. |
| `whitelist_amount_exhausted` | Yes | Orchestrator tops up via `renew_whitelist_entry` or recreates the entry. |
| `per_tx_limit_exceeded` | Sometimes | Either split into smaller chunks, or the orchestrator raises `per_tx_limit`. |
| `daily_limit_exceeded` | Wait | Counter rolls over after 24h. Orchestrator can also raise the cap. |
| `hourly_freq_exceeded` | Wait | Counter rolls over within 60 minutes. |
| `nonce_mismatch` | Auto | Backend's `resolveNonceMismatch` retries with the chain-fresh nonce. Usually transparent to the agent. |
| `agent_inactive` | Yes | Orchestrator un-pauses the agent. |
| `insufficient_funds` | Yes | Top up the agent's wallet from the orchestrator (or another agent). |

For the recoverable cases, agents typically respond by either retrying after a delay (for time-based caps) or messaging the orchestrator to take action (for whitelist or limit cases).

## Webhook events for blocked transfers

Every blocked transfer fires the `policy.transfer_blocked` webhook with the structured error attached. Most orchestrators wire these to a channel they monitor — the goal is to spot patterns (a particular agent hitting `whitelist_violation` repeatedly often means a misconfigured prompt or a compromised key).

See [Webhooks](../integration/webhooks) for full payload shapes.
