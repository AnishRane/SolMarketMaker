import { JupiterClient } from '../api/jupiter';
import { SOL_MINT_ADDRESS, BRK_MINT_ADDRESS, USDC_MINT_ADDRESS } from '../constants/constants';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import Decimal from 'decimal.js';
import { fromNumberToLamports } from '../utils/convert';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { sleep } from '../utils/sleep';
import { MarketMaker } from './basicMM';
import { getMakerWallets } from '../multiWallet';
import { CronJob } from 'cron';
import { randomInt } from 'crypto';
import { getRandomNumber } from '../utils/randomInt';
import { PlaceBuyOrders, PlaceSellOrders } from '../utils/order';

export class MultiWalletMM{
  private brkToken: { address: string, symbol: string, decimals: number }
  private solToken: { address: string, symbol: string, decimals: number }
  private usdcToken: { address: string, symbol: string, decimals: number }
  private waitTime: number
  private slippageBps: number
  private mid:Decimal
  private high:Decimal
  private supportPrice:Decimal
  private midPrice:Decimal
  private highPrice:Decimal
  private solAmtToTrade:Decimal
  private buyTradeExecuted:Boolean





  constructor(supportPrice:Decimal,mid:Decimal,high:Decimal,solAmtToTrade:Decimal) {
    // Read decimals from the token mint addresses
    this.brkToken = { address: BRK_MINT_ADDRESS, symbol: 'BRK', decimals: 6 };
    this.solToken = { address: SOL_MINT_ADDRESS, symbol: 'SOL', decimals: 9 };
    this.usdcToken = { address: USDC_MINT_ADDRESS, symbol: 'USDC', decimals: 6 };
    this.waitTime = 60000; // 1 minute
    this.slippageBps = 50; // 0.5%
    this.mid = mid
    this.high = high
    this.supportPrice = supportPrice
    this.midPrice = new Decimal(0)
    this.highPrice = new Decimal(0)
    this.solAmtToTrade=solAmtToTrade
    this.buyTradeExecuted = false


}

  /**
   * Run Multiwallet market maker strategy
   * @param jupiterClient 
   * @param enabledTrading 
   */
  async runMM(jupiterClient:JupiterClient,enabledTrading:Boolean=false):Promise<void>{
    try{const tradePairs = {token0:this.solToken,token1:this.brkToken}
    const getWallets:Keypair[] = getMakerWallets();
    this.midPrice = new Decimal((this.supportPrice.mul(this.mid).div(100)).add(this.supportPrice))
    this.highPrice = new Decimal((this.supportPrice.mul(this.high).div(100)).add(this.supportPrice))
    const cronJob= new CronJob('*/60 * * * * *',async ()=>{

    try{ 
      // token1Price = await this.getUSDValue(jupiterClient,tradePairs.token1)
      console.log("<===============================>")
      console.log("Evaluating Trade.....")
      console.log(`Support Price: ${this.supportPrice}`)
      console.log(`Mid price: ${this.midPrice}`)
      console.log(`High price: ${this.highPrice}`)
      await this.evaluateAndExecuteTrade(jupiterClient,getWallets,tradePairs,true)}
      catch(error:any){
        console.error(error.message)
      }
    }
  )
    if(!cronJob.running) cronJob.start();
  }
    catch(error){
      console.log(`${error}`)
    }
  }


  /**
     * Evaluate and execute trade
     * @param {JupiterClient} jupiterClient - JupiterClient object
     * @param {any} pair - Pair object
     * @param {boolean} enableTrading - Enable trading
     * @returns {Promise<void>} - Promise object
     * 
     **/
  async evaluateAndExecuteTrade(jupiterClient: JupiterClient, wallets:Keypair[] ,pair: any, enableTrading: Boolean): Promise<void> {
    
 try{
  
    // determine necessity gives signal whether to buy or sell
     const {toBuyBrokie,toSellBrokie} = await this.determineTradeNecessity(jupiterClient, pair);

    /**
     * If the signal is to buy
     * and there was no buy trade placed earlier then it will place buy order
     */
    if(toBuyBrokie && !this.buyTradeExecuted){
      await PlaceBuyOrders(jupiterClient,wallets,pair,this.slippageBps,this.supportPrice,this.solAmtToTrade);
      this.buyTradeExecuted = true  // this statement turns the bool true, so in next iteration even if the trade necessity function signals to buy the buy will not be executed.
    }
    else if(toSellBrokie){
      await PlaceSellOrders(jupiterClient,wallets,pair,this.slippageBps,this.midPrice,this.highPrice)
      this.buyTradeExecuted = false // reset the flag to start buy after selling
    }
  }
    catch(error){
      throw error
    }
}

   /**
     * Determines the necessity of a trade based on the current balance of two tokens and their USD values.
     * The goal is to maintain a 50/50 ratio of the total USD value of each token.
     * 
     * @param jupiterClient An instance of JupiterClient used to fetch USD values of tokens.
     * @param pair An object representing the token pair to be evaluated, containing `token0` and `token1` properties.
     * @param token0Balance The current balance of `token0`.
     * @returns A promise that resolves to an object indicating whether a trade is needed and the amount of each token to trade.
     */
   async determineTradeNecessity(jupiterClient: JupiterClient, pair: any) {
    const token0Price = await this.getUSDValue(jupiterClient, pair.token0);  // SOL Price in USDC
    const token1Price = await this.getUSDValue(jupiterClient, pair.token1); // Brokie Price in USDC

    let toBuyBrokie;
    let toSellBrokie;

    console.log("Sol USD price: ",token0Price);
    console.log("Brokie USD price: ",token1Price);

    // const token0Value = token0Balance.mul(token0Price);
    // const token1Value = token1Balance.mul(token1Price);

    if(token1Price < this.supportPrice){
      console.log("Trade Needed")
      console.log("Trade 0.1 sol, call buy function")
      toBuyBrokie = true
    }
    else if(token1Price >= this.highPrice){
      console.log("Execute sell")
      toSellBrokie = true
    }
    else{
      console.log("No trade required")
    }
    return {toBuyBrokie,toSellBrokie};
}


    /**
     * Fetch token balance
     * @param {JupiterClient} jupiterClient - JupiterClient object
     * @param {any} token - Token object
     * @returns {Promise<Decimal>} - Token balance
     */
    async fetchTokenBalance(jupiterClient: JupiterClient, publicKey:PublicKey ,token: { address: string; symbol: string; decimals: number; }): Promise<Decimal> {
      const connection = jupiterClient.getConnection();
      let balance = token.address === SOL_MINT_ADDRESS
          ? await connection.getBalance(publicKey)
          : await this.getSPLTokenBalance(connection, publicKey, new PublicKey(token.address));

      return new Decimal(balance).div(new Decimal(10).pow(token.decimals));
  }


  /**
     * Get SPL token balance.
     * @param connection Solana connection object.
     * @param walletAddress Wallet public key.
     * @param tokenMintAddress Token mint public key.
     * @returns Token balance as a Decimal.
     */
  async getSPLTokenBalance(connection: Connection, walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<Decimal> {
    const accounts = await connection.getParsedTokenAccountsByOwner(walletAddress, { programId: TOKEN_PROGRAM_ID });
    const accountInfo = accounts.value.find((account: any) => account.account.data.parsed.info.mint === tokenMintAddress.toBase58());
    return accountInfo ? new Decimal(accountInfo.account.data.parsed.info.tokenAmount.amount) : new Decimal(0);
}

     /**
     * Get USD value of a token.
     * @param jupiterClient JupiterClient object.
     * @param token Token object.
     * @returns USD value of the token as a Decimal.
     */
     async getUSDValue(jupiterClient: JupiterClient, token: any): Promise<Decimal> {
      const quote = await jupiterClient.getQuote(token.address, this.usdcToken.address, fromNumberToLamports(1, token.decimals).toString(), this.slippageBps);
      return new Decimal(quote.outAmount).div(new Decimal(10).pow(this.usdcToken.decimals));
  }
}



// const myJob = new CronJob("*/60 * * * * *",()=>{
//   let timeStamp = new Date();
//   console.log("Cron running",timeStamp)
// })

// if(!myJob.running){
//   myJob.start();
// }


