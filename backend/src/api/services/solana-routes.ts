import { Application, Request, Response } from 'express';
import solanaService from './solana';
import logger from '../../logger';

class SolanaRoutes {
  public initRoutes(app: Application) {
    app
      .get('/api/v1/solana/validate-address/:address', this.validateAddress.bind(this))
      .get('/api/v1/solana/balance/:address', this.getBalance.bind(this))
      .post('/api/v1/solana/verify-signature', this.verifySignature.bind(this))
      .post('/api/v1/solana/create-transaction', this.createTransaction.bind(this))
      .post('/api/v1/solana/send-transaction', this.sendTransaction.bind(this))
      .get('/api/v1/solana/transaction-status/:signature', this.getTransactionStatus.bind(this))
      .get('/api/v1/solana/recent-blockhash', this.getRecentBlockhash.bind(this));
  }

  /**
   * Validate a Solana address
   */
  private async validateAddress(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const isValid = solanaService.isValidAddress(address);
      res.status(200).json({ valid: isValid, address });
    } catch (e) {
      logger.err('Error validating Solana address: ' + (e instanceof Error ? e.message : e));
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get balance for a Solana address
   */
  private async getBalance(req: Request, res: Response) {
    try {
      const { address } = req.params;
      
      if (!solanaService.isValidAddress(address)) {
        return res.status(400).json({ error: 'Invalid Solana address' });
      }

      const balance = await solanaService.getBalance(address);
      res.status(200).json({ address, balance });
    } catch (e) {
      logger.err('Error getting balance: ' + (e instanceof Error ? e.message : e));
      res.status(500).json({ error: 'Failed to get balance' });
    }
  }

  /**
   * Verify a message signature
   */
  private async verifySignature(req: Request, res: Response) {
    try {
      const { message, signature, publicKey } = req.body;

      if (!message || !signature || !publicKey) {
        return res.status(400).json({ error: 'Missing required fields: message, signature, publicKey' });
      }

      if (!solanaService.isValidAddress(publicKey)) {
        return res.status(400).json({ error: 'Invalid public key' });
      }

      const isValid = solanaService.verifySignature(message, signature, publicKey);
      res.status(200).json({ valid: isValid, message, publicKey });
    } catch (e) {
      logger.err('Error verifying signature: ' + (e instanceof Error ? e.message : e));
      res.status(500).json({ error: 'Failed to verify signature' });
    }
  }

  /**
   * Create a transfer transaction
   */
  private async createTransaction(req: Request, res: Response) {
    try {
      const { fromPubkey, toPubkey, amount } = req.body;

      if (!fromPubkey || !toPubkey || amount === undefined) {
        return res.status(400).json({ error: 'Missing required fields: fromPubkey, toPubkey, amount' });
      }

      if (!solanaService.isValidAddress(fromPubkey)) {
        return res.status(400).json({ error: 'Invalid sender address' });
      }

      if (!solanaService.isValidAddress(toPubkey)) {
        return res.status(400).json({ error: 'Invalid recipient address' });
      }

      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const transaction = await solanaService.createTransferTransaction(
        fromPubkey,
        toPubkey,
        amount
      );

      res.status(200).json({ 
        transaction,
        fromPubkey,
        toPubkey,
        amount 
      });
    } catch (e) {
      logger.err('Error creating transaction: ' + (e instanceof Error ? e.message : e));
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  }

  /**
   * Send a signed transaction
   */
  private async sendTransaction(req: Request, res: Response) {
    try {
      const { signedTransaction } = req.body;

      if (!signedTransaction) {
        return res.status(400).json({ error: 'Missing required field: signedTransaction' });
      }

      const signature = await solanaService.sendTransaction(signedTransaction);
      res.status(200).json({ signature });
    } catch (e) {
      logger.err('Error sending transaction: ' + (e instanceof Error ? e.message : e));
      res.status(500).json({ error: 'Failed to send transaction' });
    }
  }

  /**
   * Get transaction status
   */
  private async getTransactionStatus(req: Request, res: Response) {
    try {
      const { signature } = req.params;

      if (!signature) {
        return res.status(400).json({ error: 'Missing transaction signature' });
      }

      const status = await solanaService.getTransactionStatus(signature);
      res.status(200).json({ signature, status });
    } catch (e) {
      logger.err('Error getting transaction status: ' + (e instanceof Error ? e.message : e));
      res.status(500).json({ error: 'Failed to get transaction status' });
    }
  }

  /**
   * Get recent blockhash
   */
  private async getRecentBlockhash(req: Request, res: Response) {
    try {
      const blockhash = await solanaService.getRecentBlockhash();
      res.status(200).json({ blockhash });
    } catch (e) {
      logger.err('Error getting recent blockhash: ' + (e instanceof Error ? e.message : e));
      res.status(500).json({ error: 'Failed to get recent blockhash' });
    }
  }
}

export default new SolanaRoutes();
