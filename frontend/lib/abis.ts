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
            { "internalType": "string", "name": "metadata", "type": "string" }
        ],
        "name": "registerAgent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "agent", "type": "address" }],
        "name": "getAgentInfo",
        "outputs": [
            { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
            { "internalType": "string", "name": "name", "type": "string" },
            { "internalType": "int256", "name": "reputation", "type": "int256" },
            { "internalType": "uint256", "name": "totalInteractions", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "agent", "type": "address" }],
        "name": "isRegistered",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
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
        "name": "purchaseAccess",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
] as const;
