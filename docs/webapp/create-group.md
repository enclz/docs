---
sidebar_position: 2
title: Create a fleet group
description: A group is the root account that owns all your agents and enforces shared policy.
---

# Create a fleet group

A **group** is the root on-chain account that owns one or more agents. Every wallet has at most one group (the `GroupConfig` PDA is keyed on the owner's pubkey).

The group setup wizard fires automatically the first time you sign in.

## Step 1 — name the group

{/* TODO(screenshot): /img/screenshots/setup-wizard-step1.png — Create a Fleet Group, step 1 (name input, empty) */}

Constraints:

- **3 to 32 bytes (UTF-8)** — stored on-chain as a fixed-length 32-byte array. Names longer than 32 bytes are silently truncated. Most ASCII characters take one byte; emoji and CJK characters take more.
- **Anything goes within the byte limit.** No reserved names, no uniqueness check.

Pick something memorable. The name shows up in the dashboard header, in webhook payloads, and in any audit memo that references the group.

{/* TODO(screenshot): /img/screenshots/setup-wizard-step1-filled.png — Group name filled in */}

Click **Continue** when ready.

## Step 2 — review and create

{/* TODO(screenshot): /img/screenshots/setup-wizard-step2-review.png — Create a Fleet Group, review step */}

The review screen shows what's about to be written to chain:

- **Group name** — what you typed.
- **Owner wallet** — the pubkey of the wallet that signed in. This wallet is the only one that can mutate this group's policy.

Click **Create Group**. Your wallet pops a transaction-signing prompt. Approve it.

The transaction does two things in a single instruction:

1. Creates the `GroupConfig` PDA at `["group", owner_pubkey]`.
2. Creates a `WhitelistEntry` PDA for the DEX swap router as `entry_type = 2` (protocol). This is so swaps via Jupiter work immediately without an extra setup step.

Confirmation typically lands in 1–2 seconds on devnet, 1–3 seconds on mainnet.

## After creation

You're redirected to the fleet dashboard at `/group/<group_pda>`. The URL is shareable as a permalink — anyone with the link will see the dashboard *if* they're signed in as the owning wallet. Other wallets get a 403.

The empty dashboard looks like this until you add an agent:

```
ACTIVE AGENTS
0
of 0 total

SPENT TODAY  $0.00
TX (24H)     0 confirmed / 0 blocked
```

[Continue to add an agent →](./add-agent)

## What if I have the wrong wallet connected?

If you signed in with a wallet you didn't intend to use:

1. Click **Sign out** in the top-right.
2. Sign in again with the correct wallet.

The original wallet's group (if any) stays on-chain untouched. There's no migration — each wallet keeps its own group.

## Can I create more than one group per wallet?

No. The `GroupConfig` PDA is keyed on the owner's pubkey, so each wallet has at most one. If you need multiple isolated fleets, use multiple wallets (one per fleet).

This is by design: the constraint makes the "who owns this group?" question a one-line PDA derivation rather than a database lookup, which keeps the trust model on-chain.
