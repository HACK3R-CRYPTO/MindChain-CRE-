import express from 'express';
import { JsonRpcProvider, Wallet, isAddress, Contract } from 'ethers';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const {
  GEMINI_API_KEY,
  GEMINI_MODEL = 'gemini-2.0-flash',
  OPENAI_API_KEY,
  OPENAI_MODEL = 'gpt-4o-mini',
  PRIVATE_KEY,
  RPC_URL,
  PORT,
  ALLOWED_ORIGIN,
  PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/',
  PAYMENT_GATEWAY_ADDRESS,
  KNOWLEDGE_SHARE_ADDRESS
} = process.env;

const looksLikePlaceholder = (value) =>
  !value || /your[_-]?api[_-]?key/i.test(value);

const hasGeminiKey = !looksLikePlaceholder(GEMINI_API_KEY);
const hasOpenAIKey = !looksLikePlaceholder(OPENAI_API_KEY);

if (!PRIVATE_KEY || !RPC_URL) {
  console.error('Error: Missing PRIVATE_KEY or RPC_URL environment variables.');
  process.exit(1);
}

if (!PAYMENT_GATEWAY_ADDRESS || !KNOWLEDGE_SHARE_ADDRESS) {
  console.error('Error: Missing contract addresses in environment variables.');
  process.exit(1);
}

if (!hasGeminiKey && !hasOpenAIKey) {
  console.warn('Warning: No AI provider key (Gemini or OpenAI). Running in mock mode.');
}

let geminiModel = null;
if (hasGeminiKey) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    console.log(`Gemini provider configured (model: ${GEMINI_MODEL}).`);
  } catch (error) {
    console.error('Failed to initialize Gemini provider:', error);
  }
}

let openaiClient = null;
if (hasOpenAIKey) {
  try {
    openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
    console.log(`OpenAI provider configured (model: ${OPENAI_MODEL}).`);
  } catch (error) {
    console.error('Failed to initialize OpenAI provider:', error);
  }
}

if (!geminiModel && !openaiClient) {
  console.warn('No AI provider is available. Responses will be mocked.');
}

// Payment Gateway ABI (minimal for balance adjustment/checking if needed)
// NOTE: PaymentGateway doesn't really have "balanceOf" for users in the x402 sense, 
// it has `getUserPayments`. But we are skipping credit check for hackathon anyway.
// We will keep the old ABI logic but point to new address to avoid breaking code structure,
// even if we are mocking/skipping the check.
const CONTRACT_ADDRESS = PAYMENT_GATEWAY_ADDRESS;
const KNOWLEDGE_ADDRESS = KNOWLEDGE_SHARE_ADDRESS;

const ABI = [
  'function purchase() external payable returns (uint256)',
  'function balanceOf(address _address) external view returns (uint256)',
  'function markUsage(address _address) external returns (uint256)',
];

const KNOWLEDGE_ABI = [
  'function getDataCount() public view returns (uint256)',
  'function getCids(uint256 start, uint256 limit) public view returns (string[] memory)',
  'function getData(string memory _cid) public view returns (tuple(string cid, address owner, uint256 price, string description, uint256 voteCount, uint8 status, bool exists))'
];

const generalKnowledgeSentences = [];

const app = express();
app.use(express.json());

const normalizeOrigins = (originValue) => {
  if (!originValue) return undefined;
  return originValue
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const corsOrigins = normalizeOrigins(ALLOWED_ORIGIN);
app.use(cors()); // Allow all origins by default for hackathon simplicity


const provider = new JsonRpcProvider(RPC_URL);
const wallet = new Wallet(PRIVATE_KEY, provider);
const contract = new Contract(CONTRACT_ADDRESS, ABI, wallet);
const knowledgeContract = new Contract(KNOWLEDGE_ADDRESS, KNOWLEDGE_ABI, provider);

async function fetchOnChainKnowledge() {
  try {
    const count = await knowledgeContract.getDataCount();
    const limit = 5; // Get last 5 items
    const start = count > limit ? count - BigInt(limit) : 0;
    const cids = await knowledgeContract.getCids(start, Number(count)); // count might be bigint, careful

    // cids is an array of strings
    const knowledgePromises = cids.map(async (cid) => {
      const data = await knowledgeContract.getData(cid);
      // Only include Verified knowledge (status === 1)
      if (Number(data.status) === 1) {
        try {
          // Fetch real data from IPFS
          console.log(`Fetching IPFS content for CID: ${cid}`);
          const response = await axios.get(`${PINATA_GATEWAY}${cid}`);
          const content = typeof response.data === 'object' ? JSON.stringify(response.data) : response.data;
          return content;
        } catch (err) {
          console.warn(`Failed to fetch IPFS for ${cid}:`, err.message);
          return data.description; // Fallback to on-chain description
        }
      }
      return null;
    });

    const results = await Promise.all(knowledgePromises);
    return results.filter(k => k && k.length > 0);
  } catch (error) {
    console.error('Error fetching on-chain knowledge:', error);
    return [];
  }
}

async function generateResponse(prompt) {
  if (geminiModel) {
    try {
      const result = await geminiModel.generateContent(prompt);
      const text = result?.response?.text?.();
      if (text) {
        return text.trim();
      }
    } catch (error) {
      console.error('Gemini generation failed:', error);
      if (!openaiClient) {
        throw error;
      }
    }
  }

  if (openaiClient) {
    const completion = await openaiClient.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'You are Mindchain AI. You prioritize Verified On-Chain Knowledge when relevant, but otherwise function as a helpful general assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (content) {
      return content.trim();
    }
    return 'No response generated.';
  }

  throw new Error('No AI provider available.');
}

// Mock response generator
async function generateMockResponse(prompt) {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
  return `[Mock AI Response] You asked: "${prompt.split('\n\n').pop()}". This is a simulated response since no API key was provided.`;
}

app.post('/query-ai', async (req, res) => {
  try {
    const { query, ethAddress } = req.body;

    if (!query || !ethAddress) {
      return res.status(400).json({ error: 'Missing query or ethAddress in request body.' });
    }

    if (!isAddress(ethAddress)) {
      return res.status(400).json({ error: 'Invalid Ethereum address.' });
    }

    if (process.env.SKIP_CREDIT_CHECK !== 'true') {
      const balance = await contract.balanceOf(ethAddress);
      if (balance < 1n) {
        return res.status(403).json({ error: 'Insufficient credits.' });
      }
    }

    const onChainKnowledge = await fetchOnChainKnowledge();
    const context = [
      ...generalKnowledgeSentences,
      ...onChainKnowledge.map(k => `[On-Chain Knowledge]: ${k}`)
    ].join('\n');

    console.log('--- AI Context Start ---');
    console.log(context);
    console.log('--- AI Context End ---');

    const prompt = `
You are Mindchain AI. You have access to a decentralized registry of "Verified On-Chain Knowledge".

INSTRUCTIONS:
1. FIRST, check the "Verified On-Chain Knowledge" below.
   - If it contains the answer, USE IT and mention it is "verified by the community".
   - If it contains CONFLICTING information, mention both claims.

2. SECOND, if the Verified Knowledge does NOT answer the question (or is empty):
   - Answer the question using your own general knowledge.
   - You do NOT need to apologize for missing registry data.
   - Just answer helpfully like a normal AI Assistant.

Verified On-Chain Knowledge:
${onChainKnowledge.length > 0 ? onChainKnowledge.map(k => `- ${k}`).join('\n') : "(No verified knowledge available yet)"}

User Question:
${query}
`.trim();

    let aiResponse;
    if (geminiModel || openaiClient) {
      aiResponse = await generateResponse(prompt);
    } else {
      aiResponse = await generateMockResponse(prompt);
    }

    // try {
    //   const markUsageTx = await contract.markUsage(ethAddress);
    //   await markUsageTx.wait();
    //   console.log(`Marked usage for address: ${ethAddress}`);
    // } catch (txError) {
    //   console.error(`Failed to mark usage for address ${ethAddress}:`, txError);
    // }

    res.json({ result: aiResponse });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

const serverPort = PORT || 3000;
app.listen(serverPort, () => {
  console.log(`Server running on port ${serverPort}`);
});
