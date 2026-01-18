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
