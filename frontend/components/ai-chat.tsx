'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'

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

        try {
            // TODO: Call CRE workflow endpoint
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: input,
                    userAddress: address,
                    action: 'chat',
                }),
            })

            const data = await response.json()

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response || 'Sorry, I encountered an error.',
                timestamp: new Date(),
            }

            setMessages((prev) => [...prev, assistantMessage])
        } catch (error) {
            console.error('Chat error:', error)
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            }
            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
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
                            <p className="text-sm">Ask me anything!</p>
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
                                <p className="text-sm">{message.content}</p>
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
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={address ? 'Ask me anything...' : 'Connect wallet to chat'}
                        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={!address || isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!address || !input.trim() || isLoading}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    )
}
