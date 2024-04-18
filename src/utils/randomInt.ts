const crypto = require('crypto')

export function getRandomNumber(){
  const buffer = crypto.randomBytes(1);
  const randomNumber = buffer[0]%10; // get numbers from 0 to 9
  return randomNumber;
}