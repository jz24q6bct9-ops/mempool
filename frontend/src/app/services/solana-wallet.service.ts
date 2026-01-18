import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

declare global {
  interface Window {
    solana?: any;
    phantom?: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class SolanaWalletService {
  private walletAddressSubject = new BehaviorSubject<string | null>(null);
  public walletAddress$: Observable<string | null> = this.walletAddressSubject.asObservable();
  
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$: Observable<boolean> = this.connectedSubject.asObservable();
  
  private connection: Connection;
  private provider: any;

  constructor() {
    // Connect to Solana mainnet by default
    this.connection = new Connection('https://api.mainnet-beta.solana.com');
    this.checkIfWalletIsConnected();
  }

  async checkIfWalletIsConnected(): Promise<void> {
    try {
      const { solana } = window;
      
      if (solana && solana.isPhantom) {
        console.log('Phantom wallet found!');
        this.provider = solana;
        
        const response = await solana.connect({ onlyIfTrusted: true });
        console.log('Connected with Public Key:', response.publicKey.toString());
        
        this.walletAddressSubject.next(response.publicKey.toString());
        this.connectedSubject.next(true);
        
        // Listen for account changes
        solana.on('accountChanged', (publicKey: PublicKey | null) => {
          if (publicKey) {
            console.log('Switched to account:', publicKey.toString());
            this.walletAddressSubject.next(publicKey.toString());
          } else {
            console.log('Wallet disconnected');
            this.disconnect();
          }
        });
        
        // Listen for disconnection
        solana.on('disconnect', () => {
          console.log('Wallet disconnected');
          this.disconnect();
        });
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  }

  async connectWallet(): Promise<string | null> {
    try {
      const { solana } = window;
      
      if (!solana) {
        alert('Solana wallet not found! Please install Phantom wallet.');
        window.open('https://phantom.app/', '_blank');
        return null;
      }
      
      this.provider = solana;
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      
      const address = response.publicKey.toString();
      this.walletAddressSubject.next(address);
      this.connectedSubject.next(true);
      
      return address;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return null;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.provider) {
        await this.provider.disconnect();
      }
      this.walletAddressSubject.next(null);
      this.connectedSubject.next(false);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }

  async signMessage(message: string): Promise<{ signature: string; publicKey: string } | null> {
    try {
      if (!this.provider) {
        throw new Error('Wallet not connected');
      }
      
      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await this.provider.signMessage(encodedMessage, 'utf8');
      
      const signature = Buffer.from(signedMessage.signature).toString('hex');
      const publicKey = signedMessage.publicKey.toString();
      
      console.log('Message signed successfully');
      console.log('Signature:', signature);
      console.log('Public Key:', publicKey);
      
      return {
        signature,
        publicKey
      };
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }

  getWalletAddress(): string | null {
    return this.walletAddressSubject.value;
  }

  isConnected(): boolean {
    return this.connectedSubject.value;
  }
}
