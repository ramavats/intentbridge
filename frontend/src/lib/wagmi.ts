import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';

const polkadotHubTestnet = {
    id: 420420417,
    name: 'Polkadot Hub TestNet',
    network: 'polkadot-hub-testnet',
    nativeCurrency: { decimals: 18, name: 'PAS', symbol: 'PAS' },
    rpcUrls: {
        default: { http: ['https://services.polkadothub-rpc.com/testnet'] },
    },
    blockExplorers: {
        default: { name: 'Routescan', url: 'https://420420417.testnet.routescan.io' }
    }
} as const;

export const config = createConfig({
    chains: [polkadotHubTestnet],
    connectors: [injected()],
    transports: { [polkadotHubTestnet.id]: http() },
});
