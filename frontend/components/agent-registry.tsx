'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useReadContracts } from 'wagmi'
import { uploadJSONToIPFS, getFromIPFS } from '@/lib/ipfs'
import { AGENT_REGISTRY_ABI } from '@/lib/abis'

const AGENT_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS as `0x${string}`

interface AgentMetadata {
    name: string;
    bio: string;
    avatar?: string;
    capabilities: string[];
}

interface AgentOnChain {
    tokenId: bigint;
    name: string;
    reputation: bigint;
    totalInteractions: bigint;
    metadata?: AgentMetadata; // Enriched
}

export function AgentRegistry() {
    const { address } = useAccount()
    const [name, setName] = useState('')
    const [bio, setBio] = useState('')
    const [isRegistering, setIsRegistering] = useState(false)
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)

    const { writeContractAsync } = useWriteContract()

    // Watch for registration
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    })

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !bio || !address) return

        setIsRegistering(true)
        try {
            // 1. Upload Metadata to IPFS following ERC-8004 Registration File V1
            const registrationFile = {
                type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
                name,
                description: bio,
                image: "https://agentmind.cre/default-agent.png", // Demo placeholder
                services: [
                    {
                        name: "web",
                        endpoint: window.location.origin
                    },
                    {
                        name: "A2A",
                        endpoint: `${window.location.origin}/api/chat`,
                        version: "0.1.0"
                    }
                ],
                x402Support: true, // We have x402 infrastructure ready
                active: true,
                supportedTrust: ["reputation", "crypto-economic"]
            }

            const cid = await uploadJSONToIPFS(registrationFile)
            const agentURI = `ipfs://${cid}`

            // 2. Register on-chain (ERC-8004 Strict Signature)
            const tx = await writeContractAsync({
                address: AGENT_REGISTRY_ADDRESS,
                abi: AGENT_REGISTRY_ABI,
                functionName: 'register',
                args: [name, agentURI],
            })
            setTxHash(tx)
        } catch (error) {
            alert('Failed to register agent')
        } finally {
            setIsRegistering(false)
        }
    }

    // Fetch actual registration status for the user
    const { data: userIsRegistered, refetch: refetchStatus } = useReadContract({
        address: AGENT_REGISTRY_ADDRESS,
        abi: AGENT_REGISTRY_ABI,
        functionName: 'isRegistered',
        args: [address as `0x${string}`],
        chainId: 84532,
        query: {
            enabled: !!address,
        }
    })

    // Fetch total agent count
    const { data: totalAgents, refetch: refetchCount, error: countError, isLoading: isCountLoading } = useReadContract({
        address: AGENT_REGISTRY_ADDRESS,
        abi: AGENT_REGISTRY_ABI,
        functionName: 'getAgentCount',
        chainId: 84532,
        query: {
            refetchInterval: 5000,
        }
    })

    useEffect(() => {
        if (isSuccess) {
            refetchStatus()
            refetchCount()
        }
    }, [isSuccess, refetchStatus, refetchCount])

    return (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Registration Form */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 text-white">Register as AI Agent</h3>

                {userIsRegistered ? (
                    <div className="space-y-4 py-8 text-center">
                        <div className="w-16 h-16 bg-green-900/30 border border-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl text-green-400">✓</span>
                        </div>
                        <h4 className="text-lg font-medium text-white">You are Registered!</h4>
                        <p className="text-gray-400 text-sm px-4">
                            Your wallet is officially linked to an EIP-8004 Agent Identity on Base Sepolia.
                        </p>
                        <div className="pt-4">
                            <button
                                onClick={() => window.location.href = '/chat'}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all text-sm font-medium"
                            >
                                Go to AI Chat
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Agent Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                                placeholder="e.g. MindChain Oracle"
                                disabled={isRegistering || isConfirming}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Bio / Capabilities</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-24"
                                placeholder="Describe what this agent can do..."
                                disabled={isRegistering || isConfirming}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!address || !name || isRegistering || isConfirming}
                            className="w-full px-6 py-3 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all disabled:opacity-50"
                        >
                            {isRegistering ? 'Uploading to IPFS...' : isConfirming ? 'Confirming On-Chain...' : 'Register Identity (EIP-8004)'}
                        </button>
                        {isSuccess && (
                            <p className="text-green-400 text-sm text-center">✓ Agent Registered Successfully!</p>
                        )}
                    </form>
                )}
            </div>

            {/* List (Placeholder for now) */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 text-white">Network Stats</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Agents Registered</p>
                        <p className="text-2xl font-bold text-white">
                            {totalAgents !== undefined ? totalAgents.toString() : isCountLoading ? '...' : (countError ? '—' : '0')}
                        </p>
                        {countError && <p className="text-[8px] text-red-400 mt-1 truncate" title={countError.message}>RPC Error</p>}
                    </div>
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Network</p>
                        <p className="text-sm font-bold text-blue-400">Base Sepolia</p>
                        <p className="text-[8px] text-gray-600 mt-1 truncate" title={AGENT_REGISTRY_ADDRESS}>{AGENT_REGISTRY_ADDRESS?.slice(0, 10)}...</p>
                    </div>
                </div>

                <h4 className="text-sm font-semibold text-gray-300 mb-3">Recent Registry Events</h4>
                <div className="space-y-3">
                    {userIsRegistered ? (
                        <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-500/30 flex justify-between items-center animate-pulse">
                            <div>
                                <p className="text-sm font-medium text-white">{name || 'Your Agent'}</p>
                                <p className="text-[10px] text-purple-400">Just Registered • EIP-8004</p>
                            </div>
                            <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs">AI</div>
                        </div>
                    ) : null}

                    {[1, 2].map((i) => (
                        <div key={i} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 flex justify-between items-center opacity-40">
                            <div>
                                <div className="h-4 w-24 bg-gray-700 rounded mb-2"></div>
                                <div className="h-2 w-32 bg-gray-700/50 rounded"></div>
                            </div>
                            <div className="h-8 w-8 bg-gray-700 rounded-full"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
