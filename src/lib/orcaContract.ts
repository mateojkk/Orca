/**
 * orcaContract.ts - viem client for ConfidentialToken on Sepolia
 */
import { createPublicClient, http, formatUnits } from 'viem';
import type { WalletClient } from 'viem';
import { sepolia } from './sepoliaChain';

const CONTRACT_ADDRESS = (
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  import.meta.env.VITE_CONFIDENTIAL_TOKEN_ADDRESS ||
  '0x0000000000000000000000000000000000000000'
) as `0x${string}`;
const RPC = import.meta.env.VITE_SEPOLIA_RPC || 'https://rpc.sepolia.org';

export const CONFIDENTIAL_TOKEN_ADDRESS: `0x${string}` = CONTRACT_ADDRESS;
export const SEPOLIA_USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`;

export const ERC20_ABI = [
  {
    type: 'function', name: 'approve', stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ type: 'bool' }]
  },
  {
    type: 'function', name: 'balanceOf', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function', name: 'allowance', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  }
] as const;

export const CONFIDENTIAL_TOKEN_ABI = [
  {
    type: 'function', name: 'depositUSDC', stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }], outputs: []
  },
  {
    type: 'function', name: 'withdrawUSDC', stateMutability: 'nonpayable',
    inputs: [
      { name: 'handle', type: 'bytes32' },
      { name: 'proof', type: 'bytes' },
      { name: 'plaintextAmount', type: 'uint256' }
    ],
    outputs: []
  },
  {
    type: 'function', name: 'transfer', stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'handle', type: 'bytes32' },
      { name: 'proof', type: 'bytes' }
    ],
    outputs: []
  },
  {
    type: 'function', name: 'relayedTransfer', stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'handle', type: 'bytes32' },
      { name: 'proof', type: 'bytes' }
    ],
    outputs: []
  },
  {
    type: 'function', name: 'relayedWriteCheque', stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'chequeId', type: 'address' },
      { name: 'handle', type: 'bytes32' },
      { name: 'proof', type: 'bytes' }
    ],
    outputs: []
  },
  {
    type: 'function', name: 'relayedWithdrawUSDC', stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'handle', type: 'bytes32' },
      { name: 'proof', type: 'bytes' },
      { name: 'plaintextAmount', type: 'uint256' }
    ],
    outputs: []
  },
  {
    type: 'function', name: 'relayedClaimCheque', stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' }
    ],
    outputs: []
  },
  {
    type: 'function', name: 'getBalanceHandle', stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'bytes32' }]
  },
  {
    type: 'function', name: 'isUserInitialized', stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'bool' }]
  },
  {
    type: 'function', name: 'relayer', stateMutability: 'view',
    inputs: [], outputs: [{ type: 'address' }]
  },
  {
    type: 'event', name: 'Deposited',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event', name: 'Withdrawn',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event', name: 'Transferred',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'amountHandle', type: 'bytes32', indexed: true }
    ]
  },
  {
    type: 'event', name: 'ChequeWritten',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'chequeId', type: 'address', indexed: true }
    ]
  },
  {
    type: 'event', name: 'ChequeClaimed',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'chequeId', type: 'address', indexed: true }
    ]
  },
] as const;

const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC) });

/**
 * Read the confidential balance handle for a user.
 * Returns bytes32 hex string (the encrypted handle).
 */
export async function getBalanceHandle(user: `0x${string}`): Promise<`0x${string}`> {
  const handle = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: CONFIDENTIAL_TOKEN_ABI,
    functionName: 'getBalanceHandle',
    args: [user],
  });
  return handle as `0x${string}`;
}

/**
 * Check if a user has been initialized in the contract.
 */
export async function isUserInitialized(user: `0x${string}`): Promise<boolean> {
  return publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: CONFIDENTIAL_TOKEN_ABI,
    functionName: 'isUserInitialized',
    args: [user],
  }) as Promise<boolean>;
}

export async function approveUSDC(
  walletClient: WalletClient,
  amountWei: bigint
): Promise<`0x${string}`> {
  const hash = await walletClient.writeContract({
    address: SEPOLIA_USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [CONTRACT_ADDRESS, amountWei],
    chain: sepolia,
    account: walletClient.account!,
  });
  return hash;
}

export async function getUsdcAllowance(user: `0x${string}`): Promise<bigint> {
  const allowance = await publicClient.readContract({
    address: SEPOLIA_USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [user, CONTRACT_ADDRESS],
  });
  return allowance as bigint;
}

/**
 * Deposit USDC → confidential balance.
 */
export async function deposit(
  walletClient: WalletClient,
  amountWei: bigint
): Promise<`0x${string}`> {
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONFIDENTIAL_TOKEN_ABI,
    functionName: 'depositUSDC',
    args: [amountWei],
    chain: sepolia,
    account: walletClient.account!,
  });
  return hash;
}

/**
 * Withdraw confidential balance → USDC.
 */
export async function withdraw(
  walletClient: WalletClient,
  handle: `0x${string}`,
  proof: `0x${string}`,
  amountWei: bigint
): Promise<`0x${string}`> {
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONFIDENTIAL_TOKEN_ABI,
    functionName: 'withdrawUSDC',
    args: [handle, proof, amountWei],
    chain: sepolia,
    account: walletClient.account!,
  });
  return hash;
}

/**
 * Direct (non-gasless) confidential transfer.
 */
export async function directTransfer(
  walletClient: WalletClient,
  to: `0x${string}`,
  handle: `0x${string}`,
  proof: `0x${string}`
): Promise<`0x${string}`> {
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONFIDENTIAL_TOKEN_ABI,
    functionName: 'transfer',
    args: [to, handle, proof],
    chain: sepolia,
    account: walletClient.account!,
  });
  return hash;
}

/**
 * Get the raw USDC balance on Sepolia.
 */
export async function getUsdcBalance(address: `0x${string}`): Promise<string> {
  const raw = await publicClient.readContract({
    address: SEPOLIA_USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  });
  return formatUnits(raw as bigint, 6);
}

/**
 * Wait for a transaction to be mined.
 */
export async function waitForTx(hash: `0x${string}`) {
  return publicClient.waitForTransactionReceipt({ hash });
}
