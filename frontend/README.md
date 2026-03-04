# MindChain Frontend 🎨

The user interface for the **MindChain CRE** platform, built with **Next.js 14**, **Tailwind CSS**, and **wagmi/viem**.

## ✨ Features

- **Connect Wallet**: Integrated with RainbowKit/Wagmi for **Base Sepolia**.
- **MNIST Canvas**: Draw digits and get AI predictions (integrated python API).
- **Agent Registry**: Register on-chain identities (ERC-8004) with reputation tracking.
- **Knowledge Share**: Submit IPFS-backed knowledge to the blockchain and vote on it.
- **AI Chat**: Context-aware AI assistant with **History Memory**, **Verified Knowledge** access, and full **Markdown Rendering**.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Web3**: wagmi, viem, TanStack Query
- **IPFS**: Pinata SDK
- **UI/UX**: `react-markdown`, `@tailwindcss/typography`

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
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0xB16DFC88DEA04642aAB9F06C3605FD0d1D3Bfd63
NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS=0xD7c2951C3eCE0aad1a4e8264107e34DCfbC4018B
NEXT_PUBLIC_KNOWLEDGE_SHARE_ADDRESS=0xe3c4eF214ef36bEFb375D7D8A4782252B037e8C3
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
