import { Wallet } from 'ethers';
const privateKey = '0x29332143cd080547332727a8f7b2110c16dda3b9a74653b8084e54a24c076478';
const wallet = new Wallet(privateKey);
console.log(wallet.address);
