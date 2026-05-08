---
sidebar_position: 3
title: Instructions
description: Every public instruction the Enclz program accepts, who signs it, and what it does.
---

# Instructions

The Enclz program exposes the instructions below. Each lists who must sign and what state changes.

## Owner-signed (orchestrator wallet)

These mutate policy. They require the orchestrator's wallet signature and cannot be invoked by any other party.

### `initialize_group`

Creates the `GroupConfig` PDA and a protocol-type whitelist entry for the DEX swap router.

**Args**: `group_name: [u8; 32]`

**Accounts**:
- `owner` (signer, writable)
- `group_config` (PDA, init)
- `dex_router_entry` (PDA, init — type-2 whitelist)
- `system_program`

Called once per orchestrator wallet at first sign-in.

### `add_agent`

Creates an `AgentWallet` PDA and its associated token account, plus an intra-group `WhitelistEntry` (type 0) seeded on the agent's pubkey.

**Args**: `display_name: [u8; 32]`, `per_tx_limit: u64`, `daily_limit: u64`, `hourly_tx_cap: u32`, `mint: Pubkey`

**Accounts**:
- `owner` (signer, writable)
- `group_config` (writable)
- `agent_wallet` (PDA, init)
- `agent_ata` (init, owned by agent_wallet)
- `intra_group_entry` (PDA, init — type-0 whitelist)
- `mint`, `system_program`, `token_program`, `associated_token_program`

### `add_to_whitelist`

Creates a `WhitelistEntry` PDA. Owner-only.

**Args**: `label: [u8; 32]`, `entry_type: u8` (0/1/2), `ttl_expires_at: i64` (required for type 1), `approved_amount: u64` (required for type 1)

**Accounts**:
- `owner` (signer, writable)
- `group_config` (writable)
- `whitelist_entry` (PDA, init)
- `target` (the address being whitelisted)
- `system_program`

### `renew_whitelist_entry`

Updates `ttl_expires_at` and/or `approved_amount` on an existing type-1 entry. Cannot be called on type-0 or type-2 entries.

**Args**: `new_ttl_expires_at: i64` (or 0 to leave unchanged), `additional_amount: u64` (or 0 to leave unchanged)

**Accounts**:
- `owner` (signer)
- `whitelist_entry` (writable)

### `remove_from_whitelist`

Closes the `WhitelistEntry` PDA, returning rent to the owner.

**Accounts**:
- `owner` (signer, writable — receives rent)
- `whitelist_entry` (writable, closed)

### `update_agent_limits`

Updates the per-tx, daily, and hourly cap fields on an existing `AgentWallet`. Owner-only.

**Args**: `per_tx_limit: u64`, `daily_limit: u64`, `hourly_tx_cap: u32`

**Accounts**:
- `owner` (signer)
- `agent_wallet` (writable)

### `update_backend_operator`

Replaces the `backend_operator` pubkey on the group. Used during operator key rotation.

### `emergency_withdraw`

Owner-only. Drains a specific agent's wallet to the owner's address. Bypasses per-tx and daily caps. Used as a kill-switch when an agent is compromised. The `is_active` flag is set to `revoked` afterward.

## Operator-signed (backend executor)

These execute spends. Signed by the backend's operator keypair, but the *checks* happen entirely in the program. The operator cannot grant the agent any authority the program doesn't already permit.

### `execute_transfer`

Sends tokens from the agent's ATA to a recipient.

**Args**: `amount: u64`, `nonce: u64`, `memo_hash: [u8; 32]`

**Accounts**:
- `operator` (signer)
- `agent_wallet` (writable)
- `agent_ata` (writable)
- `recipient_ata` (writable)
- `whitelist_entry` (writable — mutated for type-1 amount_used; may be closed on auto-void)
- `group_config`
- `group_owner` (writable — receives rent on auto-void)
- `fee_recipient_ata` (writable — receives 10 bps fee)
- `token_program`

**Checks**:
1. `whitelist_entry` PDA exists for the recipient (Anchor seed constraint).
2. If `entry_type = 1`: `now ≤ ttl_expires_at` (else `whitelist_expired`).
3. If `entry_type = 1`: `amount_used + amount ≤ approved_amount` (else `whitelist_amount_exhausted`).
4. `amount ≤ per_tx_limit` (else `per_tx_limit_exceeded`).
5. `spent_today_rolling + amount ≤ daily_limit` (else `daily_limit_exceeded`).
6. `hourly_tx_count_rolling + 1 ≤ hourly_tx_cap` (else `hourly_freq_exceeded`).
7. `nonce == agent_wallet.nonce + 1` (else `NonceMismatch`).

If all checks pass:
- Tokens move: agent_ata → fee_recipient_ata (10 bps), agent_ata → recipient_ata (rest).
- Counters update: `spent_today += amount`, `hourly_tx_count += 1`, `nonce += 1`, `last_tx_at = now`.
- If `entry_type = 1`: `amount_used += amount`. If consumed: `whitelist_entry` is closed.

### `execute_swap`

CPIs into the DEX swap router (Jupiter). The router must have a type-2 whitelist entry. Same caps and nonce checks as `execute_transfer` apply to the swap input.

### `execute_deposit` / `execute_withdraw`

CPIs into a lending protocol. Same caps. The lending protocol's program ID must have a type-2 whitelist entry. Lending-protocol-specific instruction data is passed through as `cpi_data` and is the caller's responsibility (the program doesn't interpret it).

## Errors

Each instruction can fail with a typed error. See [Errors](./errors).

## Pseudocode for `execute_transfer`

```rust
fn execute_transfer(
  ctx: Context<ExecuteTransfer>,
  amount: u64,
  nonce: u64,
  memo_hash: [u8; 32],
) -> Result<()> {
  // 1. Whitelist seed check (Anchor enforces by PDA derivation)
  // 2. Type-specific checks
  let entry = &mut ctx.accounts.whitelist_entry;
  if entry.entry_type == 1 {
    if Clock::get()?.unix_timestamp > entry.ttl_expires_at {
      return err!(EnclzError::WhitelistExpired);
    }
    if entry.amount_used + amount > entry.approved_amount {
      return err!(EnclzError::WhitelistAmountExhausted);
    }
  }

  // 3. Cap checks
  let agent = &mut ctx.accounts.agent_wallet;
  if amount > agent.per_tx_limit {
    return err!(EnclzError::PerTxLimitExceeded);
  }
  let spent_today = agent.rolling_spent_today(now);
  if spent_today + amount > agent.daily_limit {
    return err!(EnclzError::DailyLimitExceeded);
  }
  let hourly_count = agent.rolling_hourly_count(now);
  if hourly_count + 1 > agent.hourly_tx_cap {
    return err!(EnclzError::HourlyFreqExceeded);
  }

  // 4. Nonce check
  if nonce != agent.nonce + 1 {
    return err!(EnclzError::NonceMismatch);
  }

  // 5. Move tokens (CPI to spl-token)
  let fee = amount * 10 / 10_000;  // 10 bps
  token::transfer(...fee...);
  token::transfer(...amount - fee...);

  // 6. Update state
  agent.spent_today += amount;
  agent.hourly_tx_count += 1;
  agent.nonce += 1;
  agent.last_tx_at = now;

  if entry.entry_type == 1 {
    entry.amount_used += amount;
    if entry.amount_used >= entry.approved_amount {
      // Close the entry — auto-void
      ctx.accounts.whitelist_entry.close(ctx.accounts.group_owner)?;
    }
  }

  Ok(())
}
```

(Real implementation lives in [`programs/enclz/src/instructions/`](https://github.com/enclz/solana/tree/main/programs/enclz/src/instructions).)
