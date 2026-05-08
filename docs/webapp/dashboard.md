---
sidebar_position: 4
title: Fleet dashboard
description: Real-time on-chain state for your group — active agents, spend, transactions, alerts.
---

# Fleet dashboard

The fleet dashboard is the home screen after sign-in. URL: `enclz.com/group/<group_pda>`. Permalink-shareable, but only the owning wallet can view it.

![Fleet dashboard with one agent](/img/screenshots/dashboard-with-agent.png)

## What's on the page

### Header

- **Group name** + **truncated group PDA** (click to copy the full address).
- **Top-nav links** — Fleet Dashboard, Agents, Whitelist, Settings, API Docs, MCP Server.
- **Connected wallet** indicator showing your truncated pubkey + cluster (Devnet / Mainnet).
- **Sign out** button.

All numbers on this page are read straight from on-chain state via Anchor — there's no backend cache between you and the truth.

### Top metrics row

- **Active agents** — agents with the on-chain `is_active` flag set, out of total agents in the group.
- **Spent today** — sum of all confirmed transfers across all agents in the last 24h.
- **Tx (24h)** — `confirmed` and `blocked` counts. Blocked includes whitelist violations, cap exceedances, and any other on-chain rejection.

### Daily spend chart

Last 7 days of USDC outflow, broken down by agent. Click a bar to drill into that day.

If you have no spend yet, the chart shows: *"No on-chain spend data yet."*

### Alerts

Recent policy events that matter — whitelist entries about to expire, agents nearing daily cap, anomaly detections. See [Webhook events](../integration/webhooks) for the full event list; the dashboard surfaces them in real time.

### Agent fleet

Card-style list of agents with at-a-glance state:

- Status (`active` / `paused` / `revoked`)
- Agent name
- Template name
- Today's spend / daily cap (e.g., `$0.00 / $1.00`)

Click an agent card to drill into its detail page.

### Recent activity

Last few on-chain events touching this group — transfers, swap completions, whitelist mutations. Each entry links to its Solana Explorer page.

## Real-time updates

The dashboard subscribes to account-changes for the relevant PDAs via WebSocket (Solana RPC `accountSubscribe`). When a transfer confirms, the relevant counters update without a page refresh — usually within 1–2 seconds of confirmation.

If you don't see an update, force a refresh — there can be RPC propagation lag, especially on devnet.

## Sidebar pages

The left sidebar (visible on every group page) gives you:

- **Fleet Dashboard** — this page.
- **Agents** — full list of agents in the group, with management actions (pause, resume, rotate key, revoke).
- **Whitelist** — list of all whitelist entries (intra-group, external, protocol). Add, renew, top up, or remove entries.
- **Settings** — group-level settings (group name, owner, transfer ownership, group-level webhooks).
- **API Docs** — the agent-facing REST API reference (also available [in this site](../integration/rest-api)).
- **MCP Server** — `@enclz/mcp-server` install and config (also covered [here](../integration/mcp-server)).

## What you can't do from the dashboard

- **You can't override the policy ceiling without signing** — every limit change pops a wallet signature.
- **You can't move funds between agents without going through the program** — even within the same group, transfers go through `execute_transfer` so the policy ceiling applies.
- **You can't see other groups** — every group is isolated; the URL `/group/<pda>` only resolves if you sign in as that group's owner.

## What if my dashboard shows zero agents but I created some?

A few possibilities:

1. **Wrong wallet connected** — check the truncated pubkey in the header. If it's not the wallet you provisioned with, sign out and back in.
2. **RPC lag** — the dashboard reads on-chain via `useEnclzProgram()`. Sometimes a freshly-confirmed account isn't in the RPC's cache yet. Wait 5 seconds and refresh.
3. **Devnet pruning** — devnet occasionally prunes inactive accounts. Mainnet does not. If you find your devnet group is gone after a while, just create a new one.
