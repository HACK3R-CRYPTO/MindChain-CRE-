'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { uploadJSONToIPFS, getIPFSUrl } from '@/lib/ipfs'
import { KNOWLEDGE_SHARE_ABI } from '@/lib/abis'

const KNOWLEDGE_SHARE_ADDRESS = process.env.NEXT_PUBLIC_KNOWLEDGE_SHARE_ADDRESS as `0x${string}`

interface KnowledgeItem {
    ipfsCid: string
    owner: string
    price: bigint
    description: string
    voteCount: bigint
    status: number // 0=Pending, 1=Verified
    timestamp: bigint
}

export function KnowledgeShare() {
    const { address } = useAccount()
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('0')
    const [content, setContent] = useState('') // For now just text content to upload
    const [uploading, setUploading] = useState(false)
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)

    const { writeContractAsync } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

    // Read recent items (naive implementation, reads first 5 CIDs)
    // Real impl should read total count first then paginate
    const { data: cids } = useReadContract({
        address: KNOWLEDGE_SHARE_ADDRESS,
        abi: KNOWLEDGE_SHARE_ABI,
        functionName: 'getCids',
        args: [BigInt(0), BigInt(10)], // Get first 10
    }) as { data: string[] | undefined }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!description || !content || !address) return

        setUploading(true)
        try {
            // 1. Upload Content to IPFS
            const data = {
                content,
                timestamp: Date.now(),
                author: address
            }
            const cid = await uploadJSONToIPFS(data)

            // 2. Submit to Contract
            const tx = await writeContractAsync({
                address: KNOWLEDGE_SHARE_ADDRESS,
                abi: KNOWLEDGE_SHARE_ABI,
                functionName: 'submitKnowledge',
                args: [cid, description, parseEther(price)],
            })
            setTxHash(tx)
        } catch (error) {
            console.error('Error submitting knowledge:', error)
            alert('Failed to submit knowledge')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Submit Form */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 h-fit">
                <h3 className="text-xl font-bold mb-4 text-white">Share Knowledge</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            placeholder="e.g. Alpha on market trends"
                            maxLength={100}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Content (JSON/Text)</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-32"
                            placeholder="Paste your knowledge content here..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Price (ETH)</label>
                        <input
                            type="number"
                            step="0.0001"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!address || !description || uploading || isConfirming}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all disabled:opacity-50"
                    >
                        {uploading ? 'Uploading to IPFS...' : isConfirming ? 'Confirming...' : 'Submit to Chain'}
                    </button>
                    {isSuccess && (
                        <p className="text-green-400 text-sm text-center">✓ Submitted Successfully!</p>
                    )}
                </form>
            </div>

            {/* Knowledge Feed */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Latest Knowledge</h3>
                {!cids || cids.length === 0 ? (
                    <p className="text-gray-400">No knowledge shared yet.</p>
                ) : (
                    cids.map((cid) => (
                        <KnowledgeItemCard key={cid} cid={cid} />
                    ))
                )}
            </div>
        </div>
    )
}

function KnowledgeItemCard({ cid }: { cid: string }) {
    const { data: item } = useReadContract({
        address: KNOWLEDGE_SHARE_ADDRESS,
        abi: KNOWLEDGE_SHARE_ABI,
        functionName: 'getKnowledge',
        args: [cid],
    }) as { data: KnowledgeItem | undefined }

    if (!item) return <div className="animate-pulse bg-gray-800 h-24 rounded-lg"></div>

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-blue-500/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-white">{item.description}</h4>
                <span className={`px-2 py-0.5 text-xs rounded-full ${item.status === 1 ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                    {item.status === 1 ? 'Verified' : 'Pending'}
                </span>
            </div>
            <p className="text-sm text-gray-400 mb-3 truncate">CID: {cid}</p>
            <div className="flex justify-between items-center text-sm">
                <span className="text-blue-400">Owner: {item.owner.slice(0, 6)}...{item.owner.slice(-4)}</span>
                <span className="text-white font-mono">{formatEther(item.price)} ETH</span>
            </div>
            {/* Purchase Logic would go here */}
        </div>
    )
}
