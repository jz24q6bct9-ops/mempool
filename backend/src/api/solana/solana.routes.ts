import { Application, Request, Response } from 'express';
import SolanaApi from './solana-api';

class SolanaRoutes {
  private solanaApi: SolanaApi;

  constructor() {
    this.solanaApi = new SolanaApi();
  }

  public initRoutes(app: Application): void {
    app
      .get('/api/v1/solana/wallet/:address', this.getWalletInfo.bind(this))
      .get('/api/v1/solana/wallet/:address/balance', this.getBalance.bind(this))
      .get('/api/v1/solana/wallet/:address/tokens', this.getTokenAccounts.bind(this))
      .get('/api/v1/solana/wallet/:address/transactions', this.getTransactions.bind(this))
      .get('/api/v1/solana/wallet/:address/fees', this.getFees.bind(this))
      .get('/api/v1/solana/wallet/:address/pools', this.getLiquidityPools.bind(this))
      .get('/api/v1/solana/wallet/:address/summary', this.getWalletSummary.bind(this))
      .get('/api/v1/solana/transaction/:signature', this.getTransaction.bind(this));
  }

  private async getWalletInfo(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const walletInfo = await this.solanaApi.getWalletInfo(address);
      res.json(walletInfo);
    } catch (error) {
      console.error('Error fetching wallet info:', error);
      res.status(500).json({ error: 'Failed to fetch wallet information' });
    }
  }

  private async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const balance = await this.solanaApi.getBalance(address);
      res.json({ address, balance });
    } catch (error) {
      console.error('Error fetching balance:', error);
      res.status(500).json({ error: 'Failed to fetch balance' });
    }
  }

  private async getTokenAccounts(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const tokenAccounts = await this.solanaApi.getTokenAccounts(address);
      res.json({ address, tokenAccounts });
    } catch (error) {
      console.error('Error fetching token accounts:', error);
      res.status(500).json({ error: 'Failed to fetch token accounts' });
    }
  }

  private async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const transactions = await this.solanaApi.getTransactionHistory(address, limit);
      res.json({ address, transactions });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }

  private async getFees(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const fees = await this.solanaApi.getTransactionFees(address, limit);
      
      const totalFees = fees.reduce((sum, fee) => sum + fee.fee, 0);
      const avgFee = fees.length > 0 ? totalFees / fees.length : 0;
      
      res.json({ 
        address, 
        totalFees,
        averageFee: avgFee,
        transactionCount: fees.length,
        fees 
      });
    } catch (error) {
      console.error('Error fetching fees:', error);
      res.status(500).json({ error: 'Failed to fetch fees' });
    }
  }

  private async getLiquidityPools(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const pools = await this.solanaApi.detectLiquidityPools(address);
      res.json({ address, pools });
    } catch (error) {
      console.error('Error fetching liquidity pools:', error);
      res.status(500).json({ error: 'Failed to fetch liquidity pools' });
    }
  }

  private async getWalletSummary(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const summary = await this.solanaApi.getWalletSummary(address);
      res.json(summary);
    } catch (error) {
      console.error('Error fetching wallet summary:', error);
      res.status(500).json({ error: 'Failed to fetch wallet summary' });
    }
  }

  private async getTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { signature } = req.params;
      const transaction = await this.solanaApi.getTransaction(signature);
      res.json({ signature, transaction });
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({ error: 'Failed to fetch transaction' });
    }
  }
}

export default SolanaRoutes;
