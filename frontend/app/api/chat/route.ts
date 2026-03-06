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
        // VERIFY PAYMENT ON-CHAIN (X402 STRICT VERIFICATION)
        // ---------------------------------------------------------
        console.log(`[SEC] Payment verification started for ${txHash} (User: ${userAddress})`)
        const publicClient = createPublicClient({
            chain: baseSepolia,
            transport: http()
        })

        try {
            const receipt = await publicClient.getTransactionReceipt({ hash: txHash })

            console.log(`[SEC] Receipt Found: Status=${receipt.status}, From=${receipt.from}, To=${receipt.to}`)

            if (receipt.status !== 'success') {
                throw new Error('Payment transaction failed on-chain')
            }

            // 1. Verify Destination
            if (receipt.to?.toLowerCase() !== PAYMENT_GATEWAY_ADDRESS.toLowerCase()) {
                console.error(`[SEC] Address Mismatch: Expected ${PAYMENT_GATEWAY_ADDRESS}, Got ${receipt.to}`)
                throw new Error('Transaction destination mismatch')
            }

            // 2. Verify Sender (Must match the wallet requesting the AI)
            if (receipt.from.toLowerCase() !== userAddress.toLowerCase()) {
                console.error(`[SEC] Sender Mismatch: Expected ${userAddress}, Got ${receipt.from}`)
                throw new Error('Transaction sender mismatch')
            }

            // 3. Verify Freshness (Strict 10 min window)
            const block = await publicClient.getBlock({ blockHash: receipt.blockHash })
            const now = BigInt(Math.floor(Date.now() / 1000))
            const ageSeconds = now - block.timestamp

            console.log(`[SEC] Transaction Age: ${ageSeconds}s`)

            if (ageSeconds > 600n) {
                throw new Error('Payment transaction has expired (older than 10 mins)')
            }

            console.log(`✅ [SEC] PAYMENT VERIFIED SUCCESSFULLY for ${userAddress}`)

        } catch (verificationError: any) {
            console.error('❌ [SEC] SECURITY BLOCK:', verificationError.message)
            return NextResponse.json(
                {
                    error: `Security Block: ${verificationError.message}`,
                    reason: 'Your payment could not be verified on Base Sepolia. Please ensure your transaction settled successfully.'
                },
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
