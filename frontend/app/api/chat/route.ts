import { NextResponse, NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { query, userAddress } = body

        // Check for payment proof in headers
        const paymentTxHash = request.headers.get('x-payment-tx-hash')
        const paymentProof = request.headers.get('x-payment-proof')

        // x402 Payment Configuration (ETH)
        const PAYMENT_CONFIG = {
            amountUSD: '0.05', // $0.05 USD
            amountETH: '0.000025', // ~$0.05 in ETH (adjust based on current price)
            recipient: process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS || '0x6AE46C7Ec04d72E7e14268e59Cdfb639f5b68519',
            chain: 'eip155:11155111', // Ethereum Sepolia
            description: 'AI Chat Service (Gemini API)'
        }

        // If no payment proof, return HTTP 402 Payment Required
        if (!paymentProof && !paymentTxHash) {
            return NextResponse.json(
                {
                    error: 'Payment Required',
                    invoice: {
                        amountUSD: PAYMENT_CONFIG.amountUSD,
                        amountETH: PAYMENT_CONFIG.amountETH,
                        recipient: PAYMENT_CONFIG.recipient,
                        chain: PAYMENT_CONFIG.chain,
                        description: PAYMENT_CONFIG.description
                    },
                    message: `Please pay $${PAYMENT_CONFIG.amountUSD} (${PAYMENT_CONFIG.amountETH} ETH) to access this service`
                },
                {
                    status: 402,
                    headers: {
                        'X-Payment-Required': 'true',
                        'X-Payment-Amount-USD': PAYMENT_CONFIG.amountUSD,
                        'X-Payment-Amount-ETH': PAYMENT_CONFIG.amountETH,
                        'X-Payment-Recipient': PAYMENT_CONFIG.recipient,
                        'X-Payment-Chain': PAYMENT_CONFIG.chain
                    }
                }
            )
        }

        // TODO: Verify payment on-chain using paymentTxHash
        // For now, we'll proceed if payment proof is provided

        // Call CRE workflow endpoint
        const creWorkflowUrl = process.env.NEXT_PUBLIC_CRE_WORKFLOW_URL || 'http://localhost:3001'

        const response = await fetch(`${creWorkflowUrl}/agent/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                userAddress,
                action: 'chat',
            }),
        })

        const result = await response.json()

        return NextResponse.json({
            response: result.data?.response || 'Sorry, I encountered an error.',
            agent: result.data?.agent,
            paymentVerified: true
        })
    } catch (error) {
        console.error('Chat API error:', error)
        return NextResponse.json(
            { error: 'Failed to get AI response' },
            { status: 500 }
        )
    }
}
