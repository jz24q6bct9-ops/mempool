# Mempool Quick Reference Card

Quick reference for connecting Mempool components. For detailed instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md).

## Essential Bitcoin Core Configuration

Add to `bitcoin.conf` (usually `~/.bitcoin/bitcoin.conf`):

```ini
# REQUIRED
txindex=1           # Enable transaction indexing
server=1            # Enable RPC server
rpcuser=mempool     # Set RPC username
rpcpassword=mempool # Set RPC password

# Recommended
dbcache=4096        # Increase cache for better performance
```

**Important:** After adding `txindex=1`, run: `bitcoind -reindex`

## Essential Mempool Configuration

Edit `backend/mempool-config.json`:

```json
{
  "MEMPOOL": {
    "NETWORK": "mainnet",
    "BACKEND": "electrum"  // or "esplora" or "none"
  },
  "CORE_RPC": {
    "HOST": "127.0.0.1",
    "PORT": 8332,
    "USERNAME": "mempool",
    "PASSWORD": "mempool"
  },
  "ELECTRUM": {
    "HOST": "127.0.0.1",
    "PORT": 50002,
    "TLS_ENABLED": true
  },
  "DATABASE": {
    "ENABLED": true,
    "HOST": "127.0.0.1",
    "PORT": 3306,
    "DATABASE": "mempool",
    "USERNAME": "mempool",
    "PASSWORD": "mempool"
  },
  "FIAT_PRICE": {
    "ENABLED": true,
    "API_KEY": "your-api-key-here"
  }
}
```

## Backend Type Selection

| Electrum Server | Backend Setting |
|----------------|-----------------|
| romanz/electrs | `"electrum"` |
| cculianu/Fulcrum | `"electrum"` |
| mempool/electrs (Blockstream) | `"esplora"` |
| None (address lookups disabled) | `"none"` |

## Common Port Numbers

| Service | Default Port |
|---------|-------------|
| Bitcoin RPC (mainnet) | 8332 |
| Bitcoin RPC (testnet) | 18332 |
| Bitcoin RPC (signet) | 38332 |
| romanz/electrs | 50001 (TCP), 50002 (SSL) |
| Fulcrum | 50001 (TCP), 50002 (SSL) |
| mempool/electrs (Esplora) | 3000 (HTTP) |
| MariaDB | 3306 |
| Mempool Backend | 8999 |

## Quick Commands

### Bitcoin Core
```bash
# Check sync status
bitcoin-cli getblockchaininfo

# Start with reindex
bitcoind -reindex

# Check if txindex is enabled
bitcoin-cli getindexinfo
```

### Database Setup
```bash
# Create database
sudo mysql
> CREATE DATABASE mempool;
> GRANT ALL PRIVILEGES ON mempool.* TO 'mempool'@'localhost' IDENTIFIED BY 'mempool';
> FLUSH PRIVILEGES;
> EXIT;
```

### Mempool Backend
```bash
# Build
cd backend
npm install --no-install-links
npm run build

# Run
npm run start
```

### Check Electrum Server
```bash
# Test connection (adjust port as needed)
echo '{"jsonrpc":"2.0","method":"server.version","params":[],"id":0}' | netcat localhost 50001
```

## API Keys

### Free Currency API (for fiat prices)
1. Get free key: https://freecurrencyapi.com
2. Add to `mempool-config.json`:
   ```json
   "FIAT_PRICE": {
     "ENABLED": true,
     "API_KEY": "fca_live_YourKeyHere"
   }
   ```

## Troubleshooting Checklist

- [ ] Bitcoin Core is running and synced
- [ ] `txindex=1` is enabled in bitcoin.conf
- [ ] `server=1` is enabled in bitcoin.conf
- [ ] RPC credentials match between bitcoin.conf and mempool-config.json
- [ ] Electrum Server is running and synced
- [ ] Electrum Server backend type is correct in mempool-config.json
- [ ] MariaDB is running
- [ ] Database and user exist with correct permissions
- [ ] All services can reach each other (no firewall blocks)

## Need More Help?

See the [Complete Setup Guide](./SETUP_GUIDE.md) for:
- Detailed step-by-step instructions
- Electrum Server setup guides
- Comprehensive troubleshooting
- Performance tuning tips

## Additional Resources

- [Main README](./README.md)
- [Backend README](./backend/README.md)
- [Docker README](./docker/README.md)
- [Production README](./production/README.md)
- [Mempool FAQ](https://mempool.space/docs/faq)
