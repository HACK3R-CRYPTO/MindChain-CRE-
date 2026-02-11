import { NextResponse, NextRequest } from 'next/server'
import { sendCRERequest } from '../../../lib/cre'
import { runSimulation } from '../../../lib/simulation'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { query, userAddress } = body
        const paymentTxHash = request.headers.get('x-payment-tx-hash')

        console.log('Chat API Request:', { query, userAddress, paymentTxHash })

        if (!query) return NextResponse.json({ error: 'Query is required' }, { status: 400 })

        // Check for CRE Configuration
        const workflowId = process.env.CRE_WORKFLOW_ID
        const privateKey = process.env.CRE_PRIVATE_KEY
        const gatewayUrl = process.env.CRE_GATEWAY_URL || 'https://01.gateway.zone-a.cre.chain.link'

        // ---------------------------------------------------------
        // STRATEGY: Try CRE if configured, otherwise fallback to Simulation
        // ---------------------------------------------------------

        if (workflowId && privateKey) {
            try {
                console.log('🚀 Sending request to Chainlink CRE Gateway...')
                const input = {
                    query,
                    userAddress: userAddress || '0x0000000000000000000000000000000000000000',
                    paymentTxHash: paymentTxHash || '',
                    action: 'chat'
                }

                const creResponse = await sendCRERequest(workflowId, input, privateKey, gatewayUrl)
                console.log('✅ CRE Response:', JSON.stringify(creResponse, null, 2))

                // Adapt response if CRE returns wrapped result
                const resultData = creResponse.result || creResponse

                return NextResponse.json({
                    data: resultData,
                    response: resultData.result || resultData.response || "Processing...",
                    agent: resultData.agent || "Chainlink CRE Agent",
                    paymentVerified: true,
                    source: 'CRE'
                })

            } catch (creError: any) {
                console.error('⚠️ CRE Execution failed, falling back to simulation:', creError.message)
                // Fallthrough to simulation
            }
        } else {
            console.log('ℹ️ CRE not configured, using local simulation.')
        }

        // ---------------------------------------------------------
        // FALLBACK: Local Simulation (runs logic in Next.js API)
        // ---------------------------------------------------------
        try {
            const simulationResult = await runSimulation(query, userAddress)
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
