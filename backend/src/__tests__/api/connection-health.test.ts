// Must mock before importing the module under test
jest.mock('../../config');
jest.mock('../../database');
jest.mock('../../api/bitcoin/bitcoin-client');
jest.mock('../../api/redis-cache');
jest.mock('../../logger');

import connectionHealth from '../../api/connection-health';
import config from '../../config';
import DB from '../../database';
import bitcoinClient from '../../api/bitcoin/bitcoin-client';
import redisCache from '../../api/redis-cache';

// Setup mocks after imports
const mockConfig = config as jest.Mocked<typeof config>;
const mockDB = DB as jest.Mocked<typeof DB>;
const mockBitcoinClient = bitcoinClient as any;
const mockRedisCache = redisCache as jest.Mocked<typeof redisCache>;

describe('Connection Health', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default config mock values
    (mockConfig as any).DATABASE = {
      ENABLED: true,
      USERNAME: 'testuser',
      PASSWORD: 'testpass',
      HOST: '127.0.0.1',
      PORT: 3306,
    };
    (mockConfig as any).REDIS = {
      ENABLED: false,
    };
    (mockConfig as any).MEMPOOL = {
      BACKEND: 'electrum',
      HTTP_PORT: 8999,
    };
    (mockConfig as any).CORE_RPC = {
      USERNAME: 'bitcoinuser',
      PASSWORD: 'bitcoinpass',
    };
    (mockConfig as any).ELECTRUM = {
      TLS_ENABLED: true,
    };
    (mockConfig as any).FIAT_PRICE = {
      ENABLED: true,
      API_KEY: 'test-api-key',
    };

    // Setup mock implementations
    mockDB.query = jest.fn().mockResolvedValue([[{ test: 1 }], []]);
    mockBitcoinClient.getBlockchainInfo = jest.fn().mockResolvedValue({
      chain: 'main',
      blocks: 800000,
    });
    mockRedisCache.isConnected = jest.fn().mockReturnValue(false);
  });

  describe('testBitcoinCoreConnection', () => {
    it('should successfully test Bitcoin Core connection', async () => {
      const result = await connectionHealth.testBitcoinCoreConnection();

      expect(result.service).toBe('Bitcoin Core RPC');
      expect(result.status).toBe('connected');
      expect(result.message).toContain('Connected successfully');
      expect(result.message).toContain('main');
      expect(result.message).toContain('800000');
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should handle Bitcoin Core connection errors', async () => {
      mockBitcoinClient.getBlockchainInfo.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await connectionHealth.testBitcoinCoreConnection();

      expect(result.service).toBe('Bitcoin Core RPC');
      expect(result.status).toBe('error');
      expect(result.message).toContain('Connection failed');
      expect(result.message).toContain('Connection refused');
    });
  });

  describe('testDatabaseConnection', () => {
    it('should successfully test database connection', async () => {
      const result = await connectionHealth.testDatabaseConnection();

      expect(result.service).toBe('Database (MariaDB)');
      expect(result.status).toBe('connected');
      expect(result.message).toBe('Connected successfully');
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should handle database connection errors', async () => {
      mockDB.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const result = await connectionHealth.testDatabaseConnection();

      expect(result.service).toBe('Database (MariaDB)');
      expect(result.status).toBe('error');
      expect(result.message).toContain('Connection failed');
    });
  });

  describe('testRedisConnection', () => {
    it('should report Redis as disabled when not enabled', async () => {
      const result = await connectionHealth.testRedisConnection();

      expect(result.service).toBe('Redis Cache');
      expect(result.status).toBe('disabled');
      expect(result.message).toContain('disabled');
    });
  });

  describe('runSecurityChecks', () => {
    it('should pass security check for custom credentials', () => {
      const results = connectionHealth.runSecurityChecks();

      const rpcCredCheck = results.find(r => r.check === 'Bitcoin Core RPC Credentials');
      expect(rpcCredCheck?.status).toBe('pass');

      const dbCredCheck = results.find(r => r.check === 'Database Credentials');
      expect(dbCredCheck?.status).toBe('pass');

      const tlsCheck = results.find(r => r.check === 'Electrum TLS');
      expect(tlsCheck?.status).toBe('pass');

      const apiKeyCheck = results.find(r => r.check === 'FreeCurrency API Key');
      expect(apiKeyCheck?.status).toBe('pass');
    });

    it('should include CORS warning', () => {
      const results = connectionHealth.runSecurityChecks();

      const corsCheck = results.find(r => r.check === 'CORS Configuration');
      expect(corsCheck?.status).toBe('warning');
      expect(corsCheck?.message).toContain('allows all origins');
    });
  });

  describe('testAllConnections', () => {
    it('should test all connections and return results', async () => {
      const results = await connectionHealth.testAllConnections();

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThanOrEqual(3);

      const services = results.map(r => r.service);
      expect(services).toContain('Bitcoin Core RPC');
      expect(services).toContain('Database (MariaDB)');
      expect(services).toContain('Redis Cache');
    });
  });

  describe('getFullReport', () => {
    it('should generate a full health and security report', async () => {
      const report = await connectionHealth.getFullReport();

      expect(report).toHaveProperty('connections');
      expect(report).toHaveProperty('security');
      expect(report).toHaveProperty('timestamp');

      expect(report.connections).toBeInstanceOf(Array);
      expect(report.security).toBeInstanceOf(Array);
      expect(typeof report.timestamp).toBe('string');
    });
  });
});
