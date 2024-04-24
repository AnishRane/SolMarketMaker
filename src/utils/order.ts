import { Keypair, PublicKey } from '@solana/web3.js';
import { JupiterClient } from '../api/jupiter';
import Decimal from 'decimal.js';
import { fromNumberToLamports } from './convert';
import { SOL_MINT_ADDRESS, USDC_MINT_ADDRESS } from '../constants/constants';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { Connection } from '@solana/web3.js';

const ENABLE_TRADING = process.env.ENABLE_TRADING;

export async function PlaceBuyOrder(jupiterClient:JupiterClient,solAmt:Decimal,pair:any,wallet:Keypair,slippageBps:any){
  try{
    const walletAddress = new PublicKey(wallet.publicKey.toString())
    const lamportsAsString = fromNumberToLamports(solAmt.toNumber(),pair.token0.decimals).toString();
    const quote = await jupiterClient.getQuote(pair.token0.address, pair.token1.address, lamportsAsString,slippageBps);
    const swapTransaction = await jupiterClient.getSwapTransactionForWallet(quote,walletAddress);
    console.log("Generating buy swap txn")
    const executeTradeTxn = await jupiterClient.executeSwapForWallet(swapTransaction,wallet);
    if(executeTradeTxn){
      console.log("BUY Swap executed successfully")
    }
  }
  catch(error){
    throw error
  }
}

export async function PlaceBuyOrders(jupiterClient:JupiterClient,wallets:Keypair[],pair:any,slippageBps:any,supportPrice:Decimal,minSolAmtToTrade:Decimal){
  try  {

    for(let i = 0; i < wallets.length; i++){
      try{    
        console.log("<============+++++++++EXECUTING BUY ORDERS+++++++++============>")
        console.log("Executing buy orders")
        const token0Balance = await fetchTokenBalance(jupiterClient,wallets[i].publicKey,pair.token0)
        console.log(`Token0 Balance (in ${pair.token0.symbol} for ${wallets[i].publicKey}): ${token0Balance.toString()}`)
        if(token0Balance < minSolAmtToTrade){
          throw new Error(`Insufficient ${pair.token0.symbol} balance for wallet ${wallets[i].publicKey} to execute buy ....`)
        }
        console.log(`Trading ${minSolAmtToTrade} SOL for BROKIE....`)
        const brokiePrice = new Decimal(await getUSDValue(jupiterClient,pair.token1,slippageBps))
        console.log(`Brokie Price while sell trade for ${wallets[i].publicKey.toString()} is ${brokiePrice}`);
        if(brokiePrice <= supportPrice){
          const walletAddress = new PublicKey(wallets[i].publicKey.toString())
          if(i == 2){
          minSolAmtToTrade = new Decimal(minSolAmtToTrade.mul(2))
          console.log(`Placing order of ${minSolAmtToTrade} sols from wallet ${wallets[i].publicKey}`)
          const lamportsAsString = fromNumberToLamports(minSolAmtToTrade.toNumber(),pair.token0.decimals).toString();
          const quote = await jupiterClient.getQuote(pair.token0.address, pair.token1.address, lamportsAsString,slippageBps);
          const swapTransaction = await jupiterClient.getSwapTransactionForWallet(quote,walletAddress);
          console.log(`Swap txn generated for ${wallets[i].publicKey} of amount ${minSolAmtToTrade}`)
          if(ENABLE_TRADING){
             // const executeTradeTxn = await jupiterClient.executeSwapForWallet(swapTransaction,wallets[i]);
          // if(executeTradeTxn){
          //   console.log(`BUY swap executed for ${wallets[i].publicKey} successfully`)
          // }
          }
         
          }
          const lamportsAsString = fromNumberToLamports(minSolAmtToTrade.toNumber(),pair.token0.decimals).toString();
          const quote = await jupiterClient.getQuote(pair.token0.address, pair.token1.address, lamportsAsString,slippageBps);
          const swapTransaction = await jupiterClient.getSwapTransactionForWallet(quote,walletAddress);
          console.log(`Swap txn generated for ${wallets[i].publicKey} of amount ${minSolAmtToTrade} `)
          if(ENABLE_TRADING){
             // const executeTradeTxn = await jupiterClient.executeSwapForWallet(swapTransaction,wallets[i]);
          // if(executeTradeTxn){
          //   console.log(`BUY swap executed for ${wallets[i].publicKey} successfully`)
          // }
          }
         
        }
      }
      catch(error){
        console.log(`Error while processing trade for ${wallets[i].publicKey.toString()}:
         ${error}`)
      }
    }
  }
  catch(error){
    throw error;
  }
}




export async function PlaceSellOrders(jupiterClient:JupiterClient,wallets:Keypair[],pair:any,slippageBps:any,midPrice:Decimal,highPrice:Decimal){
  try  {
    for(const wallet of wallets){
      try{    
        console.log("<=============********EXECUTING SELL ORDERS*********============>")

        const token1Balance = await fetchTokenBalance(jupiterClient,wallet.publicKey,pair.token1)
        console.log(`Brokie for ${wallet.publicKey.toString()} is: ${token1Balance}`)
        console.log(`Trading ${token1Balance.toString()} BROKIE for SOL....`)
        const brokiePrice = new Decimal(await getUSDValue(jupiterClient,pair.token1,slippageBps))
        console.log(`Brokie Price while sell trade for ${wallet.publicKey.toString()} is ${brokiePrice}`);
        if(brokiePrice >= highPrice || (brokiePrice <= highPrice && brokiePrice > midPrice)){
          const walletAddress = new PublicKey(wallet.publicKey.toString())
          const lamportsAsString = fromNumberToLamports(token1Balance.toNumber(),pair.token1.decimals).toString();
          const quote = await jupiterClient.getQuote(pair.token1.address, pair.token0.address, lamportsAsString,slippageBps);
          const swapTransaction = await jupiterClient.getSwapTransactionForWallet(quote,walletAddress);
          // const executeTradeTxn = await jupiterClient.executeSwapForWallet(swapTransaction,wallet);
          // if(executeTradeTxn){
          //   console.log(`SELL swap executed for ${wallet.publicKey} successfully`)
          // }
        }
        if(brokiePrice <= midPrice){
          console.log(`Reached sell threshold for mid price ${midPrice}`)
          break;
        }}
      catch(error){
        console.log(`Error while processing trade for ${wallet.publicKey.toString()}: ${error}`)
      }
    }
  }
  catch(error){
    throw error;
  }
}

async function fetchTokenBalance(jupiterClient: JupiterClient, publicKey:PublicKey ,token: { address: string; symbol: string; decimals: number; }): Promise<Decimal> {
  const connection = jupiterClient.getConnection();
  let balance = token.address === SOL_MINT_ADDRESS
      ? await connection.getBalance(publicKey)
      : await getSPLTokenBalance(connection, publicKey, new PublicKey(token.address));

  return new Decimal(balance).div(new Decimal(10).pow(token.decimals));
}

async function getUSDValue(jupiterClient: JupiterClient, token: any,slippageBps:any): Promise<Decimal> {
  const quote = await jupiterClient.getQuote(token.address, USDC_MINT_ADDRESS, fromNumberToLamports(1, token.decimals).toString(), slippageBps);
  return new Decimal(quote.outAmount).div(new Decimal(10).pow(6));
}


async function getSPLTokenBalance(connection: Connection, walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<Decimal> {
  const accounts = await connection.getParsedTokenAccountsByOwner(walletAddress, { programId: TOKEN_PROGRAM_ID });
  const accountInfo = accounts.value.find((account: any) => account.account.data.parsed.info.mint === tokenMintAddress.toBase58());
  return accountInfo ? new Decimal(accountInfo.account.data.parsed.info.tokenAmount.amount) : new Decimal(0);
}
