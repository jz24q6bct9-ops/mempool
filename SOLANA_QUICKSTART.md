# Solana Wallet Tracking - Quick Start Guide

## For Wallet: 7eZtWvAq38EioSGmwP5VPVbE5va5jWmj1wZcfkxmStBZ

This guide explains how to use the new Solana tracking features to understand your token transactions, fees, and liquidity pool positions.

## Accessing Your Wallet Dashboard

Once the application is running, navigate to:

```
http://localhost:4200/solana/wallet/7eZtWvAq38EioSGmwP5VPVbE5va5jWmj1wZcfkxmStBZ
```

Or on the production server:
```
https://your-domain.com/solana/wallet/7eZtWvAq38EioSGmwP5VPVbE5va5jWmj1wZcfkxmStBZ
```

## What You'll See

### 1. Balance Overview
- **SOL Balance**: Your current SOL holdings
- **Token Accounts**: Number of different SPL tokens you hold
- **Total Transactions**: All transactions involving your wallet
- **Success Rate**: Percentage of successful vs failed transactions

### 2. Fee Analysis
- **Total Fees Paid**: Sum of all transaction fees
- **Transaction Count**: Number of transactions analyzed
- **Average Fee**: Mean fee per transaction

This helps you understand exactly how much you're spending on transaction fees.

### 3. Token Holdings (SPL Tokens)
A complete list of all SPL tokens in your wallet, showing:
- Token mint address
- Raw amount
- Decimals
- Human-readable amount (UI Amount)

### 4. Recent Transactions
Your latest transactions with:
- Transaction signature (for verification on Solana Explorer)
- Timestamp
- Status (Success/Failed)
- Slot number

### 5. Liquidity Pool Positions
Any liquidity provider positions you have in protocols like Raydium or Orca.

### 6. Key Insights Section

This section specifically addresses common questions:

**Why you might not receive tokens:**
- Failed transactions don't transfer tokens (check your failed transaction count)
- Transaction fees are always deducted, even for failed transactions
- Verify the sender actually completed the transaction successfully
- Ensure the correct wallet address was used
- Some tokens require associated token accounts to be created first

**On-chain proof:**
- All displayed data comes directly from the Solana blockchain
- Every transaction signature can be verified on Solana Explorer
- This provides indisputable proof of what happened on-chain

**Real profit calculation:**
- Shows your current SOL balance
- Subtracts total fees paid
- Lists all token holdings for complete picture

## Using the API Directly

You can also query the API endpoints directly:

### Get Complete Wallet Summary
```bash
curl http://localhost:8999/api/v1/solana/wallet/7eZtWvAq38EioSGmwP5VPVbE5va5jWmj1wZcfkxmStBZ/summary
```

### Get Just Balance
```bash
curl http://localhost:8999/api/v1/solana/wallet/7eZtWvAq38EioSGmwP5VPVbE5va5jWmj1wZcfkxmStBZ/balance
```

### Get Token Holdings
```bash
curl http://localhost:8999/api/v1/solana/wallet/7eZtWvAq38EioSGmwP5VPVbE5va5jWmj1wZcfkxmStBZ/tokens
```

### Get Fee Analysis
```bash
curl http://localhost:8999/api/v1/solana/wallet/7eZtWvAq38EioSGmwP5VPVbE5va5jWmj1wZcfkxmStBZ/fees
```

### Get Transaction History
```bash
curl http://localhost:8999/api/v1/solana/wallet/7eZtWvAq38EioSGmwP5VPVbE5va5jWmj1wZcfkxmStBZ/transactions?limit=50
```

## Troubleshooting Token Receipt Issues

If tokens aren't appearing in your wallet:

### 1. Check Transaction Status
Look at the "Recent Transactions" section. Failed transactions (marked in red) do NOT transfer tokens.

### 2. Verify Transaction on Solana Explorer
Copy any transaction signature and search for it on:
- https://explorer.solana.com/
- https://solscan.io/

This provides independent verification of what happened.

### 3. Check Fee Deductions
Even failed transactions consume fees. Check the "Fee Analysis" section to see how much has been spent on fees.

### 4. Verify Token Accounts
Check the "Token Holdings" section. If you don't see a token account for the expected token mint, you may need to create an associated token account first.

### 5. Confirm Correct Address
Double-check that the sender used the correct wallet address:
```
7eZtWvAq38EioSGmwP5VPVbE5va5jWmj1wZcfkxmStBZ
```

### 6. Contact the Sender
Share the transaction signature with the sender so they can verify:
- Their transaction succeeded (not just pending)
- They sent to the correct address
- They sent the expected token and amount

## Understanding Liquidity Pool Positions

If you've provided liquidity to DEXes like Raydium or Orca, the "Liquidity Pool Positions" section will show:
- Which pools you're in
- Token pair composition
- LP token amounts
- Approximate value (when available)

Note: To withdraw liquidity or see more detailed information, you'll need to use the specific DEX interface (Raydium.io, Orca.so, etc.).

## Configuration

The system uses the public Solana RPC endpoint by default. For better performance and reliability, you can configure a private RPC endpoint in `backend/mempool-config.json`:

```json
{
  "SOLANA": {
    "ENABLED": true,
    "RPC_URL": "https://your-private-rpc-endpoint.com"
  }
}
```

## Support

For more detailed API documentation, see [SOLANA_API.md](./SOLANA_API.md)

For general Mempool support, see [README.md](./README.md)
