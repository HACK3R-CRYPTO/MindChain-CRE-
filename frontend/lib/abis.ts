export const IERC20_ABI = [
    {
        "constant": false,
        "inputs": [
            { "name": "_spender", "type": "address" },
            { "name": "_value", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{ "name": "_owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "balance", "type": "uint256" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export const PAYMENT_GATEWAY_ABI = [
    {
        "inputs": [
            { "internalType": "bytes32", "name": "txHash", "type": "bytes32" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "internalType": "bytes32", "name": "queryHash", "type": "bytes32" }
        ],
        "name": "recordPayment",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export const AGENT_REGISTRY_ABI = [
    {
        "inputs": [
            { "internalType": "string", "name": "name", "type": "string" },
            { "internalType": "string", "name": "agentURI", "type": "string" }
        ],
        "name": "register",
        "outputs": [{ "internalType": "uint256", "name": "agentId", "type": "uint256" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "agentId", "type": "uint256" }],
        "name": "getAgentWallet",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "agent", "type": "address" }],
        "name": "isRegistered",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "agent", "type": "address" }],
        "name": "getAgentInfo",
        "outputs": [
            { "name": "tokenId", "type": "uint256" },
            { "name": "name", "type": "string" },
            { "name": "reputation", "type": "int256" },
            { "name": "totalInteractions", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getAgentCount",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export const REPUTATION_REGISTRY_ABI = [
    {
        "inputs": [
            { "internalType": "uint256", "name": "agentId", "type": "uint256" },
            { "internalType": "int128", "name": "value", "type": "int128" },
            { "internalType": "uint8", "name": "valueDecimals", "type": "uint8" },
            { "internalType": "string", "name": "tag1", "type": "string" },
            { "internalType": "string", "name": "tag2", "type": "string" },
            { "internalType": "string", "name": "endpoint", "type": "string" },
            { "internalType": "string", "name": "feedbackURI", "type": "string" },
            { "internalType": "bytes32", "name": "feedbackHash", "type": "bytes32" }
        ],
        "name": "giveFeedback",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "agentId", "type": "uint256" },
            { "internalType": "address[]", "name": "clientAddresses", "type": "address[]" },
            { "internalType": "string", "name": "tag1", "type": "string" },
            { "internalType": "string", "name": "tag2", "type": "string" }
        ],
        "name": "getSummary",
        "outputs": [
            { "internalType": "uint64", "name": "count", "type": "uint64" },
            { "internalType": "int128", "name": "summaryValue", "type": "int128" },
            { "internalType": "uint8", "name": "summaryValueDecimals", "type": "uint8" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export const KNOWLEDGE_SHARE_ABI = [
    {
        "inputs": [
            { "internalType": "string", "name": "_ipfsCid", "type": "string" },
            { "internalType": "string", "name": "_description", "type": "string" },
            { "internalType": "uint256", "name": "_price", "type": "uint256" }
        ],
        "name": "submitKnowledge",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "start", "type": "uint256" }, { "internalType": "uint256", "name": "limit", "type": "uint256" }],
        "name": "getCids",
        "outputs": [{ "internalType": "string[]", "name": "", "type": "string[]" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "string", "name": "_cid", "type": "string" }],
        "name": "getKnowledge",
        "outputs": [
            {
                "components": [
                    { "internalType": "string", "name": "ipfsCid", "type": "string" },
                    { "internalType": "address", "name": "owner", "type": "address" },
                    { "internalType": "uint256", "name": "price", "type": "uint256" },
                    { "internalType": "string", "name": "description", "type": "string" },
                    { "internalType": "uint256", "name": "voteCount", "type": "uint256" },
                    { "internalType": "uint8", "name": "status", "type": "uint8" },
                    { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
                    { "internalType": "bool", "name": "exists", "type": "bool" }
                ],
                "internalType": "struct KnowledgeShare.KnowledgeItem",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "string", "name": "_cid", "type": "string" }],
        "name": "vote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "string", "name": "_cid", "type": "string" }],
        "name": "purchaseAccess",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
] as const;
