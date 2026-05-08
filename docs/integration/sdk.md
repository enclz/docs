---
sidebar_position: 4
title: '@enclz/sdk'
description: TypeScript SDK for direct on-chain callers — Anchor IDL, types, program ID, PDA helpers.
---

# `@enclz/sdk`

`@enclz/sdk` is a thin TypeScript package that bundles:

- The **Anchor IDL** for the Enclz program.
- The current **program ID** for devnet and mainnet.
- TypeScript **types** for `GroupConfig`, `AgentWallet`, `WhitelistEntry`.
- **PDA derivation helpers** — `groupConfigPda(owner)`, `agentWalletPda(group, agent)`, `whitelistEntryPda(group, target)`.

It's intended for **direct on-chain callers** — backends, programs composing via CPI, security researchers, auditors — not for AI agents. AI agents should use the [Agent REST API](./rest-api) or the [MCP server](./mcp-server) instead.

## Install

```bash
npm install @enclz/sdk @coral-xyz/anchor @solana/web3.js
```

Peer deps are `@coral-xyz/anchor` and `@solana/web3.js`. The SDK works with any version that's compatible with the Anchor IDL it ships.

## Usage

```ts
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import {
  IDL,
  PROGRAM_ID,
  groupConfigPda,
  agentWalletPda,
  whitelistEntryPda,
} from '@enclz/sdk';

const connection = new Connection('https://api.devnet.solana.com');
const wallet = /* your Anchor-compatible wallet */;
const provider = new AnchorProvider(connection, wallet, {});
const program = new Program(IDL, PROGRAM_ID, provider);

// Read a group's config
const [groupPda] = groupConfigPda(wallet.publicKey);
const group = await program.account.groupConfig.fetch(groupPda);
console.log(group.name, group.owner.toBase58());

// Read an agent's policy ceiling
const [agentPda] = agentWalletPda(groupPda, agentOwnerPubkey);
const agent = await program.account.agentWallet.fetch(agentPda);
console.log('per-tx limit:', agent.perTxLimit.toString());

// Build and send a transaction
const tx = await program.methods
  .addToWhitelist(/* ... */)
  .accounts({ /* ... */ })
  .signers([/* ... */])
  .rpc();
```

## On-chain IDL

The IDL is also published on-chain via Anchor's `setBuffer` mechanism, so any caller can fetch it without depending on the npm package:

```ts
const idl = await Program.fetchIdl(PROGRAM_ID, provider);
const program = new Program(idl, PROGRAM_ID, provider);
```

This is the right path for tools that don't want a hard dependency on `@enclz/sdk` — auditors, explorers, third-party dashboards. The on-chain IDL is the source of truth; the npm package is a convenience.

## Updating the IDL after a program upgrade

When the program is upgraded on-chain (a rare event, gated by the upgrade authority), the IDL gets updated in the same transaction. The `@enclz/sdk` npm package is bumped to match. Pin to a major version of the SDK to track program revisions safely:

```json
{
  "dependencies": {
    "@enclz/sdk": "^0.2.0"
  }
}
```

Major version bumps signal breaking IDL changes. Minor and patch bumps signal additive changes.

## What you can do with the SDK

- **Build and submit signed transactions** — the orchestrator's web app uses the SDK for `initialize_group`, `add_agent`, `add_to_whitelist`, etc.
- **Read on-chain state** — the dashboard uses the SDK to render real-time agent state.
- **Audit a group** — enumerate all `WhitelistEntry` PDAs for a group, check TTLs and amounts.
- **Subscribe to account changes** — `connection.onAccountChange(pda, callback)` to react to mutations in real time.

## What you should not do with the SDK

- **Don't expose it to AI agents directly.** The agent should call the REST API, which goes through the operator-signed `execute_*` instructions that enforce the policy ceiling. If the agent has the SDK and a Solana wallet, it can sign whatever it wants — defeats the whole point.
- **Don't bundle it into a web frontend that's signed-in as an end-user.** Same reason. Web frontends should call the orchestrator API, not raw `program.methods`.

## Source

Source: [`enclz/solana`](https://github.com/enclz/solana) — the SDK lives in the `sdk/` subdirectory of the program repo. PR welcome.
