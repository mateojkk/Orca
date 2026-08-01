import { defineChain } from 'viem';

export const sepolia = defineChain({
  id: 11155111,
  name: 'Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com'] },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
  },
  testnet: true,
});

export const NOX_COMPUTE_ADDRESS = '0x24Ef36Ec5b626D7DCD09a98F3083c2758F0F77bF' as const;

export const EXPLORER_TX = (tx: string) =>
  `https://sepolia.etherscan.io/tx/${tx}`;

export const EXPLORER_ADDR = (addr: string) =>
  `https://sepolia.etherscan.io/address/${addr}`;
