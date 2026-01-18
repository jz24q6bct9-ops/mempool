import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SolanaTransaction {
  signature: string;
  slot: number;
  blockTime: number | null;
  confirmationStatus?: string;
  err: any;
  memo?: string;
}

export interface SolanaTokenAccount {
  pubkey: string;
  mint: string;
  owner: string;
  amount: string;
  decimals: number;
  uiAmount: number | null;
}

export interface SolanaWalletInfo {
  address: string;
  balance: number;
  tokenAccounts: SolanaTokenAccount[];
  transactions: SolanaTransaction[];
}

export interface LiquidityPoolPosition {
  poolAddress: string;
  protocol: string;
  tokenA: {
    mint: string;
    amount: string;
    symbol?: string;
  };
  tokenB: {
    mint: string;
    amount: string;
    symbol?: string;
  };
  lpTokenAmount: string;
  valueUSD?: number;
}

export interface TransactionFees {
  signature: string;
  fee: number;
  feePayer: string;
  blockTime: number | null;
}

export interface WalletSummary {
  wallet: SolanaWalletInfo;
  fees: {
    total: number;
    count: number;
    average: number;
    breakdown: TransactionFees[];
  };
  liquidityPools: LiquidityPoolPosition[];
  statistics: {
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    successRate: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SolanaApiService {
  private apiBaseUrl = '/api/v1/solana';

  constructor(private http: HttpClient) { }

  getWalletInfo(address: string): Observable<SolanaWalletInfo> {
    return this.http.get<SolanaWalletInfo>(`${this.apiBaseUrl}/wallet/${address}`);
  }

  getBalance(address: string): Observable<{ address: string; balance: number }> {
    return this.http.get<{ address: string; balance: number }>(`${this.apiBaseUrl}/wallet/${address}/balance`);
  }

  getTokenAccounts(address: string): Observable<{ address: string; tokenAccounts: SolanaTokenAccount[] }> {
    return this.http.get<{ address: string; tokenAccounts: SolanaTokenAccount[] }>(`${this.apiBaseUrl}/wallet/${address}/tokens`);
  }

  getTransactions(address: string, limit: number = 20): Observable<{ address: string; transactions: SolanaTransaction[] }> {
    return this.http.get<{ address: string; transactions: SolanaTransaction[] }>(`${this.apiBaseUrl}/wallet/${address}/transactions?limit=${limit}`);
  }

  getFees(address: string, limit: number = 50): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/wallet/${address}/fees?limit=${limit}`);
  }

  getLiquidityPools(address: string): Observable<{ address: string; pools: LiquidityPoolPosition[] }> {
    return this.http.get<{ address: string; pools: LiquidityPoolPosition[] }>(`${this.apiBaseUrl}/wallet/${address}/pools`);
  }

  getWalletSummary(address: string): Observable<WalletSummary> {
    return this.http.get<WalletSummary>(`${this.apiBaseUrl}/wallet/${address}/summary`);
  }

  getTransaction(signature: string): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/transaction/${signature}`);
  }
}
