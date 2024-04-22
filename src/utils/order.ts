import { Keypair, PublicKey } from '@solana/web3.js';
import { JupiterClient } from '../api/jupiter';
import Decimal from 'decimal.js';
import { fromNumberToLamports } from './convert';
import { SOL_MINT_ADDRESS, USDC_MINT_ADDRESS } from '../constants/constants';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { Connection } from '@solana/web3.js';

export async function PlaceBuyOrder(jupiterClient:JupiterClient,solAmt:Decimal,pair:any,wallet:Keypair,slippageBps:any){
  try{
    const walletAddress = new PublicKey(wallet.publicKey.toString())
    const lamportsAsString = fromNumberToLamports(solAmt.toNumber(),pair.token0.decimals).toString();
    const quote = await jupiterClient.getQuote(pair.token0.address, pair.token1.address, lamportsAsString,slippageBps);
    const swapTransaction = await jupiterClient.getSwapTransactionForWallet(quote,walletAddress);
    console.log("Generating buy swap txn")
    // const executeTradeTxn = await jupiterClient.executeSwapForWallet(swapTransaction,wallet);
    const executeTradeTxn = false
    if(executeTradeTxn){
      console.log("Swap executed successfully")
    }
  }
  catch(error){
    throw error
  }
}



export async function PlaceSellOrders(jupiterClient:JupiterClient,wallets:Keypair[],pair:any,slippageBps:any,midPrice:Decimal,highPrice:Decimal){
  try  {
    for(const wallet of wallets){
      try{    
        const token1Balance = await fetchTokenBalance(jupiterClient,wallet.publicKey,pair.token1)
        console.log(`Brokie for ${wallet.publicKey.toString()} is: ${token1Balance}`)
        console.log(`Trading ${token1Balance.toString()} BROKIE for SOL....`);
        const getBrokieToUSDQuote = await jupiterClient.getQuote(pair.token1.address,USDC_MINT_ADDRESS,fromNumberToLamports(1,pair.token1).toString(),slippageBps);
        const brokiePrice = new Decimal(getBrokieToUSDQuote.outAmount).div(new Decimal(10).pow(9))
        if(brokiePrice >= highPrice){
          const walletAddress = new PublicKey(wallet.publicKey.toString())
          const lamportsAsString = fromNumberToLamports(token1Balance.toNumber(),pair.token0.decimals).toString();
          const quote = await jupiterClient.getQuote(pair.token1.address, pair.token0.address, lamportsAsString,slippageBps);
          const swapTransaction = await jupiterClient.getSwapTransactionForWallet(quote,walletAddress);
          console.log("Generating sell swap txn")
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


async function getSPLTokenBalance(connection: Connection, walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<Decimal> {
  const accounts = await connection.getParsedTokenAccountsByOwner(walletAddress, { programId: TOKEN_PROGRAM_ID });
  const accountInfo = accounts.value.find((account: any) => account.account.data.parsed.info.mint === tokenMintAddress.toBase58());
  return accountInfo ? new Decimal(accountInfo.account.data.parsed.info.tokenAmount.amount) : new Decimal(0);
}
