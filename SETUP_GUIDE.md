# Mempool Setup Guide: Connecting All Components

This guide walks you through connecting all the essential components to run your own Mempool instance, including Bitcoin Core (with txindex), Electrum Server for address lookups, node RPC connections, and API keys.

**TL;DR?** Check out the [Quick Reference Card](./QUICK_REFERENCE.md) for essential config snippets and commands.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Bitcoin Core Setup (Enabling txindex)](#bitcoin-core-setup-enabling-txindex)
3. [Electrum Server Setup (For Address Lookups)](#electrum-server-setup-for-address-lookups)
4. [Database Setup](#database-setup)
5. [Mempool Backend Configuration](#mempool-backend-configuration)
6. [API Key Configuration](#api-key-configuration)
7. [Running Mempool](#running-mempool)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have:
- A server or computer with at least 8GB RAM (16GB+ recommended)
- At least 500GB free disk space (1TB+ recommended for mainnet)
- Node.js v20.x or later and npm v9.x or later
- Rust installed (required for building)
- MariaDB 10.5 or later

## Bitcoin Core Setup (Enabling txindex)

### 1. Install Bitcoin Core

Download and install Bitcoin Core from [bitcoin.org](https://bitcoin.org) or your package manager.

### 2. Configure bitcoin.conf

Create or edit your `bitcoin.conf` file (typically located at `~/.bitcoin/bitcoin.conf`) with these essential settings:

```ini
# Enable transaction indexing (REQUIRED for Mempool)
txindex=1

# Enable RPC server
server=1

# RPC credentials (change these!)
rpcuser=mempool
rpcpassword=mempool

# Optional: Increase RPC timeout for better reliability
rpcworkqueue=128

# Optional: Set data directory
# datadir=/path/to/your/bitcoin/data

# Network-specific settings
[main]
rpcbind=127.0.0.1:8332
rpcallowip=127.0.0.1

[test]
rpcbind=127.0.0.1:18332

[signet]
rpcbind=127.0.0.1:38332
```

**Important Notes:**
- `txindex=1` enables full transaction indexing, which is **required** for Mempool to function properly
- If you're adding `txindex=1` to an existing Bitcoin node, you'll need to reindex the blockchain: `bitcoind -reindex`
- Change the default RPC credentials for security!

### 3. Start Bitcoin Core

Start Bitcoin Core and wait for it to sync:

```bash
bitcoind -daemon
```

Monitor sync progress:

```bash
bitcoin-cli getblockchaininfo
```

Wait until `"verificationprogress"` reaches `0.9999...` before proceeding.

## Electrum Server Setup (For Address Lookups)

Mempool requires an Electrum Server to perform address lookups. Without it, address-related features won't work.

### Choose an Electrum Server Implementation

Pick one of these options:

1. **[romanz/electrs](https://github.com/romanz/electrs)** - Original implementation, resource-efficient
   - Memory: ~4GB RAM during sync, ~2GB RAM ongoing
   - Disk: ~40GB for index
   - Sync time: 12-24 hours on modern hardware
   - Best for: Home users, smaller deployments

2. **[cculianu/Fulcrum](https://github.com/cculianu/Fulcrum)** - Fast and performant
   - Memory: ~8GB RAM during sync, ~4GB RAM ongoing
   - Disk: ~50GB for index
   - Sync time: 6-12 hours on modern hardware
   - Best for: Production use, high-traffic instances

3. **[mempool/electrs](https://github.com/mempool/electrs)** - Mempool's fork with additional features (recommended for production)
   - Memory: ~16GB RAM during sync, ~8GB RAM ongoing
   - Disk: ~100GB for index
   - Sync time: 12-24 hours on modern hardware
   - Best for: Production Mempool instances, feature-rich deployments

### Example: Setting up romanz/electrs

```bash
# Install dependencies
sudo apt-get install clang cmake build-essential

# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Clone and build electrs
git clone https://github.com/romanz/electrs
cd electrs
cargo build --locked --release

# Run electrs (it will connect to your local bitcoind)
./target/release/electrs --db-dir ./db --daemon-dir ~/.bitcoin
```

Wait for electrs to complete its initial indexing (this can take several hours to days depending on your hardware).

### Verify Electrum Server

Check that your Electrum Server is running and responding:

```bash
# For romanz/electrs (default port 50001)
echo '{"jsonrpc":"2.0","method":"server.version","params":[],"id":0}' | netcat localhost 50001
```

## Database Setup

Mempool uses MariaDB to store historical data.

### 1. Install MariaDB

```bash
# Debian/Ubuntu
sudo apt-get install mariadb-server mariadb-client

# macOS
brew install mariadb
mysql.server start
```

### 2. Create Database and User

```bash
sudo mysql
```

Then run these SQL commands:

```sql
CREATE DATABASE mempool;
GRANT ALL PRIVILEGES ON mempool.* TO 'mempool'@'localhost' IDENTIFIED BY 'mempool';
FLUSH PRIVILEGES;
EXIT;
```

> **⚠️ SECURITY WARNING:** Change the default password `'mempool'` to something more secure in production!
> 
> Example with a strong password:
> ```sql
> GRANT ALL PRIVILEGES ON mempool.* TO 'mempool'@'localhost' IDENTIFIED BY 'your-strong-password-here';
> ```

## Mempool Backend Configuration

### 1. Clone and Build Mempool

```bash
git clone https://github.com/mempool/mempool
cd mempool

# Check out the latest release
latestrelease=$(curl -s https://api.github.com/repos/mempool/mempool/releases/latest|grep tag_name|head -1|cut -d '"' -f4)
git checkout $latestrelease

# Install and build backend
cd backend
npm install --no-install-links
npm run build
```

### 2. Configure Mempool Backend

Copy the sample configuration:

```bash
cp mempool-config.sample.json mempool-config.json
```

Edit `mempool-config.json` with your settings:

```json
{
  "MEMPOOL": {
    "NETWORK": "mainnet",
    "BACKEND": "electrum",
    "ENABLED": true,
    "HTTP_PORT": 8999
  },
  "CORE_RPC": {
    "HOST": "127.0.0.1",
    "PORT": 8332,
    "USERNAME": "mempool",
    "PASSWORD": "mempool",
    "TIMEOUT": 60000
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
    "PAID": false,
    "API_KEY": "your-api-key-from-freecurrencyapi.com"
  }
}
```

### Configuration Breakdown

| Section | Purpose | Key Settings |
|---------|---------|--------------|
| **MEMPOOL.BACKEND** | Electrum Server type | `"electrum"` for romanz/electrs or Fulcrum<br>`"esplora"` for mempool/electrs<br>`"none"` if no Electrum Server |
| **CORE_RPC** | Bitcoin node connection | HOST, PORT, USERNAME, PASSWORD from your bitcoin.conf |
| **ELECTRUM** | Electrum Server connection | HOST, PORT, TLS_ENABLED (check your Electrum Server config) |
| **DATABASE** | MariaDB connection | Credentials you created earlier |
| **FIAT_PRICE** | Price data API | API_KEY (see next section) |

### 3. Important Backend Type Selection

Set `MEMPOOL.BACKEND` based on your Electrum Server:

- **`"electrum"`** - Use if running romanz/electrs or cculianu/Fulcrum
- **`"esplora"`** - Use if running mempool/electrs (Blockstream's fork)
- **`"none"`** - Use if you don't have an Electrum Server (address lookups will be disabled)

## API Key Configuration

### Fiat Price API (Optional but Recommended)

Mempool can display Bitcoin prices in various fiat currencies. To enable this feature:

1. **Get a Free API Key:**
   - Visit [freecurrencyapi.com](https://freecurrencyapi.com)
   - Sign up for a free account
   - Copy your API key

2. **Add to Configuration:**

   Edit your `mempool-config.json`:

   ```json
   "FIAT_PRICE": {
     "ENABLED": true,
     "PAID": false,
     "API_KEY": "fca_live_yourActualAPIkeyHere123456789"
   }
   ```

3. **Alternative Services:**

   If you have a paid API key or want more frequent updates:

   ```json
   "FIAT_PRICE": {
     "ENABLED": true,
     "PAID": true,
     "API_KEY": "your-paid-api-key"
   }
   ```

**Note:** If you don't configure an API key, price data simply won't be displayed. All other features will work normally.

## Running Mempool

### 1. Start the Backend

```bash
cd backend
npm run start
```

You should see output like:

```
Mempool updated in 0.189 seconds
Updating mempool
```

### 2. Set Up the Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run build

# For development
npm run serve

# For production, serve the dist/ folder with nginx or another web server
```

### 3. Access Your Mempool Instance

Open your browser and navigate to:
- Development: `http://localhost:4200`
- Production: Your configured domain/IP

## Troubleshooting

### Bitcoin Core Not Connecting

**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:8332`

**Solutions:**
- Verify Bitcoin Core is running: `bitcoin-cli getblockchaininfo`
- Check RPC credentials in `bitcoin.conf` match `mempool-config.json`
- Ensure `server=1` is set in `bitcoin.conf`
- Check firewall rules aren't blocking port 8332

### Address Lookups Not Working

**Problem:** Address pages show "Address lookup disabled" or errors

**Solutions:**
- Verify your Electrum Server is running and fully synced
- Check `MEMPOOL.BACKEND` is set correctly (`"electrum"` or `"esplora"`, not `"none"`)
- Verify Electrum Server host/port in config matches your setup
- Test Electrum Server connection manually (see [Verify Electrum Server](#verify-electrum-server))

### txindex Not Enabled

**Problem:** Errors about missing transactions or "No such mempool or blockchain transaction"

**Solutions:**
- Ensure `txindex=1` is in your `bitcoin.conf`
- If you just added it, reindex Bitcoin Core: `bitcoind -reindex`
- Wait for reindexing to complete (can take many hours)
- Check Bitcoin Core logs: `tail -f ~/.bitcoin/debug.log`

### Database Connection Errors

**Problem:** `ER_ACCESS_DENIED_ERROR` or `ECONNREFUSED 127.0.0.1:3306`

**Solutions:**
- Verify MariaDB is running: `sudo systemctl status mariadb`
- Check database credentials in `mempool-config.json`
- Verify database and user exist: `mysql -u mempool -p mempool`
- Check MariaDB logs: `sudo journalctl -u mariadb`

### Fiat Prices Not Showing

**Problem:** Price data not displayed or API errors

**Solutions:**
- Verify your API key is correct in `mempool-config.json`
- Check API key hasn't exceeded rate limits
- Set `FIAT_PRICE.ENABLED` to `false` to disable if not needed
- Check backend logs for API-related errors

### Performance Issues

**Problem:** Slow loading, high CPU/memory usage

**Solutions:**
- Ensure txindex is fully built (not still reindexing)
- Verify Electrum Server has completed initial sync
- Increase `dbcache` in `bitcoin.conf` (e.g., `dbcache=4096`)
- Consider using mempool/electrs (faster) instead of romanz/electrs
- Allocate more RAM to MariaDB
- Use SSD storage instead of HDD

## Next Steps

Once everything is running:

1. **Set Up Frontend** - See [frontend/README.md](./frontend/README.md) for frontend setup
2. **Production Deployment** - See [production/README.md](./production/README.md) for production best practices
3. **Docker Setup** - See [docker/README.md](./docker/README.md) for containerized deployment
4. **Enable Lightning** - Configure Lightning Network integration in `mempool-config.json`

## Additional Resources

- [Main README](./README.md) - Installation methods overview
- [Backend README](./backend/README.md) - Detailed backend documentation
- [Docker README](./docker/README.md) - Docker-specific configuration
- [Production README](./production/README.md) - Enterprise setup guide
- [Mempool FAQ](https://mempool.space/docs/faq) - Frequently asked questions
- [Mempool API Documentation](https://mempool.space/docs/api) - REST API reference

## Getting Help

If you're still having issues:

1. Check the [Mempool FAQ](https://mempool.space/docs/faq)
2. Search existing [GitHub Issues](https://github.com/mempool/mempool/issues)
3. Join the community discussions
4. For production support, consider [Mempool Enterprise®](https://mempool.space/enterprise)

---

**Note:** This guide covers the most common setup scenario. Your specific environment may require additional configuration. For advanced setups (multiple networks, high-availability, etc.), refer to the [production README](./production/README.md).
