/**
 * Predict MNIST digit using HTTP capability
 */
async function predictMNIST(
    runtime: cre.Runtime,
    mnistData: number[][]
): Promise<{ digit: number; confidence: number }> {
    const httpClient = runtime.capabilities.httpClient();

    const response = await httpClient.post({
        url: 'http://127.0.0.1:5000/predict',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: mnistData }),
    });

    const result = JSON.parse(response.body);
    return {
        digit: result.prediction,
        confidence: result.confidence || 0.95,
    };
}

/**
 * Submit knowledge to KnowledgeShare contract
 */
async function submitKnowledge(
    runtime: cre.Runtime,
    userAddress: string,
    knowledge: string
): Promise<{ success: boolean; message: string }> {
    const evmWrite = runtime.capabilities.evmWrite({
        chain: 'eip155:11155111',
        rpcUrl: process.env.SEPOLIA_RPC!,
    });

    const knowledgeShareABI = [
        {
            inputs: [{ name: 'content', type: 'string' }],
            name: 'submitKnowledge',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
    ];

    try {
        await evmWrite.transact({
            contract: process.env.KNOWLEDGE_SHARE_ADDRESS!,
            abi: knowledgeShareABI,
            function: 'submitKnowledge',
            args: [knowledge],
        });

        console.log(`✅ Knowledge submitted by ${userAddress}`);

        return {
            success: true,
            message: 'Knowledge submitted successfully! It will be visible after community approval.',
        };
    } catch (error) {
        console.error('Knowledge submission error:', error);
        return {
            success: false,
            message: 'Failed to submit knowledge',
        };
    }
}
