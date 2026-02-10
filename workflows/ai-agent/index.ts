import * as cre from '@chainlink/cre-sdk';
import 'dotenv/config';

/**
 * AgentMind CRE Workflow
 * 
 * This workflow orchestrates AI agent operations with:
 * 1. x402 payment verification
 * 2. ERC-8004 agent identity retrieval
 * 3. AI service integration (Gemini)
 * 4. On-chain reputation updates
 */

interface QueryRequest {
    query?: string;
    userAddress: string;
    paymentProof?: string;
    mnistData?: number[][];  // 28x28 array for MNIST
    knowledgeSubmission?: string;
    action: 'chat' | 'mnist' | 'knowledge';
}

interface AgentInfo {
    tokenId: bigint;
    name: string;
    reputation: bigint;
    totalInteractions: bigint;
}

/**
 * Main workflow handler
 */
export const handler = cre.Handler({
    trigger: cre.triggers.http({
        path: '/agent/query',
        method: 'POST',
    }),

    callback: async (runtime: cre.Runtime, request: QueryRequest) => {
        console.log('🤖 AgentMind CRE Workflow started');
        console.log('Query:', request.query);
        console.log('User:', request.userAddress);

        try {
            // Step 1: Verify x402 payment
            const paymentVerified = await verifyPayment(runtime, request);
            if (!paymentVerified) {
                return {
                    status: 402,
                    error: 'Payment required',
                    invoice: {
                        amount: '0.01',
                        token: process.env.USDC_SEPOLIA,
                        recipient: process.env.PAYMENT_GATEWAY_ADDRESS,
                        chain: 'eip155:11155111', // Ethereum Sepolia
                    },
                };
            }

            // Step 2: Get agent identity from ERC-8004 registry
            const agentInfo = await getAgentIdentity(runtime, request.userAddress);
            console.log('Agent Info:', agentInfo);

            // Step 3: Handle different actions
            let responseData: any;

            if (request.action === 'mnist' && request.mnistData) {
                // MNIST digit prediction
                responseData = await predictMNIST(runtime, request.mnistData);
            } else if (request.action === 'knowledge' && request.knowledgeSubmission) {
                // Knowledge submission
                responseData = await submitKnowledge(runtime, request.userAddress, request.knowledgeSubmission);
            } else if (request.action === 'chat' && request.query) {
                // AI chat
                responseData = await callAIService(runtime, request.query, agentInfo);
            } else {
                throw new Error('Invalid action or missing data');
            }

            console.log('Response Data:', responseData);

            // Step 4: Update agent reputation on-chain
            await updateAgentReputation(runtime, request.userAddress, 1); // +1 for successful interaction

            // Step 5: Return response
            return {
                status: 200,
                data: {
                    response: responseData,
                    action: request.action,
                    agent: {
                        name: agentInfo.name,
                        reputation: agentInfo.reputation.toString(),
                        totalInteractions: (agentInfo.totalInteractions + 1n).toString(),
                    },
                    timestamp: new Date().toISOString(),
                },
            };
        } catch (error) {
            console.error('Workflow error:', error);
            return {
                status: 500,
                error: 'Internal workflow error',
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },
});

/**
 * Verify x402 payment on Ethereum Sepolia
 */
async function verifyPayment(
    runtime: cre.Runtime,
    request: QueryRequest
): Promise<boolean> {
    if (!request.paymentProof) {
        return false;
    }

    // Use EVM Read capability to check payment status
    const evmRead = runtime.capabilities.evmRead({
        chain: 'eip155:11155111', // Ethereum Sepolia
        rpcUrl: process.env.SEPOLIA_RPC!,
    });

    const paymentGatewayABI = [
        {
            inputs: [{ name: 'txHash', type: 'bytes32' }],
            name: 'verifyPayment',
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'view',
            type: 'function',
        },
    ];

    const result = await evmRead.call({
        contract: process.env.PAYMENT_GATEWAY_ADDRESS!,
        abi: paymentGatewayABI,
        function: 'verifyPayment',
        args: [request.paymentProof],
    });

    return result as boolean;
}

/**
 * Get agent identity from ERC-8004 registry
 */
async function getAgentIdentity(
    runtime: cre.Runtime,
    userAddress: string
): Promise<AgentInfo> {
    const evmRead = runtime.capabilities.evmRead({
        chain: 'eip155:11155111',
        rpcUrl: process.env.SEPOLIA_RPC!,
    });

    const agentRegistryABI = [
        {
            inputs: [{ name: 'agent', type: 'address' }],
            name: 'getAgentInfo',
            outputs: [
                { name: 'tokenId', type: 'uint256' },
                { name: 'name', type: 'string' },
                { name: 'reputation', type: 'int256' },
                { name: 'totalInteractions', type: 'uint256' },
            ],
            stateMutability: 'view',
            type: 'function',
        },
    ];

    const result = await evmRead.call({
        contract: process.env.AGENT_REGISTRY_ADDRESS!,
        abi: agentRegistryABI,
        function: 'getAgentInfo',
        args: [userAddress],
    });

    const [tokenId, name, reputation, totalInteractions] = result as [
        bigint,
        string,
        bigint,
        bigint
    ];

    return {
        tokenId,
        name,
        reputation,
        totalInteractions,
    };
}

/**
 * Call AI service (Gemini) with agent context
 */
async function callAIService(
    runtime: cre.Runtime,
    query: string,
    agentInfo: AgentInfo
): Promise<string> {
    const httpClient = runtime.capabilities.httpClient();

    const systemPrompt = `You are AgentMind, an AI assistant powered by Chainlink CRE.
You are responding to ${agentInfo.name} (Reputation: ${agentInfo.reputation}).
Provide helpful, accurate, and concise answers.`;

    const response = await httpClient.post({
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GEMINI_API_KEY!,
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: systemPrompt },
                        { text: `User query: ${query}` },
                    ],
                },
            ],
        }),
    });

    const data = JSON.parse(response.body);
    return data.candidates[0].content.parts[0].text;
}

/**
 * Update agent reputation on-chain
 */
async function updateAgentReputation(
    runtime: cre.Runtime,
    userAddress: string,
    delta: number
): Promise<void> {
    const evmWrite = runtime.capabilities.evmWrite({
        chain: 'eip155:11155111',
        rpcUrl: process.env.SEPOLIA_RPC!,
    });

    const agentRegistryABI = [
        {
            inputs: [
                { name: 'agent', type: 'address' },
                { name: 'delta', type: 'int256' },
            ],
            name: 'updateReputation',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
    ];

    await evmWrite.transact({
        contract: process.env.AGENT_REGISTRY_ADDRESS!,
        abi: agentRegistryABI,
        function: 'updateReputation',
        args: [userAddress, delta],
    });

    console.log(`✅ Updated reputation for ${userAddress} by ${delta}`);
}
