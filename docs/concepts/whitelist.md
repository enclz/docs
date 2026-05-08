---
sidebar_position: 3
title: Whitelist categories
description: Three kinds of whitelist entries — intra-group, external, and protocol — each with its own enforcement rules.
---

# Whitelist categories

Every transfer must go to a whitelisted address. The Enclz program rejects transfers to anything else. There are three kinds of whitelist entry, each represented by a `WhitelistEntry` PDA with seed `["whitelist", group_pubkey, target_address]`.

| Type | `entry_type` | TTL | Amount cap | Auto-void |
| --- | --- | --- | --- | --- |
| Intra-group agent | `0` | none | unlimited | no |
| External recipient | `1` | required | required | yes — when amount consumed |
| Protocol | `2` | none | unlimited | no |

The fact that the entry *exists* is what authorizes a transfer. Closing the entry de-authorizes it.

## Intra-group agent (type 0)

Auto-added when an agent is created. Lets agents within the same group transfer to each other without manual approval. Permanent — no TTL, no amount cap. Removed only when the agent is removed from the group.

Use case: agent-to-agent micropayments inside a fleet (one agent pays another for a sub-task).

## External recipient (type 1)

Manually added by the orchestrator. Carries:

- **`ttl_expires_at`** — Unix timestamp; transfers after this fail with `whitelist_expired`
- **`approved_amount`** — total cumulative amount allowed across all transfers to this recipient
- **`amount_used`** — running total, incremented by every successful transfer

When `amount_used >= approved_amount`, the program closes the `WhitelistEntry` PDA in the same transaction that consumed the last unit (auto-void). The slot rent is returned to the orchestrator. Future transfers to that recipient fail with `whitelist_violation` until the orchestrator re-creates the entry with a fresh TTL and budget.

This is the mechanic that makes Enclz different from a "wallet with a budget":

- A budget you set in software can be bypassed by software.
- An auto-voiding entry on-chain is verifiable by anyone with a Solana RPC, including the agent itself, including auditors, including a future regulator.

Use case: paying a third-party API. *"This Helius endpoint can receive up to $5 from this agent over the next 7 days. After that, the orchestrator must explicitly re-approve."*

## Protocol (type 2)

For transfers to program addresses (DEX routers, lending pools). Permanent — no TTL, no amount cap, since these are routing endpoints, not value sinks. Per-tx and daily caps still apply through the agent's own policy ceiling, so a compromised agent can't drain via protocol calls either.

Use case: enabling Jupiter swaps, Kamino deposits, Drift withdrawals. The orchestrator whitelists the protocol's program ID once.

The DEX swap router is auto-added at group initialization (`initialize_group`), so swaps work immediately after provisioning without an extra step.

## Which category to use

```
Sending to another agent in your group?  →  intra-group (auto-added)
Sending to an external API or person?     →  external (TTL + cap)
Calling a DeFi protocol?                  →  protocol (permanent)
```

If the address doesn't fit any category, it doesn't get whitelisted. The agent can never send to it.

## Whitelist lifecycle (external entries)

```
[orchestrator signs add_to_whitelist]
       │
       ▼
[entry exists, amount_used = 0]
       │
       │  agent transfers $X to this recipient
       ▼
[amount_used += X]
       │
       │  if amount_used >= approved_amount:
       ▼
[program closes entry on-chain in the same tx]
       │
       ▼
[entry is gone — future transfers fail with whitelist_violation]
       │
       │  orchestrator must sign add_to_whitelist again to re-approve
       ▼
[fresh entry, amount_used = 0]
```

Or, if the TTL passes first:

```
[entry exists, amount_used < approved_amount]
       │
       │  now > ttl_expires_at
       ▼
[transfer attempts return whitelist_expired]
       │
       │  orchestrator can renew (renew_whitelist_entry) or remove + recreate
       ▼
[fresh TTL]
```

In both cases the orchestrator's signature is required to re-authorize the recipient.
