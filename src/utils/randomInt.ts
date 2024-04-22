const crypto = require('crypto')

export function getRandomNumber(limit:number){
  const buffer = crypto.randomBytes(1);
  const randomNumber = buffer[0]%limit; // get random number upto limit
  return randomNumber;
}