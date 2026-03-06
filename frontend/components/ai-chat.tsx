'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAccount, useWriteContract, usePublicClient, useReadContract } from 'wagmi'
import { parseUnits, keccak256, toHex } from 'viem'
import { IERC20_ABI, PAYMENT_GATEWAY_ABI, REPUTATION_REGISTRY_ABI } from '@/lib/abis'

const PAYMENT_GATEWAY_ADDRESS = process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS as `0x${string}`
const REPUTATION_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS as `0x${string}`
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`
const CHAT_COST = parseUnits('0.01', 6) // 0.01 USDC (assuming 6 decimals)

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    source?: 'CRE' | 'SIMULATION'
    agentReputation?: string
}

export function AIChat() {
    const { address } = useAccount()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState('')
    const [agentReputation, setAgentReputation] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const { writeContractAsync } = useWriteContract()
    const publicClient = usePublicClient()

    // Fetch USDC Balance
    const { data: usdcBalance } = useReadContract({
        address: USDC_ADDRESS,
        abi: IERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
            refetchInterval: 5000 // Fast refetch for demo
        }
    })

    // Fetch Reputation on load
    useEffect(() => {
        const fetchReputation = async () => {
            if (!publicClient) return
            try {
                // For demo, we use agentId 1. In production, this would be dynamic.
                const data = await publicClient.readContract({
                    address: REPUTATION_REGISTRY_ADDRESS,
                    abi: REPUTATION_REGISTRY_ABI,
                    functionName: 'getSummary',
                    args: [1n, [], "", ""], // empty client list = all, empty tags = all
                })
                const [count, value, decimals] = data as [bigint, bigint, number]
                if (count > 0n) {
                    setAgentReputation(`${value}/${10 ** decimals}`)
                } else {
                    setAgentReputation("New Agent")
                }
            } catch (e) {
                console.error("Failed to fetch reputation:", e)
            }
        }
        fetchReputation()
    }, [publicClient])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !address) return

        setIsLoading(true)
        setStatus('Sanity check: verifying USDC...')

        try {
            // SANITY CHECK: Check USDC Balance BEFORE any popups
            const balance = usdcBalance ? BigInt(usdcBalance.toString()) : 0n
            if (balance < CHAT_COST) {
                throw new Error(`Insufficient USDC. You have ${(Number(balance) / 1e6).toFixed(2)} USDC but need 0.01 USDC.`)
            }

            const userMessage: Message = {
                role: 'user',
                content: input,
                timestamp: new Date(),
            }

            setMessages((prev) => [...prev, userMessage])
            setInput('')

            // 1. Approve USDC
            setStatus('Approve USDC spending...')
            await writeContractAsync({
                address: USDC_ADDRESS,
                abi: IERC20_ABI,
                functionName: 'approve',
                args: [PAYMENT_GATEWAY_ADDRESS, CHAT_COST],
            })

            // 2. Pay for Chat
            setStatus('Confirming chat payment...')
            const queryHash = keccak256(toHex(Date.now().toString()))
            const txHashId = keccak256(toHex(Math.random().toString()))

            const tx = await writeContractAsync({
                address: PAYMENT_GATEWAY_ADDRESS,
                abi: PAYMENT_GATEWAY_ABI,
                functionName: 'recordPayment',
                args: [txHashId, CHAT_COST, queryHash],
            })

            setStatus('Waiting for payment confirmation...')
            // STRICT VERIFICATION: Wait for transaction to be mined
            if (!publicClient) throw new Error('Public client not available')

            const receipt = await publicClient.waitForTransactionReceipt({ hash: tx })

            if (receipt.status !== 'success') {
                throw new Error('Payment transaction failed on-chain')
            }

            setStatus('Payment confirmed! Thinking...')

            // 3. Call CRE / Simulation API
            setStatus('Payment confirmed! Getting AI response...')
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-payment-tx-hash': tx // Send transaction hash for verification
                },
                body: JSON.stringify({
                    query: userMessage.content,
                    userAddress: address,
                    history: messages
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                // Handle specific security or payment errors from backend
                throw new Error(data.error || 'Request failed')
            }

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response || data.result || 'AI response failed to load.',
                timestamp: new Date(),
                source: data.source,
                agentReputation: data.agent?.reputation || agentReputation
            }

            setMessages((prev) => [...prev, assistantMessage])
        } catch (error) {
            console.error('Chat error:', error)
            const errorMessage: Message = {
                role: 'assistant',
                content: `Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date(),
            }
            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
            setStatus('')
        }
    }

    return (
        <div className="w-full max-w-3xl h-[600px] flex flex-col bg-gray-900 rounded-lg border border-gray-800">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <p className="text-lg mb-2">🤖 MindChain AI Assistant</p>
                            <p className="text-sm">Pay 0.01 USDC to chat with on-chain context.</p>
                            {agentReputation && (
                                <p className="text-xs text-purple-400 mt-2">Agent Reputation: {agentReputation}</p>
                            )}
                        </div>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                        >
                            <div
                                className={`max-w-[80%] px-4 py-3 rounded-lg ${message.role === 'user'
                                    ? 'bg-linear-to-r from-purple-600 to-pink-600 text-white'
                                    : 'bg-gray-800 text-gray-100'
                                    }`}
                            >
                                <div className="text-sm prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown>{message.content}</ReactMarkdown>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-1 px-1">
                                <span className="text-xs text-gray-500">
                                    {message.timestamp.toLocaleTimeString()}
                                </span>
                                {message.source && (
                                    <div className="flex items-center gap-1">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${message.source === 'CRE'
                                            ? 'border-green-500 text-green-400 bg-green-900/20'
                                            : 'border-yellow-500 text-yellow-400 bg-yellow-900/20'
                                            }`}>
                                            {message.source === 'CRE' ? '🔒 CRE Verified' : '⚡ Simulation'}
                                        </span>
                                        {message.agentReputation && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded border border-purple-500/50 text-purple-400 bg-purple-900/20">
                                                ★ Rep: {message.agentReputation}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 px-4 py-3 rounded-lg">
                            <div className="flex flex-col gap-2">
                                <div className="flex space-x-2">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                                </div>
                                <span className="text-xs text-gray-400">{status}</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={address ? 'Pay 0.01 USDC & Ask...' : 'Connect wallet to chat'}
                        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={!address || isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!address || !input.trim() || isLoading}
                        className="px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
                    >
                        {isLoading ? 'Processing...' : 'Send (0.01 USDC)'}
                    </button>
                </div>
            </form>
        </div>
    )
}
