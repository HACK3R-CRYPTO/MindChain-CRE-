import { NextResponse, NextRequest } from 'next/server'
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'
import { runSimulation } from '../../../lib/simulation'

const PAYMENT_GATEWAY_ADDRESS = process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS as `0x${string}`

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { query, userAddress, history } = body
        const txHash = request.headers.get('x-payment-tx-hash') as `0x${string}`

        if (!txHash) {
            return NextResponse.json(
                { error: 'Payment transaction hash required' },
                { status: 402 } // Payment Required
            )
        }

        // ---------------------------------------------------------
        // VERIFY PAYMENT ON-CHAIN
        // ---------------------------------------------------------
        try {
            const publicClient = createPublicClient({
                chain: baseSepolia,
                transport: http()
            })

            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

            if (receipt.status !== 'success') {
                throw new Error('Payment transaction reverted')
            }

            // Verify interaction with Payment Gateway
            if (receipt.to?.toLowerCase() !== PAYMENT_GATEWAY_ADDRESS.toLowerCase()) {
                throw new Error('Transaction was not sent to Payment Gateway')
            }

            // (Optional) Check logs for 'PaymentReceived' event for strictness
            // For hackathon, status + to address is sufficient proof of attempted payment

        } catch (verificationError: any) {
            console.error('Payment Verification Failed:', verificationError)
            return NextResponse.json(
                { error: `Payment Verification Failed: ${verificationError.message}` },
                { status: 402 }
            )
        }

        // ---------------------------------------------------------
        // FALLBACK: Local Simulation (runs logic in Next.js API)
        // ---------------------------------------------------------
        try {
            const simulationResult = await runSimulation(query, userAddress, history)
            return NextResponse.json({
                data: simulationResult,
                response: simulationResult.result,
                agent: simulationResult.agent,
                paymentVerified: true,
                source: 'SIMULATION'
            })
        } catch (simError: any) {
            console.error('❌ Simulation failed:', simError)
            return NextResponse.json(
                { error: `AI Processing failed: ${simError.message}` },
                { status: 500 }
            )
        }

    } catch (error) {
        console.error('Chat API error:', error)
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        )
    }
}
