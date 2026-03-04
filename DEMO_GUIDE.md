# 🚀 MindChain CRE: Demo Execution Guide

Follow these steps to run the full end-to-end demo exactly as envisioned in the script.

### 1. Setup Secrets
The workflow uses the standard CRE secrets retrieval. Ensure your root `.env` file has the following variables:
```bash
GEMINI_API_KEY_VAR=your_api_key_here
```
The `secrets.yaml` file in the root maps this environment variable to the `GEMINI_API_KEY` ID used in the code.

### 2. Run Simulation
Run the simulation command from the project root:

**Terminal 1: Frontend (Already Running)**
```bash
cd frontend && npm run dev
```
> [!NOTE]
> Access at: [http://localhost:3000](http://localhost:3000)

**Terminal 2: CRE Engine Verification (The "Technical Knockout")**
```bash
npm run dev:workflow
```
> [!TIP]
> This command uses the standardized `project.yaml` and `secrets.yaml` at the root level to simulate the AI workflow.

---

## 2. Testing the Flow 🧪

### 🆔 Step 1: ERC-8004 Agent Registration
1. Navigate to **Agent Registry**.
2. Register your wallet as an AI Agent (e.g., "MindChain Oracle").
3. **Verify**: Check the browser console or the "Registered Successfully" message. This creates a Discovery v1 registration file on IPFS and links it to your Base Sepolia identity.

### 💬 Step 2: x402 Verifiable Chat (Text Node)
1. Navigate to **AI Chat**.
2. **Action**: Type a message.
3. **Observation**:
   - **Payment**: You will be prompted to approve and pay 0.01 USDC.
   - **Verification**: The AI response will show the **🔒 CRE Verified** badge.
   - **Reputation**: Notice the **★ Rep: 100/100** badge showing your registry-synced score.

### 👁️ Step 3: Heterogeneous Vision Node
1. Navigate to **Vision Node** (MNIST Drawing).
2. Draw a digit and click **Predict**.
3. **Observation**: This demonstrates the CRE orchestrating specialized Python/TensorFlow compute off-chain and returning the result.

### 🧠 Step 4: Knowledge Monetization
1. Navigate to **Knowledge Hub**.
2. Submit a fact (e.g., "MindChain Alpha v1 Ready").
3. **Verify**: See it appearing in the feed. Once verified on-chain, it becomes part of the shared memory used in Step 2.

---

## 🏗️ Reorganization Proof
- **Root level**: `project.yaml`, `secrets.yaml`, `package.json`.
- **Primary source**: `ai-agent/main.ts`.
- **Standards**: EIP-8004, EIP-712/1271, x402.
