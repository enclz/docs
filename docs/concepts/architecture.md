---
sidebar_position: 1
title: Architecture
description: How Enclz separates the orchestrator, the agent, and the on-chain policy contract.
---

# Architecture

Enclz has three principals and one source of truth.

## Principals

**Orchestrator** — a developer or platform operator. Provisions agents, sets policies, manages the whitelist. Authenticates with their Solana wallet via Sign-in-with-Solana (SIWS) on the [web app](https://enclz.com).

**Agent** — an autonomous software process (LLM-driven or otherwise). Authenticates with a *scoped API key*. Never holds a private key. Calls the [Agent REST API](../integration/rest-api) or the [MCP server](../integration/mcp-server) to transfer, swap, deposit, withdraw, or simulate.

**Enclz program** — an Anchor smart contract on Solana. Holds the policy state for every agent and enforces every spend on every transaction. The program is the source of truth.

## High-level flow

```
┌─────────────────┐                                     ┌──────────────────┐
│  Orchestrator   │  signs init / whitelist / limits    │   Solana chain   │
│  (web app /     │ ──────────────────────────────────► │   Enclz program  │
│   wallet)       │                                     │  (Anchor / Rust) │
└─────────────────┘                                     │                  │
                                                        │  GroupConfig PDA │
┌─────────────────┐  POST /v1/transfer (Bearer key)     │  AgentWallet PDA │
│      Agent      │ ──────────────────────────────────► │  Whitelist PDA   │
│  (LLM / code)   │                                     │                  │
└─────────────────┘                                     └──────────────────┘
        │                       ▲                                ▲
        │                       │ enforces caps + whitelist      │
        │                       │ on every execute_*             │
        ▼                       │                                │
┌─────────────────┐              │                                │
│  Enclz backend  │ ─────────────┘                                │
│  (REST API)     │  builds + submits signed instructions ────────┘
└─────────────────┘
```

The backend builds and submits transactions on the agent's behalf. Every spend instruction is preflighted and finalized by the on-chain program. **The backend cannot grant the agent any spending power the program does not already permit.**

## Separation of trust

| Trust boundary | What lives there |
| --- | --- |
| Orchestrator wallet (cold) | The keypair authorized to mutate policy |
| Enclz program (on-chain) | All policy state — limits, whitelist, nonce |
| Enclz backend | Stateless executor — builds tx, submits to RPC, dispatches webhooks |
| Agent runtime | Just a scoped API key |

If the backend is compromised, the attacker can submit transactions, but every transaction is bounded by the on-chain caps and whitelist — same as anyone else. The backend has *no override*.

If the agent's API key leaks, the attacker can call the Agent REST API, but every call is still bounded by the agent's policy ceiling. They can spend up to whatever the orchestrator approved, and no further.

If the orchestrator's wallet is compromised, that's the standard self-custody surface — same as any Solana account.

## What the program enforces

For every transfer:

1. **Recipient is whitelisted** — there must be a `WhitelistEntry` PDA for the recipient.
2. **Whitelist hasn't expired** — for external recipients (`entry_type = 1`), `now ≤ ttl_expires_at`.
3. **Whitelist has remaining budget** — for external recipients, `amount_used + amount ≤ approved_amount`.
4. **Per-tx cap not exceeded** — `amount ≤ AgentWallet.per_tx_limit`.
5. **Daily cap not exceeded** — `amount + spent_today ≤ AgentWallet.daily_limit` (rolling 24h).
6. **Hourly frequency cap not exceeded** — `count_in_last_hour < AgentWallet.hourly_tx_cap`.
7. **Nonce matches** — replay protection.

Any failure rejects the instruction on-chain with a typed error. The backend translates the error into an HTTP error code for the agent's response.

For protocol interactions (DEX swaps, lending deposits and withdrawals), the same recipient-whitelist check applies — the protocol's program ID must be in the whitelist as `entry_type = 2`.

## What the program does not do

- It does not custody fiat. Settlement is in USDC or any whitelisted SPL.
- It does not execute swaps or lending operations itself — it CPI's into Jupiter and the lending protocols.
- It does not manage agent identity beyond the `AgentWallet` PDA. Off-chain identity (display names, audit memos) lives in the backend's structured logs.
