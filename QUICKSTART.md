# AgentMind CRE - Quick Start Guide

This guide will help you get the AgentMind CRE project up and running.

## Prerequisites Checklist

Before you begin, make sure you have:

- [ ] Node.js 18+ installed
- [ ] MetaMask wallet with Ethereum Sepolia testnet configured
- [ ] Sepolia ETH from a faucet ([sepoliafaucet.com](https://sepoliafaucet.com))
- [ ] Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- [ ] Infura account for Sepolia RPC ([infura.io](https://infura.io))

## Step 1: Install CRE CLI

```bash
# Install CRE CLI
curl -sSL https://install.chain.link/cre | bash

# Verify installation
cre version
```

## Step 2: Create CRE Account

1. Go to [cre.chain.link](https://cre.chain.link)
2. Sign up for an account
3. Complete the onboarding process

## Step 3: Authenticate

```bash
# Login to CRE
cre login

# Verify authentication
cre whoami
```

## Step 4: Configure Environment

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your credentials in `.env`:
```bash
# Required:
SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (will be filled after deployment):
AGENT_REGISTRY_ADDRESS=
PAYMENT_GATEWAY_ADDRESS=
```

## Step 5: Install Dependencies

```bash
# Install all dependencies
npm run setup

# Or install individually:
cd workflows/ai-agent && bun install
cd ../../contracts && npm install
```

## Step 6: Deploy Smart Contracts

```bash
# Compile contracts
cd contracts
npm run compile

# Deploy to Ethereum Sepolia
npm run deploy:sepolia

# The deployment script will automatically update your .env file
```

## Step 7: Simulate CRE Workflow

```bash
# Navigate to workflow directory
cd workflows/ai-agent

# Simulate the workflow locally
cre workflow simulate .

# You should see output indicating successful simulation
```

## Step 8: Deploy CRE Workflow (Optional)

> **Note:** This requires early access to CRE deployment features

```bash
# Deploy workflow to CRE network
cd workflows/ai-agent
cre workflow deploy .

# Activate the workflow
cre workflow activate <WORKFLOW_ID>
```

## Step 9: Test the System

### Test 1: Register as an Agent

Use the frontend or directly interact with the contract:

```bash
# Using cast (from Foundry)
cast send $AGENT_REGISTRY_ADDRESS \
  "registerAgent(string,string)" \
  "MyAIAgent" \
  "ipfs://QmTest..." \
  --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY
```

### Test 2: Make a Payment

```bash
# Approve USDC spending
cast send $USDC_SEPOLIA \
  "approve(address,uint256)" \
  $PAYMENT_GATEWAY_ADDRESS \
  10000 \
  --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY

# Record payment
cast send $PAYMENT_GATEWAY_ADDRESS \
  "recordPayment(bytes32,uint256,bytes32)" \
  0x1234... \
  10000 \
  0x5678... \
  --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY
```

### Test 3: Query the CRE Workflow

```bash
# Send HTTP request to CRE workflow endpoint
curl -X POST https://your-workflow-url.cre.chain.link/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is blockchain?",
    "userAddress": "0xYourAddress",
    "paymentProof": "0xTxHash"
  }'
```

## Troubleshooting

### Issue: CRE CLI not found
**Solution:** Make sure you've added CRE to your PATH. Restart your terminal after installation.

### Issue: Insufficient funds for deployment
**Solution:** Get more Sepolia ETH from [sepoliafaucet.com](https://sepoliafaucet.com)

### Issue: USDC not found on Sepolia
**Solution:** The USDC address in `.env.example` is a test/mock USDC. You may need to deploy your own ERC20 token for testing.

### Issue: Workflow simulation fails
**Solution:** 
1. Make sure all dependencies are installed: `cd workflows/ai-agent && bun install`
2. Check that your `.env` file has all required variables
3. Verify your Gemini API key is valid

## Next Steps

1. **Build the Frontend** - Create a Next.js frontend for user interaction
2. **Implement x402 Server** - Build the payment server
3. **Test End-to-End** - Test the complete flow from payment to AI response
4. **Record Demo Video** - Create a 3-5 minute walkthrough
5. **Submit to Hackathon** - Prepare your submission

## Useful Commands

```bash
# Check contract deployment
npx hardhat run scripts/deploy.ts --network sepolia

# Verify contracts on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>

# Simulate workflow
cd workflows/ai-agent && cre workflow simulate .

# View workflow logs
cre workflow logs <WORKFLOW_ID>

# Check agent registry
cast call $AGENT_REGISTRY_ADDRESS "totalAgents()" --rpc-url $SEPOLIA_RPC
```

## Support

- [Chainlink Documentation](https://docs.chain.link)
- [CRE Documentation](https://docs.chain.link/chainlink-runtime-environment)
- [x402 Protocol](https://x402.org)
- [Hackathon Discord](https://discord.com/invite/chainlink)

---

**Good luck with your hackathon project! 🚀**
