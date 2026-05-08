---
sidebar_position: 2
title: PDAs and accounts
description: GroupConfig, AgentWallet, WhitelistEntry — what each account stores, how to derive its address.
---

# PDAs and accounts

The Enclz program uses three PDA types. All three are derived deterministically — given the seeds, anyone can compute the address with no privileged information.

## `GroupConfig`

**Seed**: `["group", owner_pubkey]`

One per orchestrator wallet. Stores group-level settings.

```
name:               [u8; 32]   // group display name (UTF-8, fixed-length)
owner:              Pubkey     // wallet authorized to mutate this group
backend_operator:   Pubkey     // executor keypair the backend uses for execute_*
fee_recipient:      Pubkey     // where the 10 bps protocol fee goes
dex_router:         Pubkey     // address whitelisted as protocol type at init
group_nonce:        u64        // for replay protection on group-level mutations
bump:               u8         // canonical PDA bump
```

The owner is the only address that can sign owner-only instructions on this group's accounts. Transferring ownership requires `update_backend_operator` (or a similar transfer instruction, depending on program version).

## `AgentWallet`

**Seed**: `["agent", group, agent_pubkey]`

One per agent. Stores the agent's policy ceiling, running counters, and operational state.

```
group:                  Pubkey     // back-reference to GroupConfig
agent_owner:            Pubkey     // identity pubkey for this agent
display_name:           [u8; 32]   // UTF-8, fixed-length
mint:                   Pubkey     // SPL mint this wallet holds (USDC by default)
ata:                    Pubkey     // associated token account, owned by this PDA

// Policy ceiling — the canonical limits, set by the orchestrator
per_tx_limit:           u64        // USDC, 6-decimal
daily_limit:            u64        // USDC, 6-decimal
hourly_tx_cap:          u32        // count, not amount

// Running counters — incremented by execute_* instructions
spent_today:            u64        // rolling 24h, USDC 6-decimal
hourly_tx_count:        u32        // rolling 60 minutes, count
last_tx_at:             i64        // Unix timestamp of last successful tx
day_window_start:       i64        // for spent_today rollover
hour_window_start:      i64        // for hourly_tx_count rollover

// Operational state
nonce:                  u64        // monotonic, replay protection
is_active:              u8         // 0 = paused, 1 = active, 2 = revoked
created_at:             i64
bump:                   u8
```

The associated token account (`ata`) is owned by the `AgentWallet` PDA, not by the agent's identity pubkey. This means:

- The agent's keypair (if it had one) cannot move funds from this account directly.
- Funds can only leave via the program — through `execute_transfer`, `execute_swap`, `execute_deposit`, `execute_withdraw`.
- The on-chain policy ceiling applies on every move.

## `WhitelistEntry`

**Seed**: `["whitelist", group, target_address]`

One per (group, recipient) pair. Existence of the PDA = whitelisted; closure of the PDA = removed.

```
label:            [u8; 32]   // human-readable tag, UTF-8 fixed-length
added_by:         Pubkey     // audit trail — who signed the add_to_whitelist
entry_type:       u8         // 0 = intra-group, 1 = external, 2 = protocol
ttl_expires_at:   i64        // Unix timestamp; 0 = no expiry (used for type 0 and 2)
approved_amount:  u64        // USDC 6-decimal; 0 = unlimited (used for type 0 and 2)
amount_used:      u64        // cumulative amount transferred to this address
bump:             u8
```

For external recipients (`entry_type = 1`):

- Both `ttl_expires_at` and `approved_amount` are non-zero.
- `amount_used` is incremented on every successful `execute_transfer` to this recipient.
- When `amount_used >= approved_amount`, the program closes the account in the same transaction (auto-void), returning rent to the orchestrator.

For intra-group (`entry_type = 0`) and protocol (`entry_type = 2`) entries:

- `ttl_expires_at = 0` and `approved_amount = 0` (interpreted as "no expiry" and "unlimited").
- `amount_used` is not tracked — auto-void doesn't apply.

## Deriving PDA addresses

JavaScript / TypeScript:

```ts
import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from '@enclz/sdk';

// GroupConfig
const [groupPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('group'), ownerPubkey.toBuffer()],
  PROGRAM_ID,
);

// AgentWallet
const [agentPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('agent'), groupPda.toBuffer(), agentOwnerPubkey.toBuffer()],
  PROGRAM_ID,
);

// WhitelistEntry
const [whitelistPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('whitelist'), groupPda.toBuffer(), recipientPubkey.toBuffer()],
  PROGRAM_ID,
);
```

Rust:

```rust
let (group_pda, _bump) = Pubkey::find_program_address(
    &[b"group", owner.as_ref()],
    &program_id,
);
```

Same pattern for the other two — the seed strings are the same.

## Reading the data

Use Anchor's deserialization:

```ts
import { Program } from '@coral-xyz/anchor';
import { IDL } from '@enclz/sdk';

const program = new Program(IDL, PROGRAM_ID, provider);
const group = await program.account.groupConfig.fetch(groupPda);
console.log(group.name, group.owner.toBase58());
```

Or read raw account data via `connection.getAccountInfo(pda)` if you don't want the Anchor dependency. The serialization layout is documented in the program source ([`programs/enclz/src/state/`](https://github.com/enclz/solana/tree/main/programs/enclz/src/state)).
