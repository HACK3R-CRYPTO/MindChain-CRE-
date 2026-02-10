import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, metaMask, safe, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID'

export const config = createConfig({
    chains: [sepolia],
    connectors: [
        injected(),
        metaMask(),
        walletConnect({ projectId }),
        safe(),
    ],
    transports: {
        [sepolia.id]: http(),
    },
})

declare module 'wagmi' {
    interface Register {
        config: typeof config
    }
}
