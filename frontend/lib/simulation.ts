import { createPublicClient, http, defineChain } from 'viem'
import { baseSepolia } from 'viem/chains'

// Agent Registry ABI (Partial)
const AGENT_REGISTRY_ABI = [
    {
        "inputs": [{ "name": "agent", "type": "address" }],
        "name": "getAgentInfo",
        "outputs": [
            { "name": "tokenId", "type": "uint256" },
            { "name": "name", "type": "string" },
            { "name": "reputation", "type": "int256" },
            { "name": "totalInteractions", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const

const client = createPublicClient({
    chain: baseSepolia,
    transport: http()
})

const AGENT_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS as `0x${string}`

export async function runSimulation(query: string, userAddress: string) {
    console.log('🔮 Running AgentMind in Simulation Mode...')

    // 1. Get Agent Identity
    let agentName = "Agent Zero"
    let agentReputation = "0"

    if (AGENT_REGISTRY_ADDRESS && userAddress) {
        try {
            const result = await client.readContract({
                address: AGENT_REGISTRY_ADDRESS,
                abi: AGENT_REGISTRY_ABI,
                functionName: 'getAgentInfo',
                args: [userAddress as `0x${string}`]
            })
            // result is [tokenId, name, reputation, totalInteractions]
            agentName = result[1]
            agentReputation = result[2].toString()
        } catch (e) {
            console.warn('Failed to fetch agent identity:', e)
        }
    }

    // 2. Call Gemini
    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) {
        throw new Error('GEMINI_API_KEY is not set in environment')
    }

    const systemPrompt = `You are MindChain, an AI Assistant on Base Sepolia.
You are talking to an agent named ${agentName} (Reputation: ${agentReputation}).
Keep answers concise and helpful.`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${query}` }] }]
        })
    })

    const data = await response.json()
    let aiResponse = "I'm thinking, but I couldn't generate a response right now."

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        aiResponse = data.candidates[0].content.parts[0].text
    } else if (data.error) {
        throw new Error(`Gemini API Error: ${data.error.message}`)
    }

    // Return format matches CRE structure
    return {
        status: "success",
        result: aiResponse,
        agent: {
            name: agentName,
            reputation: agentReputation
        },
        simulation: true
    }
}
