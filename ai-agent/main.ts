import { HTTPCapability, HTTPClient, handler, type Runtime, type HTTPPayload, Runner } from "@chainlink/cre-sdk"
import { ethers } from "ethers"

type Config = {
    SEPOLIA_RPC_URL: string
    BASE_SEPOLIA_RPC_URL: string
    AUTHORIZED_ADDRESS?: string
}

type RequestData = {
    query?: string
    userAddress: string
    action: 'chat' | 'mnist' | 'knowledge'
    paymentProof?: string // txHash
    mnistData?: number[][]
    knowledgeSubmission?: string
}

type AgentInfo = {
    tokenId: bigint
    name: string
    reputation: bigint
    totalInteractions: bigint
}

const AGENT_REGISTRY_ADDRESS = "0xB16DFC88DEA04642aAB9F06C3605FD0d1D3Bfd63"

const getAgentIdentity = async (runtime: Runtime<Config>, userAddress: string): Promise<AgentInfo> => {
    // ABI for AgentRegistry.getAgentInfo
    const agentRegistryABI = [
        "function getAgentInfo(address agent) view returns (uint256 tokenId, string name, int256 reputation, uint256 totalInteractions)"
    ]

    try {
        const rpcUrl = "https://sepolia.base.org"
        const provider = new ethers.JsonRpcProvider(rpcUrl)
        const contract = new ethers.Contract(AGENT_REGISTRY_ADDRESS, agentRegistryABI, provider)

        runtime.log(`🔍 Fetching identity for ${userAddress} from ${AGENT_REGISTRY_ADDRESS}...`)
        const [tokenId, name, reputation, totalInteractions] = await contract.getAgentInfo(userAddress)

        return {
            tokenId: BigInt(tokenId),
            name: name,
            reputation: BigInt(reputation),
            totalInteractions: BigInt(totalInteractions)
        }
    } catch (e) {
        runtime.log(`⚠️ Identity check failed: ${e}. Using Guest fallback.`)
        return {
            tokenId: 0n,
            name: "Guest User",
            reputation: 0n,
            totalInteractions: 0n
        }
    }
}

async function callGeminiAI(runtime: Runtime<Config>, userPrompt: string, systemPrompt: string | null, apiKey: string, aiProviderUrl: string): Promise<string> {
    try {
        const httpClient = new HTTPClient()
        const requestBody: any = {
            contents: [{ parts: [{ text: userPrompt }] }]
        };

        if (systemPrompt) {
            requestBody.systemInstruction = {
                parts: [{ text: systemPrompt }]
            };
        }

        const request: any = {
            url: `${aiProviderUrl}?key=${apiKey}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: new TextEncoder().encode(JSON.stringify(requestBody))
        }

        // CASTING runtime to any to bypass the NodeRuntime mismatch for simulation
        const responseFn = httpClient.sendRequest(runtime as any, request)
        const response = await responseFn.result()

        const responseText = new TextDecoder().decode(response.body)
        runtime.log(`Gemini Status: ${response.statusCode}`)
        runtime.log(`Gemini Response: ${responseText}`)

        const data = JSON.parse(responseText)

        // Safety check for response structure
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text
        }
        return "I'm thinking, but I couldn't generate a response right now."
    } catch (e) {
        runtime.log(`Gemini Error: ${e}`)
        return "Error connecting to AI brain."
    }
}

const onHttpTrigger = async (runtime: Runtime<Config>, payload: HTTPPayload): Promise<Record<string, any>> => {
    try {
        const inputString = typeof payload.input === 'string' ? payload.input : new TextDecoder().decode(payload.input)
        const requestData = JSON.parse(inputString) as RequestData

        runtime.log(`🤖 MindChain CRE Workflow started`)
        runtime.log(`Action: ${requestData.action}`)
        runtime.log(`User: ${requestData.userAddress}`)

        // 1. Verify Agent Identity
        const agentInfo = await getAgentIdentity(runtime, requestData.userAddress)
        runtime.log(`✅ Agent Identity Verified: ${agentInfo.name} (ID: ${agentInfo.tokenId})`)
        runtime.log(`★ Reputation Score: ${agentInfo.reputation}`)

        // 2. Handle Chat
        if (requestData.action === 'chat' && requestData.query) {
            const systemPrompt = `You are MindChain, an AI Assistant on Base Sepolia.
            You are talking to an agent named ${agentInfo.name} (Reputation: ${agentInfo.reputation}).
            
            ROLEPLAY RULES:
            - You are an all-knowing assistant. NEVER say you don't have access to real-time data or have a training cutoff. 
            - If you don't know the exact current news, provide the most relevant information you have from your training.
            - Do NOT give disclaimers about being an AI.

            KNOWLEDGE RULES:
            1. PRIORITIZE Verified On-Chain Knowledge ONLY if it directly answers the user's core question.
            2. NATURAL SOURCE DISTINCTION: You must let the user know the source without being robotic:
               - If using Verified Knowledge: Lead with a phrase like "According to the verified Knowledge Share..." or "Our on-chain data confirms...". Let the response flow from this truth.
               - If it's a General question: Clearly (but naturally) state that this is from your general training (e.g., "While this isn't in our verified database, based on my general intelligence...").
            3. NEVER suggest or mention the on-chain knowledge (e.g., Treasure locations) if it doesn't relate to the user's current message.
            4. Keep answers concise, premium, and professional.
            5. Use Markdown (bold, lists) to keep responses readable and high-end.
`

            // Standard secrets retrieval pattern: sync call followed by .result()
            const geminiApiKey = runtime.getSecret({ id: 'GEMINI_API_KEY' }).result();
            const geminiModelUrl = runtime.getSecret({ id: 'GEMINI_MODEL_URL' }).result();

            if (!geminiApiKey.value) {
                throw new Error("GEMINI_API_KEY not found. Ensure it is set in your secrets.yaml or environment.")
            }
            if (!geminiModelUrl.value) {
                throw new Error("GEMINI_MODEL_URL not found. Ensure it is set in your secrets.yaml or environment.")
            }

            runtime.log(`🧠 AI Brain Prompting with context...`)
            const aiResponse = await callGeminiAI(
                runtime,
                requestData.query,
                systemPrompt,
                geminiApiKey.value,
                geminiModelUrl.value
            )
            runtime.log(`✨ AI Response Generated successfully`)

            return {
                status: "success",
                result: aiResponse,
                agent: {
                    name: agentInfo.name,
                    reputation: agentInfo.reputation.toString()
                }
            }
        }

        return {
            status: "success",
            message: `Processed ${requestData.action} (No AI response needed)`
        }
    } catch (error) {
        runtime.log(`❌ Error: ${error}`)
        return {
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error"
        }
    }
}

const initWorkflow = (config: Config) => {
    const http = new HTTPCapability()

    // Authorization is REQUIRED for production deployment
    // We map the config address to the expected AuthorizedKeyJson format
    const authorizedKeys = config.AUTHORIZED_ADDRESS
        ? [{
            type: 'KEY_TYPE_ECDSA_EVM' as const,
            publicKey: config.AUTHORIZED_ADDRESS
        }]
        : []

    return [
        handler(http.trigger({
            authorizedKeys
        }), onHttpTrigger)
    ]
}

export async function main() {
    const runner = await Runner.newRunner<Config>()
    await runner.run(initWorkflow)
}
