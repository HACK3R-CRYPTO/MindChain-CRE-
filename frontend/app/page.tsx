'use client'

import { useState } from 'react'
import { MNISTCanvas } from '@/components/mnist-canvas'
import { KnowledgeShare } from '@/components/knowledge-share'
import { AgentRegistry } from '@/components/agent-registry'
import { AIChat } from '@/components/ai-chat'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import PaymentModal from '@/components/payment-modal'

export default function Home() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'mnist' | 'knowledge' | 'chat' | 'registry'>('mnist')
  const [prediction, setPrediction] = useState<{ digit: number; confidence: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // x402 payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null)
  const [pendingRequest, setPendingRequest] = useState<any>(null)

  const handleMNISTPrediction = async (imageData: number[][], paymentTxHash?: string) => {
    setIsLoading(true)
    setPrediction(null)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // Add payment proof if available
      if (paymentTxHash) {
        headers['x-payment-tx-hash'] = paymentTxHash
        headers['x-payment-proof'] = 'true'
      }

      const response = await fetch('/api/predict', {
        method: 'POST',
        headers,
        body: JSON.stringify({ data: imageData }),
      })

      // Handle HTTP 402 - Payment Required
      if (response.status === 402) {
        const data = await response.json()
        setPaymentInvoice(data.invoice)
        setPendingRequest({ type: 'mnist', data: imageData })
        setShowPaymentModal(true)
        setIsLoading(false)
        return
      }

      const data = await response.json()
      setPrediction(data)
    } catch (error) {
      console.error('Prediction error:', error)
      alert('Failed to get prediction')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = async (txHash: string) => {
    setShowPaymentModal(false)

    // Retry the pending request with payment proof
    if (pendingRequest) {
      if (pendingRequest.type === 'mnist') {
        await handleMNISTPrediction(pendingRequest.data, txHash)
      }
      setPendingRequest(null)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
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
      <section className="py-12 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
          Decentralized AI Knowledge Platform
        </h2>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto px-4">
          AI agents with verifiable identities (ERC-8004), micropayments (x402), and Chainlink workflows,
          all orchestrated by Chainlink CRE with x402 micropayments
        </p>
      </section>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8 justify-center flex-wrap">
          <button
            onClick={() => setActiveTab('mnist')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'mnist'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            🎨 MNIST Drawing
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'knowledge'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            📚 Knowledge Sharing
          </button>
          <button
            onClick={() => setActiveTab('registry')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'registry'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            🤖 Agent Registry
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'chat'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            💬 AI Chat
          </button>
        </div>

        {/* Content */}
        <div className="flex justify-center">
          {activeTab === 'mnist' && (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-8 max-w-2xl w-full">
              <h3 className="text-2xl font-bold mb-2 text-white">Draw a Digit (0-9)</h3>
              <p className="text-gray-400 mb-6">AI will predict what you draw</p>

              <MNISTCanvas />

              {prediction && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg">
                  <p className="text-white text-lg">
                    <span className="font-semibold">Prediction:</span> {prediction.digit}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-semibold">Confidence:</span> {(prediction.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'knowledge' && <KnowledgeShare />}
          {activeTab === 'registry' && <AgentRegistry />}
          {activeTab === 'chat' && <AIChat />}
        </div>
      </div>

      {/* x402 Payment Modal */}
      {paymentInvoice && (
        <PaymentModal
          key={`payment-${Date.now()}`}
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setPendingRequest(null)
            setPaymentInvoice(null)
          }}
          amountUSD={paymentInvoice.amountUSD}
          amountETH={paymentInvoice.amountETH}
          service={paymentInvoice.description || 'AI Service'}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-purple-500/20 bg-gray-900/50">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>Built with Chainlink CRE, ERC-8004, and x402 Protocol</p>
          <p className="text-sm mt-2">Ethereum Sepolia Testnet</p>
        </div>
      </footer>
    </main>
  )
}
