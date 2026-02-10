# Text Node (GPT API)

Verifiable Intelligence. Constrained by Truth. Powered by Gemini.

## What This Does

Acts as a "Verifiable Agent". Receives user questions. Fetches verified data from on-chain registry. Injects context into prompt. Answers *only* using trusted sources. Eliminates hallucinations.

## Features

- **Gemini Integration**: Uses Google's LLM for natural language.
- **Context Awareness**: Reads `KnowledgeShare` contract for facts.
- **Credit Metering**: Deducts on-chain credits per query.

## Prerequisites

- Node.js 18+
- Gemini API Key
- Wallet Private Key (for marking usage)

## Installation

Navigate to directory:
```bash
cd gpt_api
```

Install dependencies:
```bash
npm install
```

Create `.env` file:
```env
GEMINI_API_KEY=your_gemini_key
PRIVATE_KEY=your_wallet_private_key
RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
PORT=3001
```

## Running the Node

Start the server:
```bash
npm start
```

Server runs on `http://localhost:3001`. Accepts POST requests to `/chat`.
