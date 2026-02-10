import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { query, userAddress, action } = body

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
        })
    } catch (error) {
        console.error('Chat API error:', error)
        return NextResponse.json(
            { error: 'Failed to get AI response' },
            { status: 500 }
        )
    }
}
