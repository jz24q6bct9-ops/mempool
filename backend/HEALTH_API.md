# Connection Health & Security Check API

This document describes the health check and security validation endpoints added to the Mempool backend.

## Overview

The health check API provides endpoints to test connectivity to backend services (Bitcoin Core, Database, Redis) and validate security configurations. This helps operators ensure their Mempool instance is properly configured and secure.

## API Endpoints

### 1. Connection Health Check

**Endpoint:** `GET /api/v1/health/connections`

Tests connectivity to all configured backend services.

**Response Example:**
```json
[
  {
    "service": "Bitcoin Core RPC",
    "status": "connected",
    "message": "Connected successfully. Chain: main, Blocks: 800000",
    "latency": 45
  },
  {
    "service": "Database (MariaDB)",
    "status": "connected",
    "message": "Connected successfully",
    "latency": 12
  },
  {
    "service": "Redis Cache",
    "status": "disabled",
    "message": "Redis is disabled in configuration"
  }
]
```

**Status Values:**
- `connected` - Service is reachable and responding
- `error` - Connection failed (see message for details)
- `disabled` - Service is not enabled in configuration
- `warning` - Service is connected but has security warnings

### 2. Security Checks

**Endpoint:** `GET /api/v1/health/security`

Runs security validation checks on the configuration.

**Response Example:**
```json
[
  {
    "check": "Bitcoin Core RPC Credentials",
    "status": "warning",
    "message": "Using default credentials (mempool/mempool)",
    "recommendation": "Change to secure credentials in mempool-config.json"
  },
  {
    "check": "Database Credentials",
    "status": "pass",
    "message": "Custom credentials configured"
  },
  {
    "check": "Electrum TLS",
    "status": "pass",
    "message": "TLS is enabled for Electrum connection"
  },
  {
    "check": "FreeCurrency API Key",
    "status": "pass",
    "message": "API key is configured (key is never exposed in API responses)"
  },
  {
    "check": "CORS Configuration",
    "status": "warning",
    "message": "API allows all origins (Access-Control-Allow-Origin: *)",
    "recommendation": "This is intentional for a public blockchain explorer. For private instances, implement IP whitelisting or VPN access. See SECURITY.md"
  }
]
```

**Status Values:**
- `pass` - Security check passed
- `warning` - Potential security concern (see recommendation)
- `fail` - Critical security issue that should be addressed

### 3. Full Health Report

**Endpoint:** `GET /api/v1/health/full`

Returns a comprehensive report including both connection tests and security checks.

**Response Example:**
```json
{
  "connections": [...],
  "security": [...],
  "timestamp": "2024-01-17T22:30:00.000Z"
}
```

## Security Checks Performed

The security validation includes the following checks:

1. **Bitcoin Core RPC Credentials**: Warns if using default `mempool/mempool` credentials
2. **Database Credentials**: Warns if using default database credentials
3. **Electrum TLS**: Checks if TLS is enabled for Electrum connections
4. **FreeCurrency API Key**: Validates API key configuration (key is never exposed)
5. **CORS Configuration**: Notes that CORS allows all origins (expected for public instances)
6. **HTTP Port**: Reports the configured HTTP port

## Usage Examples

### Using curl

```bash
# Check all connections
curl http://localhost:8999/api/v1/health/connections

# Check security configuration
curl http://localhost:8999/api/v1/health/security

# Get full report
curl http://localhost:8999/api/v1/health/full
```

### Using in Monitoring

These endpoints can be integrated into monitoring systems to:

- Alert on connection failures
- Track service latency
- Verify security best practices
- Automate health checks in deployment pipelines

## Best Practices

1. **Run health checks after deployment** to verify all services are accessible
2. **Review security warnings** and follow recommendations where appropriate
3. **Monitor connection latency** to identify performance issues
4. **Use in CI/CD pipelines** to validate configuration before deployment
5. **Combine with nginx rate limiting** to prevent abuse of health endpoints

## Security Considerations

### Public vs Private Instances

- **Public instances**: CORS warnings are expected and safe
- **Private instances**: Follow recommendations in SECURITY.md for:
  - IP whitelisting
  - VPN access
  - Rate limiting
  - Custom credentials

### API Key Safety

The FreeCurrency API key configured in `mempool-config.json` is:
- Used only for outbound requests to fetch exchange rates
- Never exposed in API responses or logs
- Never included in health check responses

### Access Control

Consider restricting access to health endpoints in production:

```nginx
# Restrict health endpoints to localhost only
location /api/v1/health/ {
    allow 127.0.0.1;
    deny all;
    proxy_pass http://backend;
}
```

## Troubleshooting

### Connection Failures

If a connection test fails:

1. **Bitcoin Core RPC**: 
   - Verify Bitcoin Core is running
   - Check RPC credentials in `mempool-config.json`
   - Ensure `txindex=1` is set in `bitcoin.conf`

2. **Database**:
   - Verify MariaDB is running
   - Check database credentials and connection settings
   - Ensure database and user exist with proper grants

3. **Redis**:
   - Verify Redis is running if enabled
   - Check Unix socket path in configuration
   - Ensure proper file permissions on socket

### High Latency

If connection latency is high:

- Check network connectivity between services
- Monitor system resources (CPU, memory, disk I/O)
- Consider using Unix sockets for local connections
- Review database query performance

## Related Documentation

- [SECURITY.md](/SECURITY.md) - Comprehensive security guidance
- [backend/README.md](/backend/README.md) - Backend setup instructions
- [production/nginx/README-SECURITY.md](/production/nginx/README-SECURITY.md) - Nginx security configuration

## Version

This feature was added in Mempool v3.3-dev.
