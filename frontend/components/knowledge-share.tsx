'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

const KNOWLEDGE_SHARE_ABI = [
    {
        inputs: [{ name: 'content', type: 'string' }],
        name: 'submitKnowledge',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const

export function KnowledgeShare() {
    const { address } = useAccount()
    const [knowledge, setKnowledge] = useState('')
    const { writeContract, data: hash, isPending } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!knowledge.trim() || !address) return

        try {
            writeContract({
                address: (process.env.NEXT_PUBLIC_KNOWLEDGE_SHARE_ADDRESS as `0x${string}`) || '0x0',
                abi: KNOWLEDGE_SHARE_ABI,
                functionName: 'submitKnowledge',
                args: [knowledge],
            })
        } catch (error) {
            console.error('Error submitting knowledge:', error)
        }
    }

    return (
        <div className="w-full max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="knowledge" className="block text-sm font-medium text-gray-300 mb-2">
                        Share Your Knowledge
                    </label>
                    <textarea
                        id="knowledge"
                        value={knowledge}
                        onChange={(e) => setKnowledge(e.target.value)}
                        placeholder="Share a helpful tip, insight, or knowledge with the community..."
                        className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        maxLength={500}
                        disabled={!address || isPending || isConfirming}
                    />
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-500">{knowledge.length}/500 characters</span>
                        {isSuccess && (
                            <span className="text-sm text-green-500">✓ Knowledge submitted successfully!</span>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!address || !knowledge.trim() || isPending || isConfirming}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {!address
                        ? 'Connect Wallet to Submit'
                        : isPending
                            ? 'Confirm in Wallet...'
                            : isConfirming
                                ? 'Submitting...'
                                : 'Submit Knowledge'}
                </button>
            </form>

            {!address && (
                <p className="mt-4 text-sm text-gray-400 text-center">
                    Connect your wallet to share knowledge with the community
                </p>
            )}
        </div>
    )
}
