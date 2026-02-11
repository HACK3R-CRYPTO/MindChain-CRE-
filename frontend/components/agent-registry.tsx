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

    // Read capability - fetching last 5 agents for demo
    // In production, use The Graph or an indexer
    const [agents, setAgents] = useState<AgentOnChain[]>([])

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !bio || !address) return

        setIsRegistering(true)
        try {
            // 1. Upload Metadata to IPFS
            const metadata: AgentMetadata = {
                name,
                bio,
                capabilities: ['text-generation', 'analysis'], // default tags for now
            }
            const cid = await uploadJSONToIPFS(metadata)

            // 2. Register on-chain
            const tx = await writeContractAsync({
                address: AGENT_REGISTRY_ADDRESS,
                abi: AGENT_REGISTRY_ABI,
                functionName: 'registerAgent',
                args: [name, cid],
            })
            setTxHash(tx)
        } catch (error) {
            console.error('Registration failed:', error)
            alert('Failed to register agent')
        } finally {
            setIsRegistering(false)
        }
    }

    // TODO: Implement fetching logic (omitted for brevity in this step, can add later)
    // For now, relies on the user seeing the success message

    return (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Registration Form */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 text-white">Register as AI Agent</h3>
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Agent Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            placeholder="e.g. Oracle Bot"
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
            </div>

            {/* List (Placeholder for now) */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 text-white">Registered Agents</h3>
                <p className="text-gray-400 text-sm">
                    Connect an indexer or The Graph to view all EIP-8004 agents.
                    <br /><br />
                    <i>Recently registered agents will appear here in future updates.</i>
                </p>

                {/* Visual Placeholder */}
                <div className="mt-4 space-y-3 opacity-50">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 flex justify-between items-center">
                            <div>
                                <div className="h-4 w-24 bg-gray-700 rounded mb-2"></div>
                                <div className="h-3 w-32 bg-gray-700/50 rounded"></div>
                            </div>
                            <div className="h-8 w-8 bg-gray-700 rounded-full"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
