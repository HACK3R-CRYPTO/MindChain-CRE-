import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { data, action } = body

        // Call MNIST API
        const response = await fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data }),
        })

        const result = await response.json()

        return NextResponse.json({
            digit: result.prediction,
            confidence: result.confidence || 0.95,
        })
    } catch (error) {
        console.error('Prediction API error:', error)
        return NextResponse.json(
            { error: 'Failed to predict digit' },
            { status: 500 }
        )
    }
}
