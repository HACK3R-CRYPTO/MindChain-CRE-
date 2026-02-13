# ⚡ MindChain CRE - Quick Start Guide

This guide will help you get the **MindChain CRE** project up and running on **Base Sepolia**.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- [ ] **Node.js 18+** & **npm** installed
- [ ] **Python 3.10+** (if running the Vision Node locally)
- [ ] **MetaMask** with **Base Sepolia** testnet configured
- [ ] **Base Sepolia ETH** ([Alchemy Faucet](https://www.alchemy.com/faucets/base-sepolia))
- [ ] **Base Sepolia USDC** ([Circle Faucet](https://faucet.circle.com/))
- [ ] **Gemini API Key** ([Google AI Studio](https://aistudio.google.com/))

---

## 🛠️ Step 1: Install CRE CLI

The Chainlink Runtime Environment (CRE) CLI is required for workflow simulation.

```bash
# Install CRE CLI
curl -sSL https://install.chain.link/cre | bash

# Authenticate
cre login
```

---

## 📂 Step 2: Configure Environment

Create and fill the following environment files:

### 1. Frontend (`frontend/.env.local`)
```bash
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS=0xa6f0e4027F97B448369463288c46436D3DaD6b24
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0x0Cd8459F4cAc09517392896639938dDA01dD6fd9
NEXT_PUBLIC_KNOWLEDGE_SHARE_ADDRESS=0xe3c4eF214ef36bEFb375D7D8A4782252B037e8C3
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_here
GEMINI_API_KEY=your_gemini_key_here
```

### 2. CRE Workflow (`mindchain-cre/ai-agent/.env`)
```bash
BASE_SEPOLIA_RPC=your_base_sepolia_rpc_url
GEMINI_API_KEY=your_gemini_key_here
```

---

## 🚀 Step 3: Run the Project

### 1. Launch Vision Node (Python)
```bash
cd mnist_api
pip install -r requirements.txt
python app.py  # Runs on http://localhost:3002
```

### 2. Launch Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev    # Runs on http://localhost:3000
```

---

## 🧪 Step 4: Verification

### 1. Simulate CRE Workflow
Proves the orchestration layer is correctly configured.
```bash
cd mindchain-cre/ai-agent
cre workflow simulate .
```

### 2. Test AI Registry
1. Connect wallet to Base Sepolia on `localhost:3000`.
2. Navigate to **Agent Registry**.
3. Register your agent identity (Mints an ERC-8004 NFT).

### 3. Test Text Node (Chat)
1. Navigate to **AI Chat**.
2. Send a query.
3. Approve the 0.01 USDC payment to trigger the CRE orchestration.

---

## 📁 Project Structure Recap

- `/mindchain-cre/ai-agent`: The **CRE Workflow** logic (TypeScript).
- `/contracts`: **Solidity** contracts (AgentRegistry, PaymentGateway).
- `/frontend`: The **Next.js** application.
- `/mnist_api`: The specialized **Vision Node** (Python).

---

## 🏆 Hackathon Submission Checklist

- [x] CRE Workflow integrated and simulated
- [x] Base Sepolia smart contracts deployed
- [x] x402-style on-chain payments functional
- [x] README links to all Chainlink components
- [x] 3-5 minute demo video recorded

---

**Built for the Chainlink Convergence Hackathon 2026** 🚀
