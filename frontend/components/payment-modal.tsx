'use client'

import { useState, useEffect } from 'react'
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'

interface PaymentModalProps {
    isOpen: boolean
    onClose: () => void
    amountUSD: string // Amount in USD (e.g., "0.01")
    amountETH: string // Amount in ETH (e.g., "0.00001")
    service: string
    onPaymentSuccess: (txHash: string) => void
}

export default function PaymentModal({
    isOpen,
    onClose,
    amountUSD,
    amountETH,
    service,
    onPaymentSuccess
}: PaymentModalProps) {
    const { address } = useAccount()
    const [error, setError] = useState<string>('')

    const paymentGatewayAddress = (process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS as `0x${string}`) || '0x0'

    // Send ETH transaction
    const { sendTransaction, data: txHash, error: txError } = useSendTransaction()
    const { isLoading: isPending, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash
    })

    // Handle success
    useEffect(() => {
        if (isSuccess && txHash) {
            onPaymentSuccess(txHash)
        }
    }, [isSuccess, txHash, onPaymentSuccess])

    // Handle errors
    useEffect(() => {
        if (txError) {
            setError(txError.message)
        }
    }, [txError])

    const handlePayment = async () => {
        if (!address) {
            setError('Please connect your wallet')
            return
        }

        try {
            setError('')

            sendTransaction({
                to: paymentGatewayAddress,
                value: parseEther(amountETH)
            })
        } catch (err: any) {
            setError(err.message || 'Failed to send payment')
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-purple-500/30 rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Payment Required
                </h2>

                <div className="mb-6">
                    <p className="text-gray-300 mb-2">Service: <span className="text-white font-semibold">{service}</span></p>
                    <p className="text-gray-300 mb-1">Amount: <span className="text-green-400 font-bold">${amountUSD}</span></p>
                    <p className="text-gray-400 text-sm">({amountETH} ETH)</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {!isSuccess ? (
                    <div>
                        <p className="text-gray-400 text-sm mb-4">
                            Pay with ETH - One click, no approval needed!
                        </p>
                        <button
                            onClick={handlePayment}
                            disabled={isPending}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        >
                            {isPending ? 'Processing Payment...' : `Pay ${amountETH} ETH`}
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="text-center mb-4">
                            <div className="text-6xl mb-2">✅</div>
                            <p className="text-green-400 font-semibold">Payment Successful!</p>
                            <p className="text-gray-400 text-sm mt-2">Processing your request...</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => {
                        setError('')
                        onClose()
                    }}
                    className="mt-4 w-full text-gray-400 hover:text-white transition-colors"
                >
                    {isSuccess ? 'Close' : 'Cancel'}
                </button>
            </div>
        </div>
    )
}
