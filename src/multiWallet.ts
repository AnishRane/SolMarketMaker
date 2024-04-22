import fs from 'fs';
import { Keypair,PublicKey } from '@solana/web3.js';
import { getRandomNumber } from './utils/randomInt';
require('dotenv').config();



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

// for(let i = 0 ; i < wallets.length;i++){

//   console.log(`${i}-${wallets[i]}`);
// }

// const randomNum = getRandomNumber();
// console.log("Random Num: ",randomNum);
// const USER_KEYPAIR_PATH = require('path').join(USER_HOME, '.config/solana/id.json');
