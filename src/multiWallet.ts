import fs from 'fs';
import { Keypair,PublicKey } from '@solana/web3.js';
import { getRandomNumber } from './utils/randomInt';
require('dotenv').config();
const bs58 = require('bs58');



function loadKeypairFromFile(filePath: string):any {
    try {
        const makerWallets:Keypair[]=[];
        const fileContent = fs.readFileSync(filePath, { encoding: 'utf8' });
        const secretKeyArray = JSON.parse(fileContent);

       if(secretKeyArray.length>1){
        for(let i = 0; i < secretKeyArray.length; i++){
          makerWallets.push(Keypair.fromSecretKey(Uint8Array.from(secretKeyArray[i])))
        }
        return makerWallets;
       }
    } catch (error) {
        console.error(`Error while loading private key ${filePath}:`, error);
        process.exit(1);
    }
}

export function getMakerWallets(): Keypair[] {
const path = (require('path').join(process.env.MAKER_WALLETS_PATH));
    return loadKeypairFromFile(path);
}



// const wallets:any = getMakerWallets();

// for(let i = 0; i < wallets.length; i++){
//   const publicKey = bs58.encode(wallets[i]._keypair.publicKey)
//   const secretKey = bs58.encode(wallets[i]._keypair.secretKey)
//   console.log(`${i}-publicKey-${publicKey} || ${secretKey}`)
// }

