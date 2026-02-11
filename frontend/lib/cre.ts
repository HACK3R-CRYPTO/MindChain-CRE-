import { privateKeyToAccount } from 'viem/accounts';
import { keccak256, toHex, stringToBytes } from 'viem';

interface JSONRPCRequest {
    jsonrpc: '2.0';
    id: string;
    method: 'workflows.execute';
    params: {
        input: any;
        workflow: {
            workflowID: string;
        };
    };
}

/**
 * Sorts object keys recursively to ensure deterministic JSON serialization
 * required for CRE request digest.
 */
function sortKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(sortKeys);
    }
    return Object.keys(obj)
        .sort()
        .reduce((result: any, key) => {
            result[key] = sortKeys(obj[key]);
            return result;
        }, {});
}

/**
 * Computes the SHA256 digest of the sorted JSON body.
 */
async function computeDigest(body: any): Promise<string> {
    const sortedBody = sortKeys(body);
    const jsonString = JSON.stringify(sortedBody);
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return `0x${hashHex}`;
}

function base64UrlEncode(str: string): string {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Generates a signed JWT for authentication with CRE Gateway.
 */
export async function generateCREToken(
    requestBody: JSONRPCRequest,
    privateKey: `0x${string}`
): Promise<string> {
    const account = privateKeyToAccount(privateKey);
    const address = account.address;

    // 1. Create Digest
    const digest = await computeDigest(requestBody);

    // 2. Create Header
    const header = {
        alg: 'ETH',
        typ: 'JWT',
    };

    // 3. Create Payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        digest,
        iss: address,
        iat: now,
        exp: now + 300, // 5 minutes expiration
        jti: crypto.randomUUID(),
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const message = `${encodedHeader}.${encodedPayload}`;

    // 4. Sign Message
    // CRE expects ECDSA signature of the message string
    // We sign the message string directly (viem's signMessage handles the Ethereum prefix)
    const signature = await account.signMessage({
        message: message,
    });

    // 5. Construct JWT
    // Signature from viem is 0x-prefixed hex string. CRE expects base64url encoded bytes of r,s,v.
    // We need to convert hex signature to bytes then base64url encode.

    // Remove 0x prefix
    const rawSignature = signature.slice(2);
    const signatureBuffer = Buffer.from(rawSignature, 'hex');
    const encodedSignature = signatureBuffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return `${message}.${encodedSignature}`;
}

export async function sendCRERequest(
    workflowId: string,
    input: any,
    privateKey: string,
    gatewayUrl: string
) {
    if (!workflowId || !privateKey || !gatewayUrl) {
        throw new Error('Missing CRE configuration (workflowId, privateKey, or gatewayUrl)');
    }

    // Ensure private key has 0x prefix
    const formattedPrivateKey = privateKey.startsWith('0x')
        ? (privateKey as `0x${string}`)
        : (`0x${privateKey}` as `0x${string}`);

    const requestId = crypto.randomUUID();
    const requestBody: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: requestId,
        method: 'workflows.execute',
        params: {
            input,
            workflow: {
                workflowID: workflowId,
            },
        },
    };

    const token = await generateCREToken(requestBody, formattedPrivateKey);

    const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`CRE Gateway Request Failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
}
