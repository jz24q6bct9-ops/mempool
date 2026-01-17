import config from '../config';
import DB from '../database';
import logger from '../logger';
import bitcoinClient from './bitcoin/bitcoin-client';
import redisCache from './redis-cache';

export interface ConnectionTestResult {
  service: string;
  status: 'connected' | 'error' | 'disabled' | 'warning';
  message: string;
  latency?: number;
  securityWarnings?: string[];
}

export interface SecurityCheckResult {
  check: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  recommendation?: string;
}

class ConnectionHealth {
  /**
   * Test Bitcoin Core RPC connection
   */
  async testBitcoinCoreConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const securityWarnings: string[] = [];

    try {
      // Test connection by getting blockchain info
      const info = await bitcoinClient.getBlockchainInfo();
      const latency = Date.now() - startTime;

      if (info && typeof info.blocks === 'number') {
        return {
          service: 'Bitcoin Core RPC',
          status: 'connected',
          message: `Connected successfully. Chain: ${info.chain}, Blocks: ${info.blocks}`,
          latency,
          securityWarnings: securityWarnings.length > 0 ? securityWarnings : undefined,
        };
      } else {
        return {
          service: 'Bitcoin Core RPC',
          status: 'error',
          message: 'Unexpected response from Bitcoin Core',
          latency,
        };
      }
    } catch (error) {
      return {
        service: 'Bitcoin Core RPC',
        status: 'error',
        message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * Test Database connection
   */
  async testDatabaseConnection(): Promise<ConnectionTestResult> {
    if (!config.DATABASE.ENABLED) {
      return {
        service: 'Database (MariaDB)',
        status: 'disabled',
        message: 'Database is disabled in configuration',
      };
    }

    const startTime = Date.now();
    const securityWarnings: string[] = [];

    try {
      await DB.query('SELECT 1 as test', []);
      const latency = Date.now() - startTime;

      return {
        service: 'Database (MariaDB)',
        status: 'connected',
        message: 'Connected successfully',
        latency,
        securityWarnings: securityWarnings.length > 0 ? securityWarnings : undefined,
      };
    } catch (error) {
      return {
        service: 'Database (MariaDB)',
        status: 'error',
        message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * Test Redis connection
   */
  async testRedisConnection(): Promise<ConnectionTestResult> {
    if (!config.REDIS.ENABLED) {
      return {
        service: 'Redis Cache',
        status: 'disabled',
        message: 'Redis is disabled in configuration',
      };
    }

    const startTime = Date.now();

    try {
      const isConnected = redisCache.isConnected();
      const latency = Date.now() - startTime;

      if (isConnected) {
        return {
          service: 'Redis Cache',
          status: 'connected',
          message: 'Connected successfully',
          latency,
        };
      } else {
        return {
          service: 'Redis Cache',
          status: 'error',
          message: 'Redis client is not connected',
          latency,
        };
      }
    } catch (error) {
      return {
        service: 'Redis Cache',
        status: 'error',
        message: `Connection check failed: ${error instanceof Error ? error.message : String(error)}`,
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * Run security checks on configuration
   */
  runSecurityChecks(): SecurityCheckResult[] {
    const results: SecurityCheckResult[] = [];

    // Check for default credentials
    if (config.CORE_RPC.USERNAME === 'mempool' && config.CORE_RPC.PASSWORD === 'mempool') {
      results.push({
        check: 'Bitcoin Core RPC Credentials',
        status: 'warning',
        message: 'Using default credentials (mempool/mempool)',
        recommendation: 'Change to secure credentials in mempool-config.json',
      });
    } else {
      results.push({
        check: 'Bitcoin Core RPC Credentials',
        status: 'pass',
        message: 'Custom credentials configured',
      });
    }

    // Check database credentials
    if (config.DATABASE.ENABLED) {
      if (config.DATABASE.USERNAME === 'mempool' && config.DATABASE.PASSWORD === 'mempool') {
        results.push({
          check: 'Database Credentials',
          status: 'warning',
          message: 'Using default credentials (mempool/mempool)',
          recommendation: 'Change to secure credentials in mempool-config.json',
        });
      } else {
        results.push({
          check: 'Database Credentials',
          status: 'pass',
          message: 'Custom credentials configured',
        });
      }
    }

    // Check Electrum TLS
    if (config.MEMPOOL.BACKEND === 'electrum') {
      if (config.ELECTRUM.TLS_ENABLED) {
        results.push({
          check: 'Electrum TLS',
          status: 'pass',
          message: 'TLS is enabled for Electrum connection',
        });
      } else {
        results.push({
          check: 'Electrum TLS',
          status: 'warning',
          message: 'TLS is disabled for Electrum connection',
          recommendation: 'Enable TLS in mempool-config.json for secure communication',
        });
      }
    }

    // Check API key security
    if (config.FIAT_PRICE.ENABLED) {
      if (!config.FIAT_PRICE.API_KEY || config.FIAT_PRICE.API_KEY === '' || config.FIAT_PRICE.API_KEY.includes('your-api-key')) {
        results.push({
          check: 'FreeCurrency API Key',
          status: 'warning',
          message: 'API key not configured or using default placeholder',
          recommendation: 'Configure a valid API key from freecurrencyapi.com in mempool-config.json',
        });
      } else {
        results.push({
          check: 'FreeCurrency API Key',
          status: 'pass',
          message: 'API key is configured (key is never exposed in API responses)',
        });
      }
    }

    // Check CORS configuration
    results.push({
      check: 'CORS Configuration',
      status: 'warning',
      message: 'API allows all origins (Access-Control-Allow-Origin: *)',
      recommendation: 'This is intentional for a public blockchain explorer. For private instances, implement IP whitelisting or VPN access. See SECURITY.md',
    });

    // Check if running on default port
    if (config.MEMPOOL.HTTP_PORT === 8999) {
      results.push({
        check: 'HTTP Port',
        status: 'pass',
        message: 'Using default port 8999',
      });
    } else {
      results.push({
        check: 'HTTP Port',
        status: 'pass',
        message: `Using custom port ${config.MEMPOOL.HTTP_PORT}`,
      });
    }

    return results;
  }

  /**
   * Test all connections
   */
  async testAllConnections(): Promise<ConnectionTestResult[]> {
    const results: ConnectionTestResult[] = [];

    // Test Bitcoin Core
    results.push(await this.testBitcoinCoreConnection());

    // Test Database
    results.push(await this.testDatabaseConnection());

    // Test Redis
    results.push(await this.testRedisConnection());

    return results;
  }

  /**
   * Get a full health and security report
   */
  async getFullReport(): Promise<{
    connections: ConnectionTestResult[];
    security: SecurityCheckResult[];
    timestamp: string;
  }> {
    const connections = await this.testAllConnections();
    const security = this.runSecurityChecks();

    return {
      connections,
      security,
      timestamp: new Date().toISOString(),
    };
  }
}

export default new ConnectionHealth();
