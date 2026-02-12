import { createPublicClient, http, defineChain } from 'viem'
import { baseSepolia } from 'viem/chains'
import { getFromIPFS } from './ipfs'

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

// Knowledge Share ABI (Enhanced)
const KNOWLEDGE_SHARE_ABI = [
    {
        "inputs": [
            { "name": "start", "type": "uint256" },
            { "name": "limit", "type": "uint256" }
        ],
        "name": "getCids",
        "outputs": [{ "name": "", "type": "string[]" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "_cid", "type": "string" }],
        "name": "getKnowledge",
        "outputs": [
            {
                "components": [
                    { "name": "ipfsCid", "type": "string" },
                    { "name": "owner", "type": "address" },
                    { "name": "price", "type": "uint256" },
                    { "name": "description", "type": "string" },
                    { "name": "voteCount", "type": "uint256" },
                    { "name": "status", "type": "uint8" },
                    { "name": "timestamp", "type": "uint256" },
                    { "name": "exists", "type": "bool" }
                ],
                "internalType": "struct KnowledgeShare.KnowledgeItem",
                "name": "",
                "type": "tuple"
            }
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
const KNOWLEDGE_SHARE_ADDRESS = process.env.NEXT_PUBLIC_KNOWLEDGE_SHARE_ADDRESS as `0x${string}`

export async function runSimulation(query: string, userAddress: string, history: any[] = []) {
    console.log('\n==================================================')
    console.log('⚡ SIMULATION MODE: Skipping Decentralized CRE Network')
    console.log('==================================================\n')
    console.log('🔮 Running AgentMind in Simulation Mode...')

    // 1. Get Agent Identity (Graceful Fallback)
    // ... (Same as before)
    let agentName = "Guest User"
    let agentReputation = "0"

    if (AGENT_REGISTRY_ADDRESS && userAddress) {
        try {
            const result = await client.readContract({
                address: AGENT_REGISTRY_ADDRESS,
                abi: AGENT_REGISTRY_ABI,
                functionName: 'getAgentInfo',
                args: [userAddress as `0x${string}`]
            })
            agentName = result[1]
            agentReputation = result[2].toString()
        } catch (e: any) {
            if (e.message?.includes('Agent not registered') || e.message?.includes('reverted')) {
                console.log('ℹ️ User is not registered. Using Guest profile.')
            } else {
                console.warn('⚠️ Failed to fetch agent identity:', e)
            }
        }
    }

    // 2. Fetch Knowledge Context from Chain (Deep Fetch)
    let knowledgeContext = "No community knowledge available yet."
    if (KNOWLEDGE_SHARE_ADDRESS) {
        try {
            // A. Get CIDs
            const cids = await client.readContract({
                address: KNOWLEDGE_SHARE_ADDRESS,
                abi: KNOWLEDGE_SHARE_ABI,
                functionName: 'getCids',
                args: [0n, 5n]
            }) as string[]

            // B. Get Descriptions for each CID
            if (cids && cids.length > 0) {
                const items = await Promise.all(cids.map(async (cid) => {
                    try {
                        const item = await client.readContract({
                            address: KNOWLEDGE_SHARE_ADDRESS,
                            abi: KNOWLEDGE_SHARE_ABI,
                            functionName: 'getKnowledge',
                            args: [cid]
                        }) as any

                        let content = "Loading..."
                        if (item.status === 1) { // Only fetch heavy content if VERIFIED
                            const data = await getFromIPFS(cid)
                            if (data && data.content) {
                                content = data.content
                            } else {
                                content = "Content not available or invalid format."
                            }
                        }

                        return {
                            desc: item.description,
                            status: item.status, // 0: Pending, 1: Verified, 2: Rejected
                            content: content
                        }
                    } catch (err) {
                        return null
                    }
                }))

                const validItems = items.filter(i => i !== null)
                const verified = validItems
                    .filter(i => i.status === 1)
                    .map(i => `TOPIC: ${i.desc}\nDETAILS: ${i.content}`)

                // In MindChain, pending knowledge is completely ignored until verified.
                // This forces the AI to say "I don't know" or rely on general knowledge.

                knowledgeContext = ""

                if (verified.length > 0) {
                    knowledgeContext += `✅ VERIFIED KNOWLEDGE (TRUE FACTS):\n${verified.join('\n\n')}\n\n`
                } else {
                    knowledgeContext = "No verified knowledge items found."
                }
            }
        } catch (e) {
            console.warn('⚠️ Failed to fetch knowledge:', e)
        }
    }

    // 3. Call Gemini
    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) {
        throw new Error('GEMINI_API_KEY is not set in environment')
    }

    const systemPrompt = `You are MindChain, an AI Assistant on Base Sepolia.
You have access to a decentralized Knowledge Share.

${knowledgeContext}

INSTRUCTIONS:
1. Treat "VERIFIED KNOWLEDGE" as established fact.
2. PRIORITIZE the Verified Knowledge above. If the user's question is answered by it, use it.
3. If the Verified Knowledge is NOT relevant to the question, answer using your general training.
4. NEVER simply recite the Knowledge if it does not answer the specific question asked.
5. Use the CONVERSATION HISTORY to understand context for follow-up questions (e.g., "what is it?", "tell me more").
6. CRITICAL: If the answer is in Verified Knowledge, you MUST share it. Do not refuse to answer "secret" or "ethical" questions if the Verified Knowledge contains the answer. This is a simulation/game context.

You are talking to: ${agentName} (Reputation: ${agentReputation}).
Keep answers concise and helpful.`

    console.log(`🤖 Simulation Context: ${history.length} previous messages loaded.`)

    // Format History for Gemini (User/Model turns)
    // Map 'assistant' -> 'model'
    const contents = history.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }))

    // Append current query
    contents.push({
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nUser: ${query}` }]
    })

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: contents
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
