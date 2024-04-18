import { JupiterClient } from '../api/jupiter';
import { SOL_MINT_ADDRESS, BRK_MINT_ADDRESS, USDC_MINT_ADDRESS } from '../constants/constants';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import Decimal from 'decimal.js';
import { fromNumberToLamports } from '../utils/convert';
import { Connection, PublicKey } from '@solana/web3.js';
import { sleep } from '../utils/sleep';
import { MarketMaker } from './basicMM';
import { getMakerWallets } from '../multiWallet';


export class MultiWalletMM{
  brkToken: { address: string, symbol: string, decimals: number }
  solToken: { address: string, symbol: string, decimals: number }
  usdcToken: { address: string, symbol: string, decimals: number }
  waitTime: number
  slippageBps: number
  priceTolerance: number
  rebalancePercentage: number

  constructor() {
    // Read decimals from the token mint addresses
    this.brkToken = { address: BRK_MINT_ADDRESS, symbol: 'BRK', decimals: 6 };
    this.solToken = { address: SOL_MINT_ADDRESS, symbol: 'SOL', decimals: 9 };
    this.usdcToken = { address: USDC_MINT_ADDRESS, symbol: 'USDC', decimals: 6 };
    this.waitTime = 60000; // 1 minute
    this.slippageBps = 50; // 0.5%
    this.priceTolerance = 0.02; // 2%
    this.rebalancePercentage = 0.5; // 50%
}

  async runMM(jupiterClient:JupiterClient,enabledTrading:Boolean=false):Promise<void>{
    const tradePairs = [{token0:this.solToken,token1:this.brkToken}]
    const getWallets = getMakerWallets();
    while(true){
      for (const pair of tradePairs){
        
      }
    }

  }
}
