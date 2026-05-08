---
sidebar_position: 1
title: Anchor program overview
description: The Enclz on-chain program — Anchor-based, Rust-written, source of truth for every spend policy.
---

# On-chain program

The Enclz program is an [Anchor](https://www.anchor-lang.com)-based Solana smart contract written in Rust. It's the source of truth for every spend policy.

- **Source**: [`enclz/solana`](https://github.com/enclz/solana)
- **Program ID**: read dynamically from `@enclz/sdk` — don't hardcode (it changes between devnet and mainnet).
- **Anchor IDL**: published on-chain and accessible via `Program.fetchIdl()`.

## What lives on-chain

| Account | Seed | Purpose |
| --- | --- | --- |
| `GroupConfig` | `["group", owner_pubkey]` | Per-orchestrator group config — name, owner, fee recipient, DEX router |
| `AgentWallet` | `["agent", group, agent_pubkey]` | Per-agent state — limits, counters, nonce, owner |
| `WhitelistEntry` | `["whitelist", group, target_address]` | Per-recipient authorization — type, TTL, amount cap, amount used |

Token accounts (ATAs) for each agent are owned by the `AgentWallet` PDA and created at agent initialization.

## What does not live on-chain

- **Agent API keys** — bcrypt-hashed in the backend's database.
- **Audit memos** (the human-readable strings attached to transfers) — stored in the backend log; the on-chain `memo` field is a fixed-length 32-byte hash.
- **Webhook subscriptions** — backend-only.
- **Orchestrator session JWTs** — issued by the backend after SIWS verification, never written to chain.

The split is deliberate: anything that affects who-can-spend-what lives on-chain. Anything that's a notification convenience or a credential lives off-chain.

## Read paths

The webapp and the backend both read on-chain state via Anchor:

- `getGroupConfig(group_pda)` — fetches a group's config.
- `getAgentWallet(agent_wallet_pda)` — fetches an agent's policy + counters.
- `listAgentsForGroup(group_pda)` — enumerates all agents in a group.
- `listWhitelistEntries(group_pda)` — enumerates all whitelist entries for a group.

The webapp uses these for the dashboard. Anyone with a Solana RPC can run the same reads directly without going through the webapp or the backend.

## Write paths

Every mutation goes through one of the program's instructions. See [Instructions](./instructions) for the full list. Mutations split into two camps:

- **Owner-signed** (the orchestrator's wallet must sign): `initialize_group`, `add_agent`, `add_to_whitelist`, `renew_whitelist_entry`, `remove_from_whitelist`, `update_agent_limits`, `update_backend_operator`, `emergency_withdraw`.
- **Operator-signed** (the backend's operator keypair signs): `execute_transfer`, `execute_swap`, `execute_deposit`, `execute_withdraw`. The backend signs as the agent's executor — but every check happens in the program, so the backend cannot grant the agent any authority the program doesn't already permit.

## Why an on-chain program

The on-chain enforcement is the differentiator. Several alternatives exist:

| Alternative | Where the policy lives | What happens if compromised |
| --- | --- | --- |
| Plain hot wallet | Nowhere | Drained immediately |
| Backend-enforced limits | Backend database | Drained when backend is compromised |
| Multi-sig | Off-chain coordination | Limits are not enforced on-chain — only signing thresholds are |
| **Enclz** | **On-chain Anchor program** | **Policy holds; attacker bounded by per-tx and daily caps and whitelist** |

The trust assumption with Enclz reduces to: the on-chain program is correct. That's auditable, freezable (program upgrades require keypair the team holds, with future plans to relinquish), and verifiable per-instruction on Solana Explorer.
