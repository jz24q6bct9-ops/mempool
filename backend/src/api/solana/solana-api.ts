import axios from 'axios';
import config from '../../config';
import {
  SolanaTransaction,
  SolanaTokenAccount,
  SolanaWalletInfo,
  LiquidityPoolPosition,
  TransactionFees
} from './solana-api.interface';

// Constants
const SPL_MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

class SolanaApi {
  private rpcUrl: string;
  
  constructor() {
    // Use config or fall back to environment variable
    this.rpcUrl = config.SOLANA.RPC_URL || process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  }

  /**
   * Make RPC call to Solana node
   */
  private async rpcCall(method: string, params: any[] = []): Promise<any> {
    try {
      const response = await axios.post(this.rpcUrl, {
        jsonrpc: '2.0',
        id: 1,
        method,
        params
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.error) {
        throw new Error(`RPC Error: ${response.data.error.message}`);
      }
      
      return response.data.result;
    } catch (error) {
      console.error(`Solana RPC call failed for ${method}:`, error);
      throw error;
    }
  }

  /**
   * Get wallet balance in SOL
   */
  async getBalance(address: string): Promise<number> {
    const result = await this.rpcCall('getBalance', [address]);
    return result.value / 1e9; // Convert lamports to SOL
  }

  /**
   * Get token accounts owned by wallet
   */
  async getTokenAccounts(address: string): Promise<SolanaTokenAccount[]> {
    const result = await this.rpcCall('getTokenAccountsByOwner', [
      address,
      { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
      { encoding: 'jsonParsed' }
    ]);

    return result.value.map((account: any) => {
      const parsedInfo = account.account.data.parsed.info;
      return {
        pubkey: account.pubkey,
        mint: parsedInfo.mint,
        owner: parsedInfo.owner,
        amount: parsedInfo.tokenAmount.amount,
        decimals: parsedInfo.tokenAmount.decimals,
        uiAmount: parsedInfo.tokenAmount.uiAmount
      };
    });
  }

  /**
   * Get transaction signatures for address
   */
  async getSignaturesForAddress(address: string, limit: number = 20): Promise<string[]> {
    const result = await this.rpcCall('getSignaturesForAddress', [
      address,
      { limit }
    ]);
    
    return result.map((sig: any) => sig.signature);
  }

  /**
   * Get transaction details
   */
  async getTransaction(signature: string): Promise<any> {
    const result = await this.rpcCall('getTransaction', [
      signature,
      { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
    ]);
    
    return result;
  }

  /**
   * Get transaction history with details
   */
  async getTransactionHistory(address: string, limit: number = 20): Promise<SolanaTransaction[]> {
    const signatures = await this.getSignaturesForAddress(address, limit);
    const transactions: SolanaTransaction[] = [];

    for (const signature of signatures) {
      try {
        const txDetails = await this.getTransaction(signature);
        if (txDetails) {
          transactions.push({
            signature,
            slot: txDetails.slot,
            blockTime: txDetails.blockTime,
            confirmationStatus: txDetails.confirmationStatus,
            err: txDetails.meta?.err || null,
            memo: this.extractMemo(txDetails)
          });
        }
      } catch (error) {
        console.error(`Failed to get transaction ${signature}:`, error);
      }
    }

    return transactions;
  }

  /**
   * Extract memo from transaction
   */
  private extractMemo(txDetails: any): string | undefined {
    try {
      const instructions = txDetails.transaction?.message?.instructions || [];
      for (const instruction of instructions) {
        if (instruction.program === 'spl-memo' || instruction.programId?.toString() === SPL_MEMO_PROGRAM_ID) {
          return instruction.parsed || instruction.data;
        }
      }
    } catch (error) {
      // Ignore memo extraction errors
    }
    return undefined;
  }

  /**
   * Get comprehensive wallet information
   */
  async getWalletInfo(address: string): Promise<SolanaWalletInfo> {
    const [balance, tokenAccounts, transactions] = await Promise.all([
      this.getBalance(address),
      this.getTokenAccounts(address),
      this.getTransactionHistory(address, 20)
    ]);

    return {
      address,
      balance,
      tokenAccounts,
      transactions
    };
  }

  /**
   * Analyze transaction fees for an address
   */
  async getTransactionFees(address: string, limit: number = 50): Promise<TransactionFees[]> {
    const signatures = await this.getSignaturesForAddress(address, limit);
    const fees: TransactionFees[] = [];

    for (const signature of signatures) {
      try {
        const txDetails = await this.getTransaction(signature);
        if (txDetails && txDetails.meta) {
          // Use the fee payer from transaction if available, otherwise assume first account is fee payer
          const feePayer = txDetails.transaction?.message?.accountKeys?.[0]?.pubkey?.toString() || address;
          fees.push({
            signature,
            fee: txDetails.meta.fee / 1e9, // Convert lamports to SOL
            feePayer,
            blockTime: txDetails.blockTime
          });
        }
      } catch (error) {
        console.error(`Failed to get fees for transaction ${signature}:`, error);
      }
    }

    return fees;
  }

  /**
   * Detect liquidity pool positions
   * Note: This is a placeholder implementation. Full LP detection requires protocol-specific logic
   * and integration with DEX APIs (Raydium, Orca, etc.). For production use, consider integrating
   * with services like Jupiter Aggregator API or protocol-specific SDKs.
   */
  async detectLiquidityPools(address: string): Promise<LiquidityPoolPosition[]> {
    // Placeholder: Returns empty array until proper implementation
    // TODO: Implement actual LP detection by:
    // 1. Querying known LP token mints
    // 2. Checking token accounts for LP tokens
    // 3. Fetching pool data from DEX programs
    // 4. Calculating position values
    return [];
  }

  /**
   * Get a summary of wallet activity including profit/loss analysis
   */
  async getWalletSummary(address: string): Promise<any> {
    const [walletInfo, fees, lpPositions] = await Promise.all([
      this.getWalletInfo(address),
      this.getTransactionFees(address, 100),
      this.detectLiquidityPools(address)
    ]);

    const totalFees = fees.reduce((sum, fee) => sum + fee.fee, 0);
    const successfulTxs = walletInfo.transactions.filter(tx => !tx.err).length;
    const failedTxs = walletInfo.transactions.filter(tx => tx.err).length;

    return {
      wallet: walletInfo,
      fees: {
        total: totalFees,
        count: fees.length,
        average: fees.length > 0 ? totalFees / fees.length : 0,
        breakdown: fees
      },
      liquidityPools: lpPositions,
      statistics: {
        totalTransactions: walletInfo.transactions.length,
        successfulTransactions: successfulTxs,
        failedTransactions: failedTxs,
        successRate: walletInfo.transactions.length > 0 
          ? (successfulTxs / walletInfo.transactions.length) * 100 
          : 0
      }
    };
  }
}

export default SolanaApi;
