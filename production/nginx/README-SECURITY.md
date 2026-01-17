# Nginx Configuration for Mempool

This directory contains nginx configuration files for deploying Mempool in production.

## Security Configurations

### Rate Limiting (NEW)

To protect your Mempool instance from API abuse, we now provide rate limiting configurations:

#### Files:
- `http-rate-limit.conf` - Rate limit zone definitions (include in http block)
- `location-api-rate-limited.conf` - Example rate-limited API locations

#### Quick Start:

1. **Add rate limiting to your nginx.conf:**

```nginx
http {
    # Your existing configuration...
    
    # Add rate limiting zones
    include mempool/production/nginx/http-rate-limit.conf;
    
    # Your existing configuration...
    
    server {
        # Your existing configuration...
        
        # EITHER modify location-api.conf to add rate limits
        # OR include the rate-limited example:
        include mempool/production/nginx/location-api-rate-limited.conf;
    }
}
```

2. **Test and reload:**

```bash
sudo nginx -t
sudo nginx -s reload
```

3. **Monitor rate limiting:**

```bash
# Watch for rate limit events in error log
sudo tail -f /var/log/nginx/error.log | grep "limiting requests"

# Check for 429 responses in access log
sudo tail -f /var/log/nginx/access.log | grep " 429 "
```

### API Security

For comprehensive API security guidance, see:
- `../../SECURITY.md` - Complete security policy and best practices
- Includes rate limiting, IP whitelisting, VPN setup, and more

## Configuration Files

### HTTP-Level Configuration (include in http block)

- `http-basic.conf` - Basic HTTP settings
- `http-acl.conf` - Access control lists for internal APIs
- `http-proxy-cache.conf` - Proxy cache configuration
- `http-language.conf` - Language detection
- `http-rate-limit.conf` - **NEW** Rate limiting zones

### Server-Level Configuration

- `nginx.conf` - Main nginx configuration template
- `server-mempool.conf` - Mempool server configuration
- `server-liquid.conf` - Liquid server configuration
- `server-esplora.conf` - Esplora server configuration
- `server-common.conf` - Common server settings

### Location-Level Configuration

- `location-api.conf` - API endpoint routing and caching
- `location-api-rate-limited.conf` - **NEW** API endpoints with rate limiting
- `location-api-v1-services.conf` - Services API routing
- `location-api-v1-lightning.conf` - Lightning API routing
- `location-redirects.conf` - URL redirects
- And various network-specific location files...

### Upstream Configuration

- `upstream-mempool.conf` - Mempool backend upstream definitions
- `upstream-esplora.conf` - Esplora backend upstream definitions

## Customization

### Adjusting Rate Limits

Edit `http-rate-limit.conf` to adjust the rate limits:

```nginx
# Example: Increase general API limit to 20 req/s
limit_req_zone $binary_remote_addr zone=api_general:10m rate=20r/s;

# Example: Decrease expensive operations to 0.5 req/s (30 requests per minute)
limit_req_zone $binary_remote_addr zone=api_expensive:10m rate=30r/m;
```

### Burst Configuration

In `location-api-rate-limited.conf`, adjust burst values:

```nginx
# Allow more burst requests (default is 20)
limit_req zone=api_general burst=50 nodelay;

# Reduce burst for expensive operations (default is 5)
limit_req zone=api_expensive burst=3 nodelay;
```

### Disabling Rate Limiting

To disable rate limiting completely:
1. Do not include `http-rate-limit.conf` in your nginx.conf
2. Use `location-api.conf` instead of `location-api-rate-limited.conf`

## Monitoring

### Check Rate Limit Status

```bash
# View active connections and limits
curl -s http://localhost/nginx_status | grep "Active connections"

# Monitor rate limit events
sudo journalctl -u nginx -f | grep "limiting"

# Analyze top requesting IPs
sudo awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20
```

### Performance Impact

Rate limiting has minimal performance impact:
- Shared memory zone: 10MB per zone (supports ~160,000 IP addresses)
- Processing overhead: Negligible (< 1% CPU)
- Memory overhead: ~62 bytes per tracked IP

## Troubleshooting

### Issue: Legitimate users getting rate limited

**Solution**: Increase burst values or whitelist specific IPs:

```nginx
geo $ratelimit_exempt {
    default 1;
    trusted.ip.address 0;
    10.0.0.0/8 0;
}

map $ratelimit_exempt $limit_key {
    0 "";
    1 $binary_remote_addr;
}

limit_req_zone $limit_key zone=api_general:10m rate=10r/s;
```

### Issue: Need different limits for authenticated users

**Solution**: Use API keys or authentication tokens to set different zones:

```nginx
map $http_x_api_key $api_tier {
    default "standard";
    "premium-key-here" "premium";
}

map $api_tier $rate_limit_zone {
    "standard" $binary_remote_addr;
    "premium" "";  # No rate limit for premium
}

limit_req_zone $rate_limit_zone zone=api_general:10m rate=10r/s;
```

## Additional Resources

- [Mempool Security Policy](../../SECURITY.md)
- [Nginx Rate Limiting Documentation](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html)
- [Nginx Security Best Practices](https://docs.nginx.com/nginx/admin-guide/security-controls/)

## Support

For issues or questions:
1. Check the main Mempool repository documentation
2. Review nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Open an issue on GitHub with your configuration and error logs

---

**Important**: Always test configuration changes with `sudo nginx -t` before reloading nginx in production.
