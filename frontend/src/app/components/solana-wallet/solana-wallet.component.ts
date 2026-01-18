import { Component, OnInit, OnDestroy } from '@angular/core';
import { SolanaService } from '@app/services/solana.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-solana-wallet',
  templateUrl: './solana-wallet.component.html',
  styleUrls: ['./solana-wallet.component.scss'],
  standalone: false,
})
export class SolanaWalletComponent implements OnInit, OnDestroy {
  walletAddress: string | null = null;
  isConnected = false;
  isWalletInstalled = false;
  balance = 0;
  message = '';
  signedMessage: { signature: string; publicKey: string } | null = null;
  verificationResult: any = null;
  error: string | null = null;
  isLoading = false;
  
  // Transaction fields
  recipientAddress = '';
  transferAmount = 0;
  transactionSignature: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(private solanaService: SolanaService) {}

  ngOnInit(): void {
    this.isWalletInstalled = this.solanaService.isWalletInstalled();
    
    if (this.isWalletInstalled) {
      // Check if already connected
      this.isConnected = this.solanaService.isWalletConnected();
      if (this.isConnected) {
        this.walletAddress = this.solanaService.getWalletPublicKey();
        this.loadBalance();
      }

      // Listen for wallet events
      this.solanaService.onWalletConnect((publicKey) => {
        this.walletAddress = publicKey;
        this.isConnected = true;
        this.error = null;
        this.loadBalance();
      });

      this.solanaService.onWalletDisconnect(() => {
        this.walletAddress = null;
        this.isConnected = false;
        this.balance = 0;
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async connectWallet(): Promise<void> {
    this.error = null;
    this.isLoading = true;
    
    try {
      this.walletAddress = await this.solanaService.connectWallet();
      this.isConnected = true;
      await this.loadBalance();
    } catch (error: any) {
      this.error = error.message || 'Failed to connect wallet';
      console.error('Error connecting wallet:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      await this.solanaService.disconnectWallet();
      this.walletAddress = null;
      this.isConnected = false;
      this.balance = 0;
      this.signedMessage = null;
      this.verificationResult = null;
      this.error = null;
    } catch (error: any) {
      this.error = error.message || 'Failed to disconnect wallet';
      console.error('Error disconnecting wallet:', error);
    }
  }

  async loadBalance(): Promise<void> {
    if (!this.walletAddress) return;

    this.isLoading = true;
    this.error = null;

    try {
      this.balance = await this.solanaService.getBalanceFromChain(this.walletAddress);
    } catch (error: any) {
      this.error = error.message || 'Failed to load balance';
      console.error('Error loading balance:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async signMessage(): Promise<void> {
    if (!this.message) {
      this.error = 'Please enter a message to sign';
      return;
    }

    this.error = null;
    this.isLoading = true;

    try {
      this.signedMessage = await this.solanaService.signMessage(this.message);
      this.error = null;
      
      // Automatically verify the signature
      this.verifySignedMessage();
    } catch (error: any) {
      this.error = error.message || 'Failed to sign message';
      console.error('Error signing message:', error);
    } finally {
      this.isLoading = false;
    }
  }

  verifySignedMessage(): void {
    if (!this.signedMessage || !this.message) {
      this.error = 'No signed message to verify';
      return;
    }

    this.isLoading = true;
    this.error = null;

    const sub = this.solanaService.verifySignature(
      this.message,
      this.signedMessage.signature,
      this.signedMessage.publicKey
    ).subscribe({
      next: (result) => {
        this.verificationResult = result;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to verify signature: ' + error.message;
        console.error('Error verifying signature:', error);
        this.isLoading = false;
      }
    });

    this.subscriptions.push(sub);
  }

  async sendTransaction(): Promise<void> {
    if (!this.recipientAddress || !this.transferAmount || this.transferAmount <= 0) {
      this.error = 'Please enter a valid recipient address and amount';
      return;
    }

    if (!this.walletAddress) {
      this.error = 'Wallet not connected';
      return;
    }

    this.error = null;
    this.isLoading = true;
    this.transactionSignature = null;

    try {
      this.transactionSignature = await this.solanaService.signAndSendTransaction(
        this.walletAddress,
        this.recipientAddress,
        this.transferAmount
      );
      
      // Reload balance after successful transaction
      await this.loadBalance();
      
      // Clear form
      this.recipientAddress = '';
      this.transferAmount = 0;
    } catch (error: any) {
      this.error = error.message || 'Failed to send transaction';
      console.error('Error sending transaction:', error);
    } finally {
      this.isLoading = false;
    }
  }

  clearError(): void {
    this.error = null;
  }

  clearSignature(): void {
    this.signedMessage = null;
    this.verificationResult = null;
    this.message = '';
  }

  clearTransaction(): void {
    this.transactionSignature = null;
    this.recipientAddress = '';
    this.transferAmount = 0;
  }
}
