import dotenv from 'dotenv';
import { JupiterClient } from './api/jupiter';
import { setupSolanaConnection } from './api/solana';
import { MarketMaker } from './strategies/basicMM';
import { MultiWalletMM } from './strategies/MultiwalletMM';
import { getUserKeypair } from './wallet';
import Decimal from 'decimal.js';


async function main() {
    dotenv.config();

    if (!process.env.SOLANA_RPC_ENDPOINT) {
        throw new Error('SOLANA_RPC_ENDPOINT is not set');
    }

    // if (!process.env.USER_KEYPAIR) {
    //     throw new Error('USER_KEYPAIR is not set');
    // }

    if (!process.env.ENABLE_TRADING) {
        console.warn('ENABLE_TRADING is not set. Defaulting to false');
    }

    const connection = setupSolanaConnection(process.env.SOLANA_RPC_ENDPOINT);
    console.log(`Network: ${connection.rpcEndpoint}`);
    const userKeypair = getUserKeypair();
    console.log('MarketMaker PubKey:', userKeypair.publicKey.toBase58());
    const jupiterClient = new JupiterClient(connection, userKeypair);

    const enabled = process.env.ENABLE_TRADING === 'true';
    const support = new Decimal("0.00064")
    const mid = new Decimal('30')
    const high = new Decimal("50")
    const solAmountToTrade = new Decimal("0.05")
    const multiWallet = new MultiWalletMM(support,mid,high,solAmountToTrade);
    await multiWallet.runMM(jupiterClient,enabled);
    // const marketMaker = new MarketMaker();
    // await marketMaker.runMM(jupiterClient, enabled);
}


main().catch((err) => console.error(err))