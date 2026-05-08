---
sidebar_position: 4
title: Policy templates
description: Pre-built policy ceilings for common agent shapes. Pick one or roll your own.
---

# Policy templates

When creating an agent, the orchestrator picks one of four templates as the starting policy. Every value can be overridden if the template doesn't quite fit.

| Template | Per-tx | Daily | Hourly tx | Best for |
| --- | --- | --- | --- | --- |
| **Research Agent** 🔬 | $0.10 | $1.00 | 10 | Web scrapers, data feeds, lightweight API consumers |
| **Micro-Payment** ⚡ | $1.00 | $10.00 | 5 | Task-bounty systems, tip bots, micro-service consumers |
| **Payment Agent** 💳 | $10.00 | $100.00 | 20 | Settlement agents, exchange interfaces, yield optimizers |
| **Custom** ⚙️ | you pick | you pick | you pick | Specialized or experimental agents |

All amounts are USDC.

## Research Agent

Tightest budget. The most failure-tolerant template — even if the agent goes completely off-script, the daily blast radius is at most a couple of bucks worth of API calls.

Picks like this if your agent is calling paid public APIs (RPC, search, weather, translation) where each call costs cents at most.

## Micro-Payment

Middle-ground budget for agents paying other agents or services for small units of work. The lower hourly cap (5 tx/hour) reflects the fact that micro-payment agents tend to send fewer, slightly-larger transactions than pure research agents.

Picks like this if your agent is participating in a task-bounty system, paying a tip jar, or buying access to per-call services that cost a dollar or two.

## Payment Agent

Largest budget. Suitable for agents handling real settlement flows — DeFi position management, exchange-to-wallet transfers, scheduled payments to vendors. The 20 tx/hour cap allows for bursty rebalancing or order-routing.

Picks like this if your agent is moving real money on behalf of a real user. We recommend stricter whitelist hygiene (shorter TTLs, tighter amount caps) for payment agents than for the cheaper templates.

## Custom

For when none of the above templates fit. Set every value explicitly. Use this for:

- **Hourly tx caps that match a specific cron pattern** — e.g., 24 tx/day = 1 per hour with `hourly_tx_cap = 2` for slop room.
- **Tight daily limits with high per-tx caps** — e.g., one $50 transaction per week. Set `daily_limit = $50`, `per_tx_limit = $50`, `hourly_tx_cap = 1`. The agent gets exactly one shot per day.
- **High-frequency, low-value flows** — e.g., a tipping bot that fires constantly. Set `hourly_tx_cap` high and `per_tx_limit` very low so the cumulative damage from a misfire is bounded.

## Changing template after the fact

The template is just a *starting* set of values. After agent creation, the limits live on `AgentWallet` PDA and can be changed via the `update_agent_limits` instruction (signed by the orchestrator's wallet). The Enclz program doesn't track which template you started from — the values are what matter.

You can effectively "upgrade" a Research Agent to a Payment Agent by raising its limits, or "downgrade" a Payment Agent to research-tier by lowering them.

## What's not in the template

The template does *not* set the whitelist. Whitelist entries are managed separately and must be added explicitly per recipient. See [Whitelist categories](./whitelist).

The template also does not set webhooks, fee terms (always 10 bps), or the SPL mint (defaults to USDC; configurable per agent). Those are universal across templates.
