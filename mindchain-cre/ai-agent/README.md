# MindChain AI Agent Workflow 🧠

This directory contains the **Chainlink Runtime Environment (CRE)** workflow that powers the AI capabilities of the MindChain platform.

## 🎯 What it Does

1.  **Receives Request**: Listens for HTTP triggers from the Next.js frontend (`/api/chat`).
2.  **Verifies Identity**: Checks the user's `AgentRegistry` status on Base Sepolia (Simulated/Mocked for generic call).
3.  **Secure Execution**: Retrieves `GEMINI_API_KEY` using `runtime.getSecret`.
4.  **AI Processing**: Calls Google's Gemini 2.0 Flash API to generate a response based on the on-chain persona.
5.  **Returns Result**: Sends the AI response back to the frontend.

## 📂 Structure

- **`main.ts`**: The core logic. Typescript workflow using `@chainlink/cre-sdk`.
- **`workflow.yaml`**: Configuration for the workflow (entry point, secrets path, etc.).
- **`secrets.yaml`**: Encrypted/Local secrets file (Gitignored).
- **`package.json`**: Dependencies.

## 🧪 Simulation (Hackathon Demo)

Since CRE deployment is in Early Access, we use the **CLI Simulator** for the demo.

### 1. Setup Secrets
Ensure you have `mindchain-cre/secrets.yaml`:
```yaml
GEMINI_API_KEY: AIzaSy...
```

### 2. Run Simulation
Run this command from the `mindchain-cre` root:
```bash
cre workflow simulate ai-agent --target production-settings --non-interactive --trigger-index 0 --http-payload '{"action": "chat", "query":"Who are you?", "userAddress": "0x123", "paymentTxHash": "0xabc"}'
```

> [!IMPORTANT]
> **Secrets in Local Simulation**:
> If the simulator fails to read `secrets.yaml`, we have implemented a **Fallback Mechanism** in `main.ts` (lines 130+).
> Uncomment the fallback block and paste your key strictly for recording the demo video, then revert it before pushing.

## 🛠️ Development

To modify the workflow:
1.  Edit `main.ts`.
2.  Run `bun install` to update dependencies.
3.  Simulate to test changes.
