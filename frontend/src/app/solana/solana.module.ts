import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SolanaWalletComponent } from './solana-wallet/solana-wallet.component';
import { SolanaApiService } from './solana-api.service';

@NgModule({
  declarations: [
    SolanaWalletComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: 'wallet/:address',
        component: SolanaWalletComponent
      }
    ])
  ],
  providers: [
    SolanaApiService
  ]
})
export class SolanaModule { }
