import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import logger from '../../logger';

interface SignMessageRequest {
  message: string;
  publicKey: string;
}

interface SignMessageResponse {
  signature: string;
  message: string;
  publicKey: string;
}

interface VerifyMessageRequest {
  message: string;
  signature: string;
  publicKey: string;
}

interface TransactionRequest {
  fromPubkey: string;
  toPubkey: string;
  amount: number; // in SOL
}

class SolanaService {
  private connection: Connection;
  private network: string;

  constructor() {
    // Default to devnet for testing
    this.network = process.env.SOLANA_NETWORK || 'devnet';
    const rpcUrl = this.getRpcUrl();
    this.connection = new Connection(rpcUrl, 'confirmed');
    logger.info(`Solana service initialized with network: ${this.network}`);
  }

  private getRpcUrl(): string {
    switch (this.network) {
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
   * Verify a signed message
   * @param message - The original message that was signed
   * @param signature - The signature in base58 or hex format
   * @param publicKey - The public key of the signer
   * @returns boolean indicating if the signature is valid
   */
  public verifySignature(message: string, signature: string, publicKey: string): boolean {
    try {
      const messageBytes = new TextEncoder().encode(message);
      const publicKeyBytes = new PublicKey(publicKey).toBytes();
      
      // Try to decode signature (could be base64 or hex)
      let signatureBytes: Uint8Array;
      try {
        // Try base64 first
        signatureBytes = Buffer.from(signature, 'base64');
      } catch {
        // Try hex
        signatureBytes = Buffer.from(signature, 'hex');
      }

      const verified = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );

      logger.debug(`Signature verification result: ${verified}`);
      return verified;
    } catch (e) {
      logger.err(`Error verifying signature: ${(e instanceof Error ? e.message : e)}`);
      return false;
    }
  }

  /**
   * Get the balance of a Solana address
   * @param publicKey - The public key to check balance for
   * @returns Balance in SOL
   */
  public async getBalance(publicKey: string): Promise<number> {
    try {
      const pubkey = new PublicKey(publicKey);
      const balance = await this.connection.getBalance(pubkey);
      return balance / LAMPORTS_PER_SOL;
    } catch (e) {
      logger.err(`Error getting balance: ${(e instanceof Error ? e.message : e)}`);
      throw e;
    }
  }

  /**
   * Get recent blockhash for transaction
   * @returns Recent blockhash
   */
  public async getRecentBlockhash(): Promise<string> {
    try {
      const { blockhash } = await this.connection.getLatestBlockhash();
      return blockhash;
    } catch (e) {
      logger.err(`Error getting recent blockhash: ${(e instanceof Error ? e.message : e)}`);
      throw e;
    }
  }

  /**
   * Create a transfer transaction
   * @param fromPubkey - Sender's public key
   * @param toPubkey - Recipient's public key
   * @param amount - Amount in SOL
   * @returns Serialized transaction
   */
  public async createTransferTransaction(
    fromPubkey: string,
    toPubkey: string,
    amount: number
  ): Promise<string> {
    try {
      const fromPublicKey = new PublicKey(fromPubkey);
      const toPublicKey = new PublicKey(toPubkey);
      const lamports = amount * LAMPORTS_PER_SOL;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPublicKey,
          toPubkey: toPublicKey,
          lamports,
        })
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPublicKey;

      // Serialize the transaction for signing
      const serialized = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      return serialized.toString('base64');
    } catch (e) {
      logger.err(`Error creating transfer transaction: ${(e instanceof Error ? e.message : e)}`);
      throw e;
    }
  }

  /**
   * Send a signed transaction to the network
   * @param signedTransaction - The signed transaction in base64 format
   * @returns Transaction signature
   */
  public async sendTransaction(signedTransaction: string): Promise<string> {
    try {
      const transaction = Transaction.from(Buffer.from(signedTransaction, 'base64'));
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize()
      );

      logger.info(`Transaction sent with signature: ${signature}`);
      return signature;
    } catch (e) {
      logger.err(`Error sending transaction: ${(e instanceof Error ? e.message : e)}`);
      throw e;
    }
  }

  /**
   * Get transaction status
   * @param signature - Transaction signature
   * @returns Transaction confirmation status
   */
  public async getTransactionStatus(signature: string): Promise<any> {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      return status;
    } catch (e) {
      logger.err(`Error getting transaction status: ${(e instanceof Error ? e.message : e)}`);
      throw e;
    }
  }

  /**
   * Validate a Solana address
   * @param address - The address to validate
   * @returns boolean indicating if the address is valid
   */
  public isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }
}

export default new SolanaService();
