/**
 * x402 Integration Helpers
 * Based on labs-x402-tools reference implementation
 */

import {
    x402ResourceServer,
    HTTPFacilitatorClient,
} from "@x402/core/server";
import { decodePaymentSignatureHeader } from "@x402/core/http";
import type {
    PaymentPayload,
    AssetAmount,
    VerifyResponse,
    SettleResponse,
} from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm/exact/server";

// Base Sepolia configuration
const BASE_SEPOLIA = "eip155:84532" as const;
const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const FACILITATOR_URL = process.env.NEXT_PUBLIC_FACILITATOR_URL || "https://x402.org/facilitator";

// Singleton resource server
let resourceServer: x402ResourceServer | null = null;
let serverInitialized = false;

/**
 * Get or initialize the x402 resource server
 */
async function getResourceServer(): Promise<x402ResourceServer> {
    if (!resourceServer) {
        const facilitatorClient = new HTTPFacilitatorClient({
            url: FACILITATOR_URL,
        });

        resourceServer = new x402ResourceServer(facilitatorClient).register(
            BASE_SEPOLIA,
            new ExactEvmScheme()
        );
    }

    if (!serverInitialized) {
        await resourceServer.initialize();
        serverInitialized = true;
    }

    return resourceServer;
}

/**
 * Convert USD to USDC AssetAmount
 * USDC has 6 decimals: 1 USD = 1,000,000 atomic units
 */
export function usdToUsdc(usdAmount: number, testnet: boolean = true): AssetAmount {
    const amount = Math.floor(usdAmount * 1_000_000).toString();

    return {
        asset: USDC_BASE_SEPOLIA,
        amount,
        extra: {
            name: "USDC",
            version: "2",
        },
    };
}

/**
 * Parse payment signature from request headers
 */
export function parsePaymentSignature(request: Request): PaymentPayload | null {
    const signatureFromX = request.headers.get("X-Payment-Signature");
    const signatureFromPlain = request.headers.get("Payment-Signature");
    const signature = signatureFromX || signatureFromPlain;

    if (!signature) {
        return null;
    }

    try {
        return decodePaymentSignatureHeader(signature);
    } catch (error) {
        console.error("Failed to decode payment signature:", error);
        return null;
    }
}

/**
 * Verify payment with the x402 facilitator
 */
export async function verifyPayment(
    paymentPayload: PaymentPayload,
    options: {
        priceUsd: number
        payTo: string
        testnet?: boolean
    }
): Promise<VerifyResponse> {
    try {
        const server = await getResourceServer()
        const usdcAsset = usdToUsdc(options.priceUsd, options.testnet)

        const requirements = {
            scheme: 'exact',
            network: options.testnet ? BASE_SEPOLIA : BASE_SEPOLIA,
            asset: usdcAsset.asset,
            amount: usdcAsset.amount,
            payTo: options.payTo,
            maxTimeoutSeconds: 300,
            extra: usdcAsset.extra || {},
        }

        console.log('[x402] Verifying payment', {
            priceUsd: options.priceUsd,
            payTo: options.payTo,
            network: requirements.network,
            usdcAmount: usdcAsset.amount,
        })

        const result = await server.verifyPayment(paymentPayload, requirements)

        console.log('[x402] Verification result', result)
        return result
    } catch (error) {
        console.error('[x402] Payment verification failed', error)
        return {
            isValid: false,
            invalidReason: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

/**
 * Settle payment with the x402 facilitator
 */
export async function settlePayment(
    paymentPayload: PaymentPayload,
    options: {
        priceUsd: number
        payTo: string
        testnet?: boolean
    }
): Promise<SettleResponse> {
    try {
        const server = await getResourceServer()
        const usdcAsset = usdToUsdc(options.priceUsd, options.testnet)

        const requirements = {
            scheme: 'exact',
            network: options.testnet ? BASE_SEPOLIA : BASE_SEPOLIA,
            asset: usdcAsset.asset,
            amount: usdcAsset.amount,
            payTo: options.payTo,
            maxTimeoutSeconds: 300,
            extra: usdcAsset.extra || {},
        }

        console.log('[x402] Settling payment', {
            priceUsd: options.priceUsd,
            payTo: options.payTo,
            network: requirements.network,
            usdcAmount: usdcAsset.amount,
        })

        const result = await server.settlePayment(paymentPayload, requirements)

        console.log('[x402] Settlement result', result)
        return result
    } catch (error) {
        console.error('[x402] Payment settlement failed', error)
        return {
            success: false,
            errorReason: error instanceof Error ? error.message : 'Unknown error',
            transaction: '',
            network: options.testnet ? BASE_SEPOLIA : BASE_SEPOLIA,
        }
    }
}

/**
 * Generate payment required response (402)
 */
export function generatePaymentRequiredResponse(config: {
    url: string;
    description?: string;
    priceUsd: number;
    payTo: string;
    testnet?: boolean;
}) {
    const usdcAsset = usdToUsdc(config.priceUsd, config.testnet);

    return {
        x402Version: 2,
        resource: {
            url: config.url,
            description: config.description,
            mimeType: "application/json",
        },
        accepts: [
            {
                scheme: "exact",
                network: BASE_SEPOLIA,
                amount: usdcAsset.amount,
                payTo: config.payTo,
                maxTimeoutSeconds: 300,
                asset: usdcAsset.asset,
                extra: usdcAsset.extra,
            },
        ],
    };
}

// Re-export types
export type { PaymentPayload, VerifyResponse, SettleResponse };
