# Quick Start: Solana Message Signing

This guide helps you quickly get started with the new Solana integration.

## What This Does

This feature lets you:
- Connect your Solana wallet (like Phantom)
- Sign messages to prove you own a Solana address
- Send SOL transactions to other addresses
- Verify message signatures

## Quick Setup (3 Steps)

### 1. Install a Wallet
If you don't have one yet:
- Install [Phantom Wallet](https://phantom.app/) browser extension
- Create or import a wallet
- Get some devnet SOL for testing from [Solana Faucet](https://faucet.solana.com/)

### 2. Access the Feature
- Navigate to `/solana` in the application
- Click "Connect Wallet"
- Approve the connection in your wallet extension

### 3. Start Using
You can now:
- **View Balance**: See your SOL balance automatically
- **Sign Message**: Enter text and click "Sign Message"
- **Send SOL**: Enter recipient address and amount, then click "Send Transaction"

## Example: Signing a Message

1. Type your message: `"Hello from Solana!"`
2. Click **Sign Message**
3. Approve in your wallet
4. See the signature and verification result

The signature proves you control the Solana address without revealing your private key!

## Example: Sending SOL

1. Paste recipient address (e.g., from another wallet)
2. Enter amount: `0.1` SOL
3. Click **Send Transaction**
4. Approve in your wallet
5. Get transaction signature
6. Click "View on Solana Explorer" to see on blockchain

## Network Configuration

By default, the app uses Solana **devnet** (test network).

To change network, set environment variable:
```bash
export SOLANA_NETWORK=mainnet-beta  # for production
export SOLANA_NETWORK=testnet       # for testing
export SOLANA_NETWORK=devnet        # for development (default)
```

⚠️ **Important**: Always test on devnet first before using mainnet!

## Troubleshooting

**"No Solana Wallet Detected"**
- Install Phantom or another Solana wallet extension
- Refresh the page after installation

**"Transaction Failed"**
- Check you have enough SOL (including ~0.000005 SOL for fees)
- Verify the recipient address is valid
- Try again in a few seconds if network is busy

**"Failed to connect wallet"**
- Make sure your wallet is unlocked
- Try disconnecting and reconnecting
- Check browser console for errors

## Security Notes

✅ **Safe**:
- Your private keys never leave your wallet
- Messages are signed locally in your browser
- All transactions require your approval

⚠️ **Be Careful**:
- Always verify what you're signing
- Double-check recipient addresses
- Start with small amounts on testnet

## API Endpoints

If you want to integrate programmatically:

- `GET /api/v1/solana/balance/:address` - Get balance
- `POST /api/v1/solana/verify-signature` - Verify signature
- `POST /api/v1/solana/create-transaction` - Create transaction
- `POST /api/v1/solana/send-transaction` - Send transaction

See [SOLANA_INTEGRATION.md](./SOLANA_INTEGRATION.md) for full API documentation.

## Need Help?

1. Check the [Full Documentation](./SOLANA_INTEGRATION.md)
2. Look at browser console for error messages
3. Verify your wallet is connected and unlocked
4. Make sure you're on the right network (devnet/testnet/mainnet)

## What's Next?

Once you're comfortable with the basics:
- Try sending transactions on testnet
- Integrate signature verification into your workflow
- Explore the API endpoints for custom integrations
- Move to mainnet when ready for production

Happy signing! 🎉
