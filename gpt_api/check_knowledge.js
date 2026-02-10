import { JsonRpcProvider, Contract } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const { RPC_URL } = process.env;
const KNOWLEDGE_ADDRESS = '0x7A2b66A6ec9892fB9f40EAbF45bB5C2b723263F5';
const KNOWLEDGE_ABI = [
  'function getDataCount() public view returns (uint256)',
  'function getCids(uint256 start, uint256 limit) public view returns (string[] memory)',
  'function getData(string memory _cid) public view returns (tuple(string cid, address owner, uint256 price, string description, uint256 voteCount, uint8 status, bool exists))'
];

async function main() {
  const provider = new JsonRpcProvider(RPC_URL);
  const contract = new Contract(KNOWLEDGE_ADDRESS, KNOWLEDGE_ABI, provider);

  try {
    const count = await contract.getDataCount();
    console.log(`Data count: ${count}`);

    if (count > 0n) {
      const limit = 5;
      const start = count > BigInt(limit) ? count - BigInt(limit) : 0;
      const cids = await contract.getCids(start, Number(count));
      console.log('CIDs:', cids);

      for (const cid of cids) {
        const data = await contract.getData(cid);
        console.log(`Data for ${cid}:`, data);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
