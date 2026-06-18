# Solana Integration

This document describes the Solana wallet integration that enables message signing and transaction functionality.

## Features

### Backend API

The Solana backend service provides the following endpoints:

#### Address Validation
- `GET /api/v1/solana/validate-address/:address` - Validate a Solana address

#### Balance
- `GET /api/v1/solana/balance/:address` - Get the SOL balance for an address

#### Message Signing
- `POST /api/v1/solana/verify-signature` - Verify a signed message
  - Request body: `{ message, signature, publicKey }`
  - Response: `{ valid, message, publicKey }`

#### Transactions
- `POST /api/v1/solana/create-transaction` - Create a transfer transaction
  - Request body: `{ fromPubkey, toPubkey, amount }`
  - Response: `{ transaction, fromPubkey, toPubkey, amount }`

- `POST /api/v1/solana/send-transaction` - Send a signed transaction
  - Request body: `{ signedTransaction }`
  - Response: `{ signature }`

- `GET /api/v1/solana/transaction-status/:signature` - Get transaction status

#### Network
- `GET /api/v1/solana/recent-blockhash` - Get recent blockhash

### Frontend Integration

The frontend provides a Solana wallet component accessible at `/solana`.

#### Features:
1. **Wallet Connection**: Connect to Phantom or other Solana wallets
2. **Balance Display**: View SOL balance for connected wallet
3. **Message Signing**: Sign messages with your Solana wallet to prove address ownership
4. **Transaction Sending**: Send SOL to other addresses
5. **Signature Verification**: Automatically verify signed messages

## Usage

### Prerequisites

1. Install a Solana wallet browser extension (e.g., Phantom Wallet)
2. Ensure you have some SOL in your wallet (on devnet for testing)

### Connecting Your Wallet

1. Navigate to `/solana` in the application
2. Click "Connect Wallet"
3. Approve the connection request in your wallet extension

### Signing a Message

1. Enter the message you want to sign in the text area
2. Click "Sign Message"
3. Approve the signature request in your wallet
4. The signature will be displayed and automatically verified

### Sending Transactions

1. Enter the recipient's Solana address
2. Enter the amount in SOL
3. Click "Send Transaction"
4. Approve the transaction in your wallet
5. View the transaction on Solana Explorer

## Configuration

### Environment Variables

- `SOLANA_NETWORK` - Set the Solana network (default: `devnet`)
  - Options: `mainnet-beta`, `testnet`, `devnet`

### Network Endpoints

The service uses the following RPC endpoints:
- **Mainnet**: `https://api.mainnet-beta.solana.com`
- **Testnet**: `https://api.testnet.solana.com`
- **Devnet**: `https://api.devnet.solana.com`

## Security Considerations

1. **Private Keys**: Private keys never leave the wallet extension
2. **Message Signing**: Always verify the message content before signing
3. **Transactions**: Review transaction details carefully before approval
4. **Network**: Use mainnet only for production transactions

## Technical Details

### Backend Dependencies
- `@solana/web3.js` - Solana JavaScript API
- `tweetnacl` - Cryptography library for signature verification

### Frontend Dependencies
- `@solana/web3.js` - Solana JavaScript API
- `@solana/wallet-adapter-base` - Wallet adapter base
- `@solana/wallet-adapter-wallets` - Wallet adapter implementations

### Supported Wallets
- Phantom
- Solflare
- Any wallet that implements the standard Solana wallet adapter interface

## Testing

Run the backend tests:
```bash
cd backend
npm test -- --testNamePattern="Solana"
```

## Examples

### Sign a Message
```typescript
const message = "Hello, Solana!";
const { signature, publicKey } = await solanaService.signMessage(message);
console.log(`Signature: ${signature}`);
```

### Verify a Signature
```typescript
const isValid = await solanaService.verifySignature(message, signature, publicKey);
console.log(`Signature valid: ${isValid}`);
```

### Send a Transaction
```typescript
const signature = await solanaService.signAndSendTransaction(
  fromAddress,
  toAddress,
  0.1 // Amount in SOL
);
console.log(`Transaction signature: ${signature}`);
```

## Troubleshooting

### Wallet Not Detected
- Ensure a Solana wallet extension is installed
- Refresh the page after installing the extension
- Check browser console for errors

### Transaction Failures
- Verify sufficient balance (including transaction fees)
- Ensure the network is not congested
- Check that the recipient address is valid

### Connection Issues
- Check internet connectivity
- Verify the RPC endpoint is accessible
- Try switching networks (devnet/testnet/mainnet)

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify wallet extension is up to date
3. Ensure you're using a supported network
