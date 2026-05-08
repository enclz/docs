---
sidebar_position: 2
title: MCP Server
description: Drop-in tool integration for Claude Desktop, Cursor, and any MCP runtime — eight native tools.
---

# `@enclz/mcp-server`

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes the Agent REST API as eight native tools. Drops into Claude Desktop, Cursor, or any MCP runtime — your agent gets `enclz_transfer`, `enclz_swap`, etc. alongside its built-in tools, no HTTP glue code required.

## Install

No install step — `npx` runs it on demand:

```bash
npx @enclz/mcp-server
```

That's the entire installation. The package downloads on first run, caches locally, starts up in well under a second on subsequent runs.

## Configure

One environment variable:

```bash
ENCLZ_API_KEY=ek_live_...
```

That's the agent's API key from [agent registration](../getting-started/agent). Pass it however your runtime expects environment variables.

## Use with Claude Desktop

Edit `claude_desktop_config.json` (location: `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS; `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "enclz": {
      "command": "npx",
      "args": ["@enclz/mcp-server"],
      "env": {
        "ENCLZ_API_KEY": "ek_live_..."
      }
    }
  }
}
```

Restart Claude Desktop. The new tools appear in the tool palette automatically.

## Use with Cursor

Cursor reads the same MCP server configuration format. Add to `.cursor/mcp.json` in your project (or `~/.cursor/mcp.json` for global):

```json
{
  "mcpServers": {
    "enclz": {
      "command": "npx",
      "args": ["@enclz/mcp-server"],
      "env": { "ENCLZ_API_KEY": "ek_live_..." }
    }
  }
}
```

## Tools exposed

| Tool name | What it does | Backed by |
| --- | --- | --- |
| `enclz_transfer` | Send tokens to a whitelisted recipient | `POST /v1/transfer` |
| `enclz_swap` | Swap via Jupiter | `POST /v1/swap` |
| `enclz_deposit` | Deposit to a whitelisted lending protocol | `POST /v1/deposit` |
| `enclz_withdraw` | Withdraw from a whitelisted lending protocol | `POST /v1/withdraw` |
| `enclz_simulate` | Dry-run a transfer or swap | `POST /v1/intents/simulate` |
| `enclz_balance` | Check current SPL token balance | `GET /v1/balance` |
| `enclz_limits` | Check policy ceiling and counters | `GET /v1/limits` |
| `enclz_history` | Read past activity | `GET /v1/history` |

Each tool's input schema is generated from the corresponding REST endpoint's OpenAPI definition, so the MCP runtime's tool-call validation matches the API's input validation exactly.

## Example agent prompts

Once the MCP server is wired up, you can write agent prompts that use the tools naturally:

> "Pay GjwoT1Hf2Rhet9NEr4D5jgN5VdfpxdmxbbPLLgUrjgyy 0.05 USDC for an RPC call. Memo it 'rpc-call-#a8f2'. If the whitelist budget is exhausted, ask the orchestrator to top up — don't bypass."

The agent calls `enclz_transfer` and gets back either a confirmation or a structured error. If it gets `whitelist_amount_exhausted`, the LLM understands the recovery path because the error code is descriptive.

## What about the policy ceiling?

The MCP server is just an HTTP client. Every call still goes through the on-chain program's checks. There's no "MCP-level policy" — the policy is the on-chain Anchor program. The MCP server can't grant authority; it just routes requests to the API and returns responses.

This means an agent invoking `enclz_transfer` is bounded by exactly the same caps and whitelist as the same agent invoking the REST API directly. The MCP server is a packaging convenience, not a trust layer.

## Source and contributions

Source: [`enclz/mcp-server`](https://github.com/enclz/mcp-server). Issues and PRs welcome.
