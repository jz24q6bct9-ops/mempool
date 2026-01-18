import { Component, OnInit, OnDestroy } from '@angular/core';
import { SolanaWalletService } from '@app/services/solana-wallet.service';
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
  messageToSign = '';
  signatureResult: { signature: string; publicKey: string } | null = null;
  isLoading = false;
  errorMessage = '';
  copySuccess = false;
  
  private subscriptions = new Subscription();

  constructor(private solanaWalletService: SolanaWalletService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.solanaWalletService.walletAddress$.subscribe(address => {
        this.walletAddress = address;
      })
    );
    
    this.subscriptions.add(
      this.solanaWalletService.connected$.subscribe(connected => {
        this.isConnected = connected;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  async connectWallet(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      const address = await this.solanaWalletService.connectWallet();
      if (!address) {
        this.errorMessage = 'Solana wallet not found. Please install Phantom wallet.';
      }
    } catch (error) {
      this.errorMessage = 'Failed to connect wallet. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async disconnectWallet(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    this.signatureResult = null;
    
    try {
      await this.solanaWalletService.disconnect();
    } catch (error) {
      this.errorMessage = 'Failed to disconnect wallet. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async signMessage(): Promise<void> {
    if (!this.messageToSign.trim()) {
      this.errorMessage = 'Please enter a message to sign';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    this.signatureResult = null;
    
    try {
      const result = await this.solanaWalletService.signMessage(this.messageToSign);
      if (result) {
        this.signatureResult = result;
      } else {
        this.errorMessage = 'Failed to sign message';
      }
    } catch (error) {
      this.errorMessage = 'Failed to sign message. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  copyToClipboard(text: string): void {
    this.copySuccess = false;
    navigator.clipboard.writeText(text).then(() => {
      this.copySuccess = true;
      setTimeout(() => {
        this.copySuccess = false;
      }, 2000);
    }).catch(() => {
      this.errorMessage = 'Failed to copy to clipboard';
    });
  }

  formatAddress(address: string): string {
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  }
}
