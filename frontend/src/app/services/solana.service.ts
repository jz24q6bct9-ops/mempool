import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError, firstValueFrom } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

interface SolanaBalance {
  address: string;
  balance: number;
}

interface SignatureVerification {
  valid: boolean;
  message: string;
  publicKey: string;
}

interface TransactionResponse {
  transaction: string;
  fromPubkey: string;
  toPubkey: string;
  amount: number;
}

interface TransactionSignature {
  signature: string;
}

declare global {
  interface Window {
    solana?: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class SolanaService {
  private apiBaseUrl = '';
  private connection: Connection;
  private wallet: any = null;
  private network: string = 'devnet';

  constructor(private httpClient: HttpClient) {
    // Use devnet by default
    this.network = 'devnet';
    this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  }

  /**
   * Get current network
   */
  getNetwork(): string {
    return this.network;
  }

  /**
   * Set network (mainnet-beta, testnet, devnet)
   */
  setNetwork(network: string): void {
    this.network = network;
    const rpcUrl = this.getRpcUrl(network);
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Get RPC URL for network
   */
  private getRpcUrl(network: string): string {
    switch (network) {
      case 'mainnet':
      case 'mainnet-beta':
        return 'https://api.mainnet-beta.solana.com';
      case 'testnet':
        return 'https://api.testnet.solana.com';
      case 'devnet':
      default:
        return 'https://api.devnet.solana.com';
    }
  }

  /**
   * Check if Phantom or other Solana wallet is installed
   */
  isWalletInstalled(): boolean {
    return typeof window !== 'undefined' && window.solana !== undefined;
  }

  /**
   * Connect to Phantom wallet
   */
  async connectWallet(): Promise<string> {
    if (!this.isWalletInstalled()) {
      throw new Error('Solana wallet (e.g., Phantom) is not installed');
    }

    try {
      const response = await window.solana.connect();
      this.wallet = window.solana;
      return response.publicKey.toString();
    } catch (error) {
      throw new Error('Failed to connect to wallet: ' + error);
    }
  }

  /**
   * Disconnect from wallet
   */
  async disconnectWallet(): Promise<void> {
    if (this.wallet) {
      await this.wallet.disconnect();
      this.wallet = null;
    }
  }

  /**
   * Get connected wallet public key
   */
  getWalletPublicKey(): string | null {
    if (this.wallet && this.wallet.publicKey) {
      return this.wallet.publicKey.toString();
    }
    return null;
  }

  /**
   * Check if wallet is connected
   */
  isWalletConnected(): boolean {
    return this.wallet !== null && this.wallet.isConnected;
  }

  /**
   * Sign a message with the connected wallet
   */
  async signMessage(message: string): Promise<{ signature: string; publicKey: string }> {
    if (!this.wallet || !this.wallet.isConnected) {
      throw new Error('Wallet is not connected');
    }

    try {
      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await this.wallet.signMessage(encodedMessage, 'utf8');
      
      return {
        signature: Buffer.from(signedMessage.signature).toString('base64'),
        publicKey: this.wallet.publicKey.toString()
      };
    } catch (error) {
      throw new Error('Failed to sign message: ' + error);
    }
  }

  /**
   * Verify a message signature using the backend API
   */
  verifySignature(message: string, signature: string, publicKey: string): Observable<SignatureVerification> {
    return this.httpClient.post<SignatureVerification>(
      `${this.apiBaseUrl}/api/v1/solana/verify-signature`,
      { message, signature, publicKey }
    );
  }

  /**
   * Get balance for a Solana address
   */
  getBalance(address: string): Observable<SolanaBalance> {
    return this.httpClient.get<SolanaBalance>(
      `${this.apiBaseUrl}/api/v1/solana/balance/${address}`
    );
  }

  /**
   * Get balance directly from the blockchain
   */
  async getBalanceFromChain(address: string): Promise<number> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      throw new Error('Failed to get balance: ' + error);
    }
  }

  /**
   * Validate a Solana address
   */
  validateAddress(address: string): Observable<{ valid: boolean; address: string }> {
    return this.httpClient.get<{ valid: boolean; address: string }>(
      `${this.apiBaseUrl}/api/v1/solana/validate-address/${address}`
    );
  }

  /**
   * Create a transfer transaction using the backend API
   */
  createTransaction(fromPubkey: string, toPubkey: string, amount: number): Observable<TransactionResponse> {
    return this.httpClient.post<TransactionResponse>(
      `${this.apiBaseUrl}/api/v1/solana/create-transaction`,
      { fromPubkey, toPubkey, amount }
    );
  }

  /**
   * Sign and send a transaction
   */
  async signAndSendTransaction(fromPubkey: string, toPubkey: string, amount: number): Promise<string> {
    if (!this.wallet || !this.wallet.isConnected) {
      throw new Error('Wallet is not connected');
    }

    try {
      // Create transaction using backend API
      const txResponse = await firstValueFrom(this.createTransaction(fromPubkey, toPubkey, amount));
      
      if (!txResponse) {
        throw new Error('Failed to create transaction');
      }

      // Deserialize transaction
      const transaction = Transaction.from(Buffer.from(txResponse.transaction, 'base64'));

      // Sign transaction with wallet
      const signedTransaction = await this.wallet.signTransaction(transaction);

      // Send to backend
      const result = await firstValueFrom(this.sendTransaction(
        signedTransaction.serialize().toString('base64')
      ));

      if (!result) {
        throw new Error('Failed to send transaction');
      }

      return result.signature;
    } catch (error) {
      throw new Error('Failed to sign and send transaction: ' + error);
    }
  }

  /**
   * Send a signed transaction using the backend API
   */
  sendTransaction(signedTransaction: string): Observable<TransactionSignature> {
    return this.httpClient.post<TransactionSignature>(
      `${this.apiBaseUrl}/api/v1/solana/send-transaction`,
      { signedTransaction }
    );
  }

  /**
   * Get transaction status
   */
  getTransactionStatus(signature: string): Observable<any> {
    return this.httpClient.get(
      `${this.apiBaseUrl}/api/v1/solana/transaction-status/${signature}`
    );
  }

  /**
   * Listen for wallet connection events
   */
  onWalletConnect(callback: (publicKey: string) => void): void {
    if (this.isWalletInstalled()) {
      window.solana.on('connect', (publicKey: any) => {
        this.wallet = window.solana;
        callback(publicKey.toString());
      });
    }
  }

  /**
   * Listen for wallet disconnection events
   */
  onWalletDisconnect(callback: () => void): void {
    if (this.isWalletInstalled()) {
      window.solana.on('disconnect', () => {
        this.wallet = null;
        callback();
      });
    }
  }
}
