# MindChain Frontend 🎨

The user interface for the **MindChain CRE** platform, built with **Next.js 14**, **Tailwind CSS**, and **wagmi/viem**.

## ✨ Features

- **Connect Wallet**: Integrated with RainbowKit/Wagmi for Base Sepolia.
- **MNIST Canvas**: Draw digits and submit them for AI prediction (with on-chain payment).
- **Agent Registry**: Interact with the ERC-8004 contract to register identities.
- **Knowledge Share**: Upload knowledge to IPFS and submit to the blockchain.
- **AI Chat**: Pay-per-use chat interface integrated with Chainlink CRE via Next.js API routes.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Web3**: wagmi, viem, TanStack Query
- **IPFS**: Pinata SDK

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- `contracts` deployed (for contract addresses)

### Installation
```bash
npm install
```

### Configuration
Create a `.env.local` file:
```bash
# WalletConnect Project ID (Get from cloud.walletconnect.com)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# Deployed Contract Addresses (Base Sepolia)
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0x78A54d9Fcf0F0aB91fbeBdf722EFcC1039c98514
NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS=0x6AE46C7Ec04d72E7e14268e59Cdfb639f5b68519
NEXT_PUBLIC_KNOWLEDGE_SHARE_ADDRESS=0x... # (Update after deployment)
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### Run Locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🤖 AI Chat Integration
The AI Chat uses a Next.js API Route (`/api/chat`) which acts as a bridge between the frontend wallet signature/payment and the **Chainlink CRE** environment (or local simulation).

## 📄 Pages
- **Home (`/`)**: Main dashboard with tabs for MNIST, Knowledge, and Agent Registry.
- **API (`/api/chat`)**: Backend route for AI processing.
