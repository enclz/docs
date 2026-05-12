---
sidebar_position: 1
title: Orchestrator quickstart
description: Provision a fleet group, add an agent, hand it an API key — in under five minutes.
---

# Orchestrator quickstart

You need:

- A Solana wallet with some devnet SOL (free from any [faucet](https://faucet.solana.com))
- A browser

We're going to provision a fleet group, add one agent to it, and walk away with an API key the agent can use. The whole thing takes about five minutes.

## 1. Sign in

Go to [enclz.com/signin](https://enclz.com/signin) and click **Choose Wallet**. The wallet picker shows Solflare by default; any Wallet Standard wallet (Phantom, Backpack, Solflare) is also detected.

{/* TODO(screenshot): /img/screenshots/wallet-picker.png — Wallet picker */}

Pick your wallet, approve the connection, then click **Sign & Authenticate**. This signs a [Sign-in-with-Solana](https://github.com/anza-xyz/wallet-standard/blob/master/packages/core/wallet-standard-features/src/signIn.md) (SIWS) message — no password, no email.

{/* TODO(screenshot): /img/screenshots/signin-authenticate.png — Sign and authenticate prompt */}

If this is your first sign-in, the app routes you to the group setup wizard. If you already have a group, it goes straight to your fleet dashboard.

## 2. Create a fleet group

The wizard has two steps: name the group, review.

{/* TODO(screenshot): /img/screenshots/setup-wizard-step1-filled.png — Create a Fleet Group, step 1 with name filled in */}

The group name is stored on-chain as a fixed 32-byte UTF-8 array; longer names are silently truncated. Pick something short and memorable.

Review screen shows what you're about to write to chain:

{/* TODO(screenshot): /img/screenshots/setup-wizard-step2-review.png — Create a Fleet Group, review step */}

Click **Create Group** and your wallet signs an `initialize_group` instruction. Devnet confirms in a couple of seconds. You land on the fleet dashboard.

## 3. Add an agent

From the dashboard, click **+ Add Agent**.

The agent wizard has four steps:

1. **Pick a policy template** — Research Agent ($0.10/$1/10), Micro-Payment ($1/$10/5), Payment Agent ($10/$100/20), or Custom. See [Policy templates](../concepts/policy-templates).
2. **Configure** — agent name, plus the per-tx, daily, and hourly cap values inherited from the template (you can override here).
3. **Whitelist** — optionally add external recipients now. You can also do this later.
4. **Review & Deploy** — confirm and sign the on-chain `add_agent` instruction.

When the transaction confirms, the app mints a *one-time invitation code* for the agent and shows it once:

{/* TODO(screenshot): /img/screenshots/agent-created-invitation.png — Agent created with invitation code */}

**Copy this code now.** It exchanges for the agent's API key on first use, and the page won't show it again. If you lose it, you can rotate via the agent's settings page.

## 4. Hand the code to the agent

Pass the invitation code to your agent however your runtime expects:

- As an environment variable: `ENCLZ_INVITATION_CODE=...`
- As a parameter to `@enclz/mcp-server` startup
- As a header on the first call to `POST /v1/agents/register`

The agent exchanges the code for a permanent API key, then forgets the invitation code. From that point on, every Agent REST API call uses `Authorization: Bearer <api_key>`.

See [Agent quickstart](./agent) for the agent-side flow.

## What you have now

- A `GroupConfig` PDA on Solana, owned by your wallet
- One `AgentWallet` PDA inside the group, with its own SPL token account
- An intra-group whitelist entry for that agent (auto-added, permanent)
- An API key the agent can use via REST or MCP
- A 10 bps fee that's automatically deducted from every transfer the agent makes

The dashboard now shows real-time on-chain state for the group:

{/* TODO(screenshot): /img/screenshots/dashboard-with-agent.png — Fleet dashboard with one agent */}

## Next

- [Add external recipients to the whitelist](../webapp/whitelist)
- [Set up webhooks](../integration/webhooks) so your backend gets notified on confirmed transfers and policy events
- [Hand the agent a `SKILL.md`](../integration/agent-skill) so its LLM context knows how to use Enclz
