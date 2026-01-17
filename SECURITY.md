# Security Policy for Mempool API

## Overview

This document provides security guidance for self-hosted Mempool instances, addressing API access control, rate limiting, and best practices to protect your deployment.

## Connection Health & Security Checks

Mempool includes built-in health check and security validation endpoints. These help you verify connectivity and identify potential security issues.

**Health Check Endpoints:**
- `/api/v1/health/connections` - Test backend service connections
- `/api/v1/health/security` - Run security configuration checks  
- `/api/v1/health/full` - Complete health and security report

See [backend/HEALTH_API.md](./backend/HEALTH_API.md) for detailed documentation.

## API Security Status

### Current Security Measures

The Mempool API is designed as a **public blockchain explorer API** by default. The following security measures are in place:

#### 1. Internal Endpoint Protection
- **Protected Endpoints**: `/api/v1/internal/*` and `/api/internal/*`
- **Access Control**: Restricted to localhost (127.0.0.1, ::1) only
- **Configuration**: See `production/nginx/http-acl.conf`

#### 2. CORS Configuration
- **Default**: Allows all origins (`Access-Control-Allow-Origin: *`)
- **Purpose**: Enables public blockchain data access from web browsers
- **Location**: `backend/src/index.ts` (in the startServer method)

#### 3. External API Keys
- **FreeCurrency API Key**: Used internally to fetch fiat exchange rates
- **Security**: Never exposed in API responses, only used for outbound requests
- **Configuration**: `FIAT_PRICE.API_KEY` in `mempool-config.json`

### What is Publicly Accessible?

By default, the following API endpoints are **publicly accessible** without authentication:

1. **Blockchain Data**: `/api/v1/block/*`, `/api/v1/tx/*`, `/api/v1/address/*`
2. **Mempool Data**: `/api/v1/fees/*`, `/api/v1/mempool/*`
3. **Statistics**: `/api/v1/statistics/*`
4. **Mining**: `/api/v1/mining/*`
5. **Prices**: `/api/v1/prices` (aggregated data, no API keys exposed)
6. **Lightning Network**: `/api/v1/lightning/*` (if enabled)

This is **intentional** - mempool is a blockchain explorer that provides public blockchain data.

## Security Recommendations

### 1. Network-Level Protection

#### Use a Firewall
Restrict access to your Mempool instance at the network level:

```bash
# Example using ufw (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from trusted.ip.address to any port 80
sudo ufw allow from trusted.ip.address to any port 443
sudo ufw enable
```

#### Use a VPN
Deploy Mempool behind a VPN for private access:
- WireGuard
- OpenVPN
- Tailscale
- ZeroTier

### 2. Rate Limiting (Recommended)

Add rate limiting to prevent abuse and API overload. Add to your nginx configuration:

```nginx
# In http block of nginx.conf
http {
    # Define rate limiting zones
    limit_req_zone $binary_remote_addr zone=api_general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api_expensive:10m rate=1r/s;
    
    # Your existing configuration...
}

# In server block or location blocks
server {
    # Apply general rate limit to all API endpoints
    location /api/ {
        limit_req zone=api_general burst=20 nodelay;
        limit_req_status 429;
        
        # Your existing proxy configuration...
    }
    
    # Stricter limits for expensive endpoints
    location ~* ^/api/v1/(address|txs|blocks)/ {
        limit_req zone=api_expensive burst=5 nodelay;
        limit_req_status 429;
        
        # Your existing proxy configuration...
    }
}
```

### 3. IP Whitelisting

Restrict API access to specific IP addresses or networks:

```nginx
# In http block
geo $allowed_ip {
    default 0;
    127.0.0.1 1;
    your.trusted.ip.address 1;
    10.0.0.0/8 1;  # Your internal network
}

# In server block
server {
    location /api/ {
        if ($allowed_ip = 0) {
            return 403;
        }
        # Your existing proxy configuration...
    }
}
```

### 4. API Key Authentication (Advanced)

If you need API key authentication, implement it at the nginx level:

```nginx
# In http block
map $http_x_api_key $api_client_name {
    default "";
    "your-secret-api-key-here" "client1";
    "another-secret-key" "client2";
}

# In server block
server {
    location /api/ {
        if ($api_client_name = "") {
            return 401 "Unauthorized: API key required";
        }
        
        # Log API usage per client
        access_log /var/log/nginx/api-access.log combined;
        
        # Your existing proxy configuration...
    }
}
```

### 5. HTTPS/TLS Configuration

Always use HTTPS in production:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    
    # Modern TLS configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    
    # Your existing configuration...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

### 6. Secure External API Keys

Protect your FreeCurrency API key and other secrets:

#### Environment Variables (Recommended)
```bash
# Set in your environment
export MEMPOOL_FIAT_API_KEY="your-secret-key"

# Modify your mempool-config.json to reference it
# Or use a startup script to inject it
```

#### File Permissions
```bash
chmod 600 /path/to/mempool-config.json
chown mempool:mempool /path/to/mempool-config.json
```

#### Never Commit Secrets
```bash
# Add to .gitignore
echo "mempool-config.json" >> .gitignore
echo ".env" >> .gitignore
```

### 7. Monitoring and Alerting

Monitor your API for suspicious activity:

```bash
# Watch for high request rates
tail -f /var/log/nginx/access.log | grep -E "/api/v1/"

# Count requests per IP
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# Monitor failed authentication attempts (if you add auth)
grep "401\|403\|429" /var/log/nginx/access.log
```

## Frequently Asked Questions

### Q: Is my API key exposed when the backend server runs?
**A: No.** The FreeCurrency API key configured in `FIAT_PRICE.API_KEY` is used only for outbound requests to fetch exchange rates. It is never included in API responses or logs. Your API key is safe.

### Q: Can anyone access my mempool API?
**A: Yes, by default.** Mempool is designed as a public blockchain explorer. If you need private access, implement one or more of the security measures above (firewall, VPN, rate limiting, IP whitelisting, or API key authentication).

### Q: Should I restrict access to my mempool instance?
**A: It depends on your use case:**
- **Public explorer**: No restrictions needed, but add rate limiting
- **Personal/team use**: Use VPN or IP whitelisting
- **Production API**: Add rate limiting, monitoring, and consider API keys
- **Enterprise**: All of the above plus WAF, DDoS protection, and SOC monitoring

### Q: What data does the mempool API expose?
**A: Only public blockchain data.** Everything exposed by the API is already publicly available on the blockchain. No private keys, wallet balances (that aren't publicly visible), or sensitive data are exposed.

### Q: How do I know if someone is abusing my API?
Monitor nginx access logs for:
- High request rates from single IPs
- Unusual endpoint access patterns
- Failed requests (429, 403 status codes)
- Requests to non-existent endpoints

## Security Disclosure

If you discover a security vulnerability in Mempool, please report it to the maintainers:
- Check the main repository for security contact information
- DO NOT open a public issue for security vulnerabilities
- Use responsible disclosure practices

## Additional Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [nginx Rate Limiting Guide](https://www.nginx.com/blog/rate-limiting-nginx/)
- [Bitcoin API Security Best Practices](https://bitcoin.org/en/developer-guide#api-calls)

## Version

This security policy applies to Mempool v3.x and later. For older versions, consult the documentation for that specific release.

---

**Last Updated**: January 2026
