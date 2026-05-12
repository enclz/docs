---
sidebar_position: 1
title: Sign in with Solana
description: How the orchestrator authenticates — wallet only, no password, no email.
---

# Sign in with Solana

Enclz uses [Sign-in-with-Solana](https://github.com/anza-xyz/wallet-standard/blob/master/packages/core/wallet-standard-features/src/signIn.md) (SIWS) for orchestrator authentication. There's no email, password, or 2FA. Your Solana wallet *is* your account.

## Two-step flow

### Step 1 — pick a wallet

Land on [enclz.com/signin](https://enclz.com/signin) and click **Choose Wallet**. The wallet picker shows every Wallet Standard-compatible wallet detected in your browser:

{/* TODO(screenshot): /img/screenshots/wallet-picker.png — Wallet picker */}

Solflare is the recommended option (it's listed first as "RECOMMENDED"). Phantom, Backpack, and any other Wallet Standard wallet are detected automatically.

If you don't have one, click **Get it** and install Solflare (the official Solana wallet) — it works in-browser without an extension.

### Step 2 — sign the SIWS message

After picking the wallet, the connect dialog runs. Once connected, the page transitions to:

{/* TODO(screenshot): /img/screenshots/signin-authenticate.png — Sign and authenticate prompt */}

Click **Sign & Authenticate**. Your wallet pops a signature prompt with the SIWS message, which looks like:

```
enclz.com wants you to sign in with your Solana account:
EeqJe98kRUfwEnzbpKAdxmY7BD1LnGcFmHTUKZMvEHKF

Sign in to Enclz with your Solana wallet.
```

Sign it. The signature is verified server-side, a session JWT is issued, and you're routed to your fleet dashboard (or the group setup wizard if this is your first sign-in).

## What the signed message proves

The SIWS message proves you control the private key for the public key in the message. It's the same security model as a wallet signature on any other dApp — except that *no transaction* is being authorized. SIWS is purely for authentication.

A few things to know:

- The message is **not on-chain**. The signature lives in the session cookie and is validated on every backend call.
- The message expires. If your session goes stale, you'll be asked to sign again.
- Different wallets show different UIs for the signature prompt. The message body is the same regardless.

## Sessions

Sessions persist across browser tabs and refreshes via standard HTTPS cookies. Click **Sign out** at any time to terminate the session. Your wallet stays connected; the next sign-in only requires the SIWS step (no re-pick-wallet).

## Programmatic orchestrator access

If you're running the orchestrator from Node (not a browser), you can perform the same SIWS ceremony with `@solana/web3.js` and call the orchestrator API directly. See `examples/orchestrator-node.js` in the [`enclz/webapp` repo](https://github.com/enclz/webapp/tree/main/examples) for a working example.

There is no static "orchestrator API key." Every programmatic session goes through SIWS, identical to the web flow. This keeps the trust model honest — there's exactly one credential type for orchestrator authority, and it's the wallet keypair.
