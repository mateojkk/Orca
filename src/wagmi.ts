import { createConfig, http } from 'wagmi';
import { sepolia } from 'viem/chains';

const SEPOLIA_RPC = import.meta.env.VITE_SEPOLIA_RPC || 'https://rpc.sepolia.org';

export const wagmiConfig = createConfig({
  chains: [sepolia],
  multiInjectedProviderDiscovery: false,
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC),
  },
});
