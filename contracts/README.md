# MindChain Smart Contracts 📜

This directory contains the Solidity smart contracts for the **MindChain CRE** platform, deployed on **Base Sepolia**.

## 🏗️ Contracts

### 1. `AgentRegistry.sol` (ERC-8004)
- **Standard**: Follows [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) for Agent Identity.
- **Function**: Registers AI Agents on-chain with metadata (Name, Bio, Capabilities) stored on IPFS.
- **Features**: Reputation scoring, Total Interactions counter.

### 2. `PaymentGateway.sol`
- **Function**: Handles direct on-chain micropayments for AI services.
- **Asset**: USDC on Base Sepolia (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`).
- **Flow**: User approves USDC -> Calls `recordPayment` -> Emits event for off-chain verification.

### 3. `KnowledgeShare.sol`
- **Function**: Decentralized registry for community-submitted knowledge.
- **Storage**: Maps IPFS CIDs to on-chain metadata (Owner, Price, Verification Status).
- **Features**: Voting/Verification mechanism for quality control.

## 🚀 Setup & Deployment

### Prerequisites
- Node.js 18+
- Hardhat
- Base Sepolia ETH

### Installation
```bash
npm install
```

### Configuration
Create a `.env` file:
```bash
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_RPC=https://sepolia.base.org
ETHERSCAN_API_KEY=your_basescan_key
```

### Compile
```bash
npx hardhat compile
```

### Deploy to Base Sepolia
```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

### Run Tests
```bash
npx hardhat test
```

## 📍 Deployed Addresses (Base Sepolia)
| Contract | Address | Explorer |
|----------|---------|----------|
| AgentRegistry | `0x0Cd8459F4cAc09517392896639938dDA01dD6fd9` | [View](https://sepolia.basescan.org/address/0x0Cd8459F4cAc09517392896639938dDA01dD6fd9) |
| PaymentGateway | `0xa6f0e4027F97B448369463288c46436D3DaD6b24` | [View](https://sepolia.basescan.org/address/0xa6f0e4027F97B448369463288c46436D3DaD6b24) |
| KnowledgeShare | `0x1f9090aaE28b8a3dCeaDf281B0F12821e67211d2` | [View](https://sepolia.basescan.org/address/0x1f9090aaE28b8a3dCeaDf281B0F12821e67211d2) |
