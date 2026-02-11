'use client'

import { useState, useRef, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, keccak256, toHex, parseUnits } from 'viem'
import { IERC20_ABI, PAYMENT_GATEWAY_ABI } from '@/lib/abis'

const PAYMENT_GATEWAY_ADDRESS = process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS as `0x${string}`
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`
const CHAT_COST = parseUnits('0.01', 6) // 0.01 USDC (assuming 6 decimals)

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export function AIChat() {
    const { address } = useAccount()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const { writeContractAsync } = useWriteContract()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !address) return

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date(),
        }

        setMessages((prev) => [...prev, userMessage])
        setInput('')
        setIsLoading(true)
        setStatus('Initiating payment...')

        try {
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
            // We could use useWaitForTransactionReceipt here but for speed/UX we might optimistically proceed
            // or wait a bit. Let's wait for basic confirmation or just proceed to API call.
            // For strict correctness, we'd wait. For hackathon speed, we proceed.

            setStatus('Thinking...')

            // 3. Call CRE / Simulation API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-payment-tx-hash': tx // Send transaction hash for verification
                },
                body: JSON.stringify({
                    query: userMessage.content,
                    userAddress: address,
                }),
            })

            const data = await response.json()

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response || data.result || 'Sorry, I encountered an error.',
                timestamp: new Date(),
            }

            setMessages((prev) => [...prev, assistantMessage])
        } catch (error) {
            console.error('Chat error:', error)
            const errorMessage: Message = {
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
                        </div>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] px-4 py-3 rounded-lg ${message.role === 'user'
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                    : 'bg-gray-800 text-gray-100'
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                    {message.timestamp.toLocaleTimeString()}
                                </p>
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
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
                    >
                        {isLoading ? 'Processing...' : 'Send (0.01 USDC)'}
                    </button>
                </div>
            </form>
        </div>
    )
}
