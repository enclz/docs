---
sidebar_position: 2
title: The policy ceiling
description: Per-agent spend caps live in the Anchor program. Raising them requires the orchestrator's signature.
---

# The policy ceiling

Every agent has three numeric ceilings, all enforced by the Anchor program on every transfer.

| Cap | Field | Enforced where |
| --- | --- | --- |
| Per-transaction | `AgentWallet.per_tx_limit` (USDC) | `execute_transfer`, before submission |
| Per-day (rolling 24h) | `AgentWallet.daily_limit` (USDC) | Same; tracks `spent_today` and resets |
| Per-hour frequency | `AgentWallet.hourly_tx_cap` (count) | Same; sliding-window count |

These three ceilings combine into the *policy ceiling*. A compromised agent — through hallucination, prompt injection, or a leaked API key — cannot exceed them, because the on-chain program rejects any instruction that would.

## Setting the limits

When the orchestrator creates an agent, they pick one of four [policy templates](./policy-templates) or set custom values:

```
research-agent     per-tx $0.10   daily $1.00     hourly 10
micro-payment      per-tx $1      daily $10       hourly 5
payment-agent      per-tx $10     daily $100      hourly 20
custom             you choose every value
```

The chosen values are written to the `AgentWallet` PDA at agent creation time and are part of the on-chain state from that moment on.

## Changing the limits

Limits can be raised or lowered later via the `update_agent_limits` instruction. **This requires a signed instruction from the orchestrator's wallet.** No backend call, no API key, no admin panel can override the ceiling without the orchestrator signing.

If the orchestrator's wallet is offline, an agent can never spend more than its current ceiling — even if the backend is fully compromised.

## Counter resets

| Counter | Reset behavior |
| --- | --- |
| `spent_today` | Rolls forward continuously over the last 24h. Each successful transfer increments by `amount`; expired transfers age out. |
| `hourly_tx_count` | Rolls forward continuously over the last 60 minutes. |

Both counters are stored on-chain and read on every transfer for enforcement. There is no off-chain shadow state.

## What this protects against

- **Hallucination** — agent decides to send 100 USDC instead of 1; per-tx cap rejects it.
- **Prompt injection** — adversarial input talks the agent into a large or repeated transfer; daily and hourly caps absorb the blast radius.
- **API key exfiltration** — attacker has the agent's key and starts draining; the policy ceiling holds.
- **Backend compromise** — attacker has root on the Enclz backend; can submit transactions, but they're still bounded by the program's checks.
- **Infinite loop** — agent gets stuck in a retry pattern; hourly tx cap stops the bleeding.

What this does *not* protect against: orchestrator wallet compromise. If the orchestrator's keypair is stolen, the attacker can raise limits, add malicious whitelist entries, or move funds wholesale. That's the unavoidable self-custody surface — same as any Solana wallet.
