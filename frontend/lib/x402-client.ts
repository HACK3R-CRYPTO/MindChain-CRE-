/**
 * x402 Client Payment Helper
 * Generates payment signatures for API requests using x402 SDK
 */

import { x402Client } from '@x402/core/client'
import { registerExactEvmScheme } from '@x402/evm/exact/client'
import { encodePaymentSignatureHeader } from '@x402/core/http'
import type { WalletClient } from 'viem'

/**
 * Adapter to make Viem WalletClient compatible with x402 ClientEvmSigner
 */
function createViemSigner(walletClient: WalletClient, account: string) {
    return {
        address: account as `0x${string}`,
        async signTypedData(params: {
            domain: Record<string, unknown>
            types: Record<string, unknown>
            primaryType: string
            message: Record<string, unknown>
        }): Promise<`0x${string}`> {
            // Viem expects strictly typed data, but x402 SDK passes Record<string, unknown>
            // We cast to any to bypass strict type checking for the generic x402 types
            return walletClient.signTypedData({
                account: account as `0x${string}`,
                domain: params.domain as any,
                types: params.types as any,
                primaryType: params.primaryType,
                message: params.message as any,
            })
        },
    }
}

/**
 * Generate payment signature for a 402 response
 *
 * @param paymentRequired - The 402 response from the server
 * @param walletClient - Viem wallet client for signing
 * @param account - The account address to sign with
 * @returns Payment signature header value
 */
export async function generatePaymentSignature(
    paymentRequired: any,
    walletClient: WalletClient,
    account: string
): Promise<string> {
    // Create base client
    const client = new x402Client()

    // Create signer adapter
    const signer = createViemSigner(walletClient, account)

    // Register EVM scheme with our signer
    registerExactEvmScheme(client, { signer })

    // Build payment payload from the requirements
    const paymentPayload = await client.createPaymentPayload(paymentRequired)

    // Encode as header
    return encodePaymentSignatureHeader(paymentPayload)
}
