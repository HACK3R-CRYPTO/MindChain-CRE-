import { NextResponse } from 'next/server'

const MNIST_API_URL = process.env.MNIST_API_URL || 'http://127.0.0.1:3002/predict'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { image, paymentTxHash } = body

        if (!image) {
            return NextResponse.json(
                { error: 'Image data required' },
                { status: 400 }
            )
        }

        console.log('[API] Processing prediction request', {
            hasImage: !!image,
            paymentTxHash
        })

        // Call MNIST Python API
        const response = await fetch(MNIST_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(image),
        })

        if (!response.ok) {
            throw new Error(`MNIST API failed: ${response.statusText}`)
        }

        const result = await response.json()

        return NextResponse.json({
            ...result,
            paymentVerified: true,
            paymentSettled: true,
            transactionHash: paymentTxHash,
        })
    } catch (error) {
        console.error('[API] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
