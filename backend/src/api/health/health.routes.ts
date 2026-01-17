import { Application, Request, Response } from 'express';
import connectionHealth from '../connection-health';
import logger from '../../logger';

class HealthRoutes {
  public initRoutes(app: Application) {
    app
      .get('/api/v1/health/connections', this.$getConnectionHealth)
      .get('/api/v1/health/security', this.$getSecurityChecks)
      .get('/api/v1/health/full', this.$getFullHealthReport)
      ;
  }

  /**
   * GET /api/v1/health/connections
   * Test connections to all configured backend services
   */
  private async $getConnectionHealth(req: Request, res: Response) {
    try {
      const results = await connectionHealth.testAllConnections();
      res.json(results);
    } catch (error) {
      logger.err(`Error testing connections: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({
        error: 'Failed to test connections',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * GET /api/v1/health/security
   * Run security checks on the configuration
   */
  private async $getSecurityChecks(req: Request, res: Response) {
    try {
      const results = connectionHealth.runSecurityChecks();
      res.json(results);
    } catch (error) {
      logger.err(`Error running security checks: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({
        error: 'Failed to run security checks',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * GET /api/v1/health/full
   * Get a full health and security report
   */
  private async $getFullHealthReport(req: Request, res: Response) {
    try {
      const report = await connectionHealth.getFullReport();
      res.json(report);
    } catch (error) {
      logger.err(`Error generating full health report: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({
        error: 'Failed to generate full health report',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export default new HealthRoutes();
