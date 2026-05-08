---
sidebar_position: 3
title: Add an agent
description: The four-step agent creation wizard — template, configure, whitelist, deploy.
---

# Add an agent

From the fleet dashboard, click **+ Add Agent**. The wizard has four steps.

## Step 1 — pick a policy template

Four templates to start from:

- **🔬 Research Agent** — per-tx $0.10, daily $1, hourly 10 tx
- **⚡ Micro-Payment Agent** — per-tx $1, daily $10, hourly 5 tx
- **💳 Payment Agent** — per-tx $10, daily $100, hourly 20 tx
- **⚙️ Custom** — define every limit yourself

See [Policy templates](../concepts/policy-templates) for which one fits your use case. You can override any value in the next step, so the template is just a starting point.

## Step 2 — configure

Set the agent's display name and (optionally) override the cap values:

- **Display name** — how the agent shows up in the dashboard, webhook payloads, and audit memos. 3–32 bytes UTF-8, same constraint as the group name.
- **Per-tx limit** (USDC) — single-transfer ceiling.
- **Daily limit** (USDC) — rolling 24h ceiling.
- **Hourly tx cap** — rolling 60-minute frequency ceiling (count, not amount).

The values default to whatever the template you picked specifies. Change them if needed.

These values get written to the on-chain `AgentWallet` PDA. Changing them later requires a signed `update_agent_limits` instruction from your wallet.

## Step 3 — whitelist (optional)

Pre-add external recipients before the agent goes live. For each entry:

- **Address** — the Solana address (32-byte pubkey, base58) the agent is allowed to send to. Can be a wallet, a token account, or a program.
- **Label** — human-readable tag (e.g., "Helius RPC" or "Kamino USDC vault"). Stored on-chain as a fixed 32-byte UTF-8 array.

For external recipients, you also set:

- **TTL** — when this entry expires (transfers after this fail with `whitelist_expired`).
- **Approved amount** — total cumulative budget across all transfers to this recipient. The entry auto-voids on-chain when consumed.

You can skip this step entirely and add whitelist entries later from the **Whitelist** page in the sidebar. See [Whitelist categories](../concepts/whitelist) for details.

## Step 4 — review and deploy

Review screen summarizes:

- **Agent name + template**
- **On-chain policy** (per-tx, daily, hourly)
- **Whitelist** (count of entries, with the recipients listed)

Click **Deploy Agent**. Two things happen:

1. **Your wallet signs an `add_agent` instruction.** The on-chain Anchor program creates an `AgentWallet` PDA, an associated SPL token account (defaults to USDC), and an intra-group `WhitelistEntry` PDA so other agents in the group can send to it.
2. **Once devnet confirms, the backend mints a one-time invitation code.** The code lets the agent register and exchange for an API key.

The success page shows the invitation code:

![Agent created with invitation code](/img/screenshots/agent-created-invitation.png)

The page shows:

- **Agent name and status** — registered.
- **One-time invitation code** — copy this now. The page won't show it again.
- **Wallet PDA** — the on-chain address of the agent's wallet (you can verify on Solana Explorer).
- **Setup instructions** — set `ENCLZ_API_KEY` in the agent's environment after first registration.

Hand the invitation code to your agent however your runtime expects it. See [Agent quickstart](../getting-started/agent) for the agent-side flow.

## What got created on-chain

After `add_agent` confirms:

```
GroupConfig (yours)
└── AgentWallet (the new agent)
    └── associated token account (USDC by default)

WhitelistEntry (intra-group, type 0)
└── seed: ["whitelist", group, agent_wallet]  (auto-added, permanent)

WhitelistEntry (any external entries you added in step 3)
└── seed: ["whitelist", group, recipient]  (TTL + amount-capped)
```

You can verify any of these on [Solana Explorer](https://explorer.solana.com) (devnet or mainnet) by searching the agent's wallet PDA.

## What if I lost the invitation code?

If the agent never used it, you can rotate via the agent's settings page (rotate API key). This invalidates the old code and mints a new one. The old API key (if any) is also revoked.

If the agent already redeemed it, the invitation code is gone forever — the API key is what matters now. You can rotate that key separately.

## Can I create multiple agents?

Yes — there's no fixed cap. Run `+ Add Agent` once per agent. Each one gets its own `AgentWallet` PDA, its own SPL token account, its own policy ceiling, and its own API key.

The intra-group whitelist is automatic: any agent in the group can transfer to any other agent in the group without the orchestrator manually adding entries (for that, see [Whitelist categories](../concepts/whitelist#intra-group-agent-type-0)).
