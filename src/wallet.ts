import fs from 'fs';
import { Keypair } from '@solana/web3.js';
require('dotenv').config();



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
const path = (require('path').join(process.env.PRIV_KEY_PATH));
    return loadKeypairFromFile(path);
}

const keyPair = getUserKeypair()
console.log("User Key: ",keyPair.publicKey.toString());
