'use client'

import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { MNISTCanvas } from '@/components/mnist-canvas'
import { KnowledgeShare } from '@/components/knowledge-share'
import { AIChat } from '@/components/ai-chat'

type Tab = 'mnist' | 'knowledge' | 'chat'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('mnist')
  const [prediction, setPrediction] = useState<{ digit: number; confidence: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handlePredict = async (imageData: number[][]) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: imageData, action: 'mnist' }),
      })
      const result = await response.json()
      setPrediction(result)
    } catch (error) {
      console.error('Prediction error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🧠</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                MindChain CRE
              </h1>
              <p className="text-xs text-gray-400">Powered by Chainlink Runtime Environment</p>
            </div>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-b from-purple-900/20 to-transparent">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Decentralized AI Knowledge Platform
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            MNIST digit recognition, community knowledge sharing, and AI chat - all orchestrated by Chainlink CRE with x402 micropayments
          </p>
        </div>
      </section>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8 justify-center">
          <button
            onClick={() => setActiveTab('mnist')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'mnist'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
          >
            🎨 MNIST Drawing
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'knowledge'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
          >
            📚 Knowledge Sharing
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'chat'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
          >
            💬 AI Chat
          </button>
        </div>

        {/* Content */}
        <div className="flex justify-center">
          {activeTab === 'mnist' && (
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Draw a Digit (0-9)</h3>
              <p className="text-gray-400 mb-6">AI will predict what you drew</p>
              <MNISTCanvas onPredict={handlePredict} isLoading={isLoading} />
              {prediction && (
                <div className="mt-6 p-6 bg-gray-800 rounded-lg border border-purple-500">
                  <p className="text-gray-400 mb-2">Prediction:</p>
                  <p className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {prediction.digit}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Confidence: {(prediction.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="text-center w-full max-w-2xl">
              <h3 className="text-2xl font-bold mb-2">Share Knowledge</h3>
              <p className="text-gray-400 mb-6">Submit tips and insights to the community</p>
              <KnowledgeShare />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="text-center w-full">
              <h3 className="text-2xl font-bold mb-2">AI Assistant</h3>
              <p className="text-gray-400 mb-6">Chat with our AI powered by Chainlink CRE</p>
              <div className="flex justify-center">
                <AIChat />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20 py-8 bg-gray-900/50">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p className="mb-2">Built for Chainlink Convergence Hackathon 2026</p>
          <div className="flex justify-center gap-4 text-sm">
            <span>🔗 Chainlink CRE</span>
            <span>•</span>
            <span>💰 x402 Payments</span>
            <span>•</span>
            <span>🆔 ERC-8004</span>
            <span>•</span>
            <span>🌐 Ethereum Sepolia</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
