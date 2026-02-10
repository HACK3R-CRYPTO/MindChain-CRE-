'use client'

import { useRef, useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther, keccak256, toHex } from 'viem'
import { IERC20_ABI, PAYMENT_GATEWAY_ABI } from '@/lib/abis'

interface Prediction {
    digit: number
    confidence: number
    paymentVerified?: boolean
    paymentSettled?: boolean
    transactionHash?: string
}

const PAYMENT_GATEWAY_ADDRESS = process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS as `0x${string}`
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`
const PREDICTION_COST = BigInt(10000) // 0.01 USDC (6 decimals)

export function MNISTCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [prediction, setPrediction] = useState<Prediction | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [paymentStatus, setPaymentStatus] = useState<string>('')
    const [currentTxHash, setCurrentTxHash] = useState<`0x${string}` | undefined>(undefined)

    const { address } = useAccount()

    const { writeContractAsync } = useWriteContract()

    // Watch for transaction receipt
    const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
        hash: currentTxHash,
    })

    // Transaction confirmation effect
    useEffect(() => {
        if (isTxSuccess && currentTxHash) {
            setPaymentStatus('Payment confirmed! Getting prediction...')
            submitPrediction(currentTxHash)
            setCurrentTxHash(undefined) // Reset so we don't trigger again
        }
    }, [isTxSuccess, currentTxHash])


    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }, [])

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true)
        draw(e)
    }

    const stopDrawing = () => {
        setIsDrawing(false)
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing && e.type !== 'mousedown') return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, Math.PI * 2)
        ctx.fill()
    }

    const clearCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        setPrediction(null)
        setError(null)
        setPaymentStatus('')
        setCurrentTxHash(undefined)
    }

    const handlePredict = async () => {
        if (!address) {
            setError('Please connect your wallet first')
            return
        }

        setIsLoading(true)
        setError(null)
        setPaymentStatus('Processing payment...')

        try {
            // 1. Approve USDC
            setPaymentStatus('Please approve USDC spending...')
            const approveTx = await writeContractAsync({
                address: USDC_ADDRESS,
                abi: IERC20_ABI,
                functionName: 'approve',
                args: [PAYMENT_GATEWAY_ADDRESS, PREDICTION_COST],
            })
            console.log('Approve TX:', approveTx)
            setPaymentStatus('Approval submitted. Waiting for confirmation...')
            // In a real app we'd wait for approval receipt too, 
            // but for speed we'll assume it goes through quickly or user has approved before.
            // A better UX is to check allowance first.

            // 2. Record Payment
            setPaymentStatus('Please confirm payment transaction...')
            const queryHash = keccak256(toHex(Date.now().toString())) // Unique hash for this request
            const txHash = keccak256(toHex(Math.random().toString())) // Unique payment ID slot

            const recordTx = await writeContractAsync({
                address: PAYMENT_GATEWAY_ADDRESS,
                abi: PAYMENT_GATEWAY_ABI,
                functionName: 'recordPayment',
                args: [txHash, PREDICTION_COST, queryHash],
            })

            console.log('Payment TX:', recordTx)
            setPaymentStatus('Payment submitted. Waiting for confirmation...')
            setCurrentTxHash(recordTx)
            // The useEffect will pick up isTxSuccess and call submitPrediction

        } catch (err) {
            console.error('Payment Error:', err)
            setError(err instanceof Error ? err.message : 'Payment failed')
            setPaymentStatus('')
            setIsLoading(false)
        }
    }

    const submitPrediction = async (txHash: string) => {
        const canvas = canvasRef.current
        if (!canvas) return

        try {
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Canvas context not available')

            // Get image data and downsample to 28x28
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const downsampled: number[][] = []

            for (let i = 0; i < 28; i++) {
                downsampled[i] = []
                for (let j = 0; j < 28; j++) {
                    const x = Math.floor((j / 28) * canvas.width)
                    const y = Math.floor((i / 28) * canvas.height)
                    const idx = (y * canvas.width + x) * 4
                    downsampled[i][j] = imageData.data[idx] / 255
                }
            }

            setPaymentStatus('Requesting prediction...')

            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: downsampled,
                    paymentTxHash: txHash
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || errorData.reason || `HTTP ${response.status}`)
            }

            const result = await response.json()
            console.log('[MNIST] Prediction result:', result)

            setPrediction({
                digit: result.prediction,
                confidence: result.confidence,
                paymentVerified: result.paymentVerified,
                paymentSettled: result.paymentSettled,
                transactionHash: result.transactionHash
            })

            setPaymentStatus('Prediction received!')
        } catch (err) {
            console.error('[MNIST] Error:', err)
            setError(err instanceof Error ? err.message : 'Prediction failed')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-2xl">
            <div className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                    <canvas
                        ref={canvasRef}
                        width={280}
                        height={280}
                        className="border-2 border-purple-500 rounded-lg cursor-crosshair bg-black"
                        onMouseDown={startDrawing}
                        onMouseUp={stopDrawing}
                        onMouseMove={draw}
                        onMouseLeave={stopDrawing}
                    />

                    <div className="flex gap-2">
                        <button
                            onClick={clearCanvas}
                            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            onClick={handlePredict}
                            disabled={!address || isLoading || isTxConfirming}
                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {isLoading || isTxConfirming ? 'Processing...' : 'Predict (0.01 USDC)'}
                        </button>
                    </div>
                </div>

                {paymentStatus && (
                    <div className="p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
                        <p className="text-sm text-blue-300">{paymentStatus}</p>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
                        <p className="text-sm text-red-300">{error}</p>
                    </div>
                )}

                {prediction && (
                    <div className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500 rounded-lg">
                        <h3 className="text-xl font-bold text-white mb-2">Prediction Result</h3>
                        <div className="space-y-2">
                            <p className="text-3xl font-bold text-purple-300">
                                Digit: {prediction.digit}
                            </p>
                            <p className="text-lg text-gray-300">
                                Confidence: {(prediction.confidence * 100).toFixed(2)}%
                            </p>
                            {prediction.transactionHash && (
                                <div className="mt-4 pt-4 border-t border-purple-500/30">
                                    <p className="text-sm text-green-400">✓ On-Chain Payment Confirmed</p>
                                    <p className="text-xs text-gray-400 mt-2 break-all">
                                        TX: {prediction.transactionHash}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!address && (
                    <p className="text-sm text-gray-400 text-center">
                        Connect your wallet to make predictions
                    </p>
                )}
            </div>
        </div>
    )
}
