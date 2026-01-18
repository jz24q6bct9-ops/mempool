# Solana API Documentation

This document describes the Solana blockchain API endpoints available in this Mempool fork.

## Base URL

All Solana endpoints are available at: `/api/v1/solana`

## Endpoints

### 1. Get Wallet Summary

Get comprehensive wallet information including balance, tokens, transactions, fees, and statistics.

**Endpoint:** `GET /api/v1/solana/wallet/:address/summary`

**Parameters:**
- `address` (path parameter) - Solana wallet address

**Response Example:**
```json
{
  "wallet": {
    "address": "7eZtWvAq38EioSGmwP5VPVbE5va5jWmj1wZcfkxmStBZ",
    "balance": 1.234567,
    "tokenAccounts": [...],
    "transactions": [...]
  },
  "fees": {
    "total": 0.0015,
    "count": 50,
    "average": 0.00003,
    "breakdown": [...]
  },
  "liquidityPools": [...],
  "statistics": {
    "totalTransactions": 50,
    "successfulTransactions": 48,
    "failedTransactions": 2,
    "successRate": 96.0
  }
}
```

### 2. Get Wallet Balance

Get SOL balance for a wallet address.

**Endpoint:** `GET /api/v1/solana/wallet/:address/balance`

**Response Example:**
```json
{
  "address": "7eZtWvAq38EioSGmwP5VPVbE5va5jWmj1wZcfkxmStBZ",
  "balance": 1.234567
}
```

### 3. Get Token Accounts

Get all SPL token accounts owned by a wallet.

**Endpoint:** `GET /api/v1/solana/wallet/:address/tokens`

**Response Example:**
```json
{
  "address": "7eZtWvAq38EioSGmwP5VPVbE5va5jWmj1wZcfkxmStBZ",
  "tokenAccounts": [
    {
      "pubkey": "TokenAccountAddress123...",
      "mint": "TokenMintAddress456...",
      "owner": "7eZtWvAq38EioSGmwP5VPVbE5va5jWmj1wZcfkxmStBZ",
      "amount": "1000000000",
      "decimals": 9,
      "uiAmount": 1.0
    }
  ]
}
```

### 4. Get Transaction History

Get recent transactions for a wallet address.

**Endpoint:** `GET /api/v1/solana/wallet/:address/transactions`

**Query Parameters:**
- `limit` (optional) - Number of transactions to fetch (default: 20, max: 100)

**Response Example:**
```json
{
  "address": "7eZtWvAq38EioSGmwP5VPVbE5va5jWmj1wZcfkxmStBZ",
  "transactions": [
    {
      "signature": "5J7z...",
      "slot": 123456789,
      "blockTime": 1642089600,
      "confirmationStatus": "finalized",
      "err": null,
      "memo": null
    }
  ]
}
```

### 5. Get Transaction Fees

Analyze transaction fees for a wallet address.

**Endpoint:** `GET /api/v1/solana/wallet/:address/fees`

**Query Parameters:**
- `limit` (optional) - Number of transactions to analyze (default: 50, max: 100)

**Response Example:**
```json
{
  "address": "7eZtWvAq38EioSGmwP5VPVbE5va5jWmj1wZcfkxmStBZ",
  "totalFees": 0.0015,
  "averageFee": 0.00003,
  "transactionCount": 50,
  "fees": [
    {
      "signature": "5J7z...",
      "fee": 0.000005,
      "feePayer": "7eZtWvAq38EioSGmwP5VPVbE5va5jWmj1wZcfkxmStBZ",
      "blockTime": 1642089600
    }
  ]
}
```

### 6. Get Liquidity Pools

Detect liquidity pool positions for a wallet.

**Endpoint:** `GET /api/v1/solana/wallet/:address/pools`

**Response Example:**
```json
{
  "address": "7eZtWvAq38EioSGmwP5VPVbE5va5jWmj1wZcfkxmStBZ",
  "pools": [
    {
      "poolAddress": "PoolAddress123...",
      "protocol": "Raydium",
      "tokenA": {
        "mint": "TokenMintA...",
        "amount": "1000000",
        "symbol": "USDC"
      },
      "tokenB": {
        "mint": "TokenMintB...",
        "amount": "500000",
        "symbol": "SOL"
      },
      "lpTokenAmount": "707106",
      "valueUSD": 1500.0
    }
  ]
}
```

### 7. Get Transaction Details

Get detailed information about a specific transaction.

**Endpoint:** `GET /api/v1/solana/transaction/:signature`

**Parameters:**
- `signature` - Transaction signature

**Response Example:**
```json
{
  "signature": "5J7z...",
  "transaction": {
    "slot": 123456789,
    "blockTime": 1642089600,
    "meta": {
      "err": null,
      "fee": 5000,
      "preBalances": [1000000000],
      "postBalances": [999995000]
    }
  }
}
```

## Common Use Cases

### Why Am I Not Receiving Tokens?

Use the wallet summary endpoint to check:
1. **Failed transactions**: Check `statistics.failedTransactions` - failed transactions don't transfer tokens
2. **Transaction status**: Verify transactions in `wallet.transactions` have `err: null`
3. **Token accounts**: Ensure you have the required token account created in `wallet.tokenAccounts`
4. **Correct address**: Verify the sender used your correct wallet address

### Analyzing Transaction Fees

Use the fees endpoint to:
1. Calculate total fees paid over time
2. Identify high-fee transactions
3. Understand average transaction costs
4. Track fee trends

### Tracking Liquidity Pool Positions

Use the liquidity pools endpoint to:
1. View all LP positions
2. See token pair balances
3. Calculate approximate position value
4. Track LP token holdings

## Error Responses

All endpoints may return standard HTTP error responses:

**400 Bad Request**
```json
{
  "error": "Invalid wallet address"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to fetch wallet information"
}
```

## Rate Limiting

The public Solana RPC endpoints have rate limits. For production use, consider:
- Using a paid RPC provider (Alchemy, QuickNode, Helius, etc.)
- Running your own Solana validator
- Implementing request caching

## Configuration

Configure the Solana RPC URL in your `mempool-config.json`:

```json
{
  "SOLANA": {
    "ENABLED": true,
    "RPC_URL": "https://api.mainnet-beta.solana.com"
  }
}
```

Or set the environment variable:
```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```
