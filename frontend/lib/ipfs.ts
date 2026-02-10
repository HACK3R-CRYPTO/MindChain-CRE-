import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
    pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
    pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL || "gateway.pinata.cloud",
});

export async function uploadJSONToIPFS(data: any): Promise<string> {
    try {
        const upload = await pinata.upload.json(data);
        return upload.IpfsHash;
    } catch (error) {
        console.error("Error uploading JSON to IPFS:", error);
        throw new Error("Failed to upload metadata to IPFS");
    }
}

export async function uploadFileToIPFS(file: File): Promise<string> {
    try {
        const upload = await pinata.upload.file(file);
        return upload.IpfsHash;
    } catch (error) {
        console.error("Error uploading file to IPFS:", error);
        throw new Error("Failed to upload file to IPFS");
    }
}

export function getIPFSUrl(cid: string): string {
    const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL || "gateway.pinata.cloud";
    return `https://${gateway}/ipfs/${cid}`;
}

export async function getFromIPFS(cid: string): Promise<any> {
    try {
        const response = await fetch(getIPFSUrl(cid));
        if (!response.ok) throw new Error("Failed to fetch from IPFS");
        return await response.json();
    } catch (error) {
        console.error("Error fetching from IPFS:", error);
        return null;
    }
}
