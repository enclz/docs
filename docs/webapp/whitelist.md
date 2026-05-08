---
sidebar_position: 5
title: Manage whitelist
description: Add, renew, top up, and remove whitelist entries from the Whitelist page.
---

# Manage whitelist

The **Whitelist** page (left sidebar from any group page) is where you manage all three categories of whitelist entries. URL: `enclz.com/group/<group_pda>/whitelist`.

## What you see

A grouped table with three sections:

### External recipients (type 1)

The interesting ones — TTL- and amount-capped. Each row shows:

- **Recipient address** + label.
- **TTL** — time remaining until the entry expires (e.g., "6d 4h").
- **Amount used / approved** — running total + budget (e.g., `$3.20 / $5.00`).
- **Status** — `active`, `expiring soon`, or `expired`.
- Actions — **Renew** (extend TTL), **Top up** (add to approved amount), **Remove** (close the PDA).

When `amount_used` reaches `approved_amount`, the entry auto-closes on-chain and disappears from this list (it doesn't move to a "voided" state — the PDA is literally gone, rent returned to your wallet).

### Intra-group agents (type 0)

Auto-managed. One row per agent in your group. You don't add or remove these manually — they're tied to agent lifecycle (`add_agent` creates one, removing the agent closes it).

### Protocol addresses (type 2)

Permanent. Includes:

- The DEX swap router (auto-added at group initialization).
- Any lending protocol you whitelisted (`add_to_whitelist` with `entry_type = 2`).

You can remove these manually if you want to disable a protocol's access for the whole group.

## Adding an external recipient

Click **+ Add Whitelist Entry** at the top of the page. Fill in:

- **Address** — the Solana address (32-byte pubkey, base58) you want to allow.
- **Label** — short tag, ≤ 32 bytes UTF-8, stored on-chain.
- **TTL** — pick a duration (24h / 7d / 30d / 90d / custom). Shorter is safer.
- **Approved amount** (USDC) — total cumulative budget across all transfers. The entry auto-voids when consumed.

Click **Add**. Your wallet signs `add_to_whitelist`. The entry is live within a couple of seconds.

You can also add entries during the agent creation wizard — that path is identical, just bundled into the "Whitelist" step. See [Add an agent](./add-agent).

## Renewing or topping up

For an existing external entry that's running low:

- **Renew** — extends `ttl_expires_at` by your chosen duration. Doesn't touch `approved_amount` or `amount_used`.
- **Top up** — adds to `approved_amount`. Doesn't touch the TTL.

Both call `renew_whitelist_entry` under the hood. Both require your wallet signature.

You can do this *before* the entry voids (extends the runway) or *after* (re-enables a recipient that's been auto-voided). Either way, the orchestrator's signature is required.

## Removing an entry

**Remove** closes the `WhitelistEntry` PDA. Rent is returned to your wallet (typically ~0.002 SOL per entry).

Once removed, transfers to that recipient fail with `whitelist_violation` until you add it back.

You can't remove intra-group entries directly — they're tied to agent lifecycle. To deauthorize an agent, remove the agent itself.

## Webhook events for whitelist mutations

The webapp fires webhooks for whitelist lifecycle events. See [Webhooks](../integration/webhooks) for full payloads. Relevant events:

- `policy.whitelist_expiring` — fires once when an entry's TTL is < 24h.
- `policy.whitelist_amount_threshold` — fires when `amount_used >= 0.8 * approved_amount`.
- `policy.whitelist_voided` — fires when an entry auto-closes from amount exhaustion.
- `policy.whitelist_violation` — fires when an agent attempts a transfer to an unwhitelisted address (the transfer is blocked, but the attempt is recorded).

Most orchestrators wire these to Slack or PagerDuty.

## Best practices

- **Default to short TTLs.** 7 days is a good baseline. You can renew when you want; you cannot un-trust an address that's already over-approved.
- **Default to tight amount caps.** Match the actual cost of what the agent is paying for, not what it *might* spend.
- **One entry per recipient** — don't bundle multiple intended uses into a single entry. If you split them, you can audit them separately.
- **Use protocol entries for DeFi**, not external entries. Protocol entries are permanent and don't track amount_used (no overhead per call).
- **Watch the `policy.whitelist_amount_threshold` event** as your top-up signal. It fires at 80% consumption — gives you headroom to refill before transfers start failing.
