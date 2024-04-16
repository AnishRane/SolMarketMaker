import fs from 'fs';
import { Keypair } from '@solana/web3.js';

const USER_HOME = require('os').homedir();
// const USER_KEYPAIR_PATH = require('path').join(USER_HOME, '.config/solana/id.json');

function loadKeypairFromFile(filePath: string): Keypair {
    try {
        const fileContent = fs.readFileSync(filePath, { encoding: 'utf8' });
        const secretKeyArray = JSON.parse(fileContent);
        return Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
    } catch (error) {
        console.error(`Error while loading private key ${filePath}:`, error);
        process.exit(1);
    }
}

export function getUserKeypair(): Keypair {
const path = (require('path').join('/Users/anishrane/Personal/OSN-Contributions/MarketMaker/solana-mmaker/.local_keys/pvt_keys.json'));
    return loadKeypairFromFile(path);
}

const key = getUserKeypair();
console.log("Keys: ",key);
// const USER_KEYPAIR_PATH = require('path').join(USER_HOME, '.config/solana/id.json');
