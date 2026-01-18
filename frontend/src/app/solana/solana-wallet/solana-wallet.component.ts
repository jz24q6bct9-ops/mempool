import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SolanaApiService, WalletSummary } from '../solana-api.service';

@Component({
  selector: 'app-solana-wallet',
  templateUrl: './solana-wallet.component.html',
  styleUrls: ['./solana-wallet.component.scss']
})
export class SolanaWalletComponent implements OnInit {
  walletAddress: string = '';
  walletSummary: WalletSummary | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private solanaApiService: SolanaApiService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.walletAddress = params['address'];
      if (this.walletAddress) {
        this.loadWalletData();
      }
    });
  }

  loadWalletData(): void {
    this.isLoading = true;
    this.error = null;
    
    this.solanaApiService.getWalletSummary(this.walletAddress).subscribe({
      next: (data) => {
        this.walletSummary = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load wallet data. Please check the wallet address and try again.';
        this.isLoading = false;
        console.error('Error loading wallet data:', err);
      }
    });
  }

  formatTimestamp(timestamp: number | null): string {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).toLocaleString();
  }

  formatAmount(amount: number | null, decimals: number = 9): string {
    if (amount === null) return '0';
    return (amount / Math.pow(10, decimals)).toFixed(decimals);
  }

  getStatusClass(tx: any): string {
    return tx.err ? 'failed' : 'success';
  }

  getTotalTokenValue(): number {
    if (!this.walletSummary) return 0;
    // Simplified - would need price data for actual USD value
    return this.walletSummary.wallet.tokenAccounts.reduce((sum, token) => {
      return sum + (token.uiAmount || 0);
    }, 0);
  }
}
