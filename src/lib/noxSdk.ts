/**
 * noxSdk.ts - Nox Protocol JS SDK wrapper
 *
 * Uses @iexec-nox/handle to encrypt inputs (for withdraw/transfer)
 * and decrypt confidential balance handles.
 *
 * The SDK auto-resolves gateway + NoxCompute address from chainId.
 * For Sepolia (11155111), the built-in config is:
 *   gatewayUrl:            https://gateway-testnets.noxprotocol.dev
 *   smartContractAddress:  0x24ef36ec5b626d7dcd09a98f3083c2758f0f77bf  (NoxCompute)
 *   subgraphUrl:           https://thegraph.ethereum-sepolia-testnet.noxprotocol.io/...
 *
 * NOTE: the `smartContractAddress` the SDK uses internally is NoxCompute, NOT our
 * ConfidentialToken. Our contract address is only passed as `applicationContract`
 * to encryptInput() so the proof is bound to our contract.
 */
import { createViemHandleClient } from '@iexec-nox/handle';
import type { WalletClient } from 'viem';
import type { HandleClient } from '@iexec-nox/handle';

let _client: HandleClient | null = null;
let _clientWallet: `0x${string}` | null = null;

/**
 * Initialize or return cached HandleClient for the given wallet.
 * No config overrides - SDK auto-resolves from chainId (Sepolia).
 */
export async function getHandleClient(walletClient: WalletClient): Promise<HandleClient> {
  const addr = walletClient.account?.address;
  if (_client && _clientWallet === addr) return _client;

  // No config override - SDK uses built-in Sepolia gateway + NoxCompute address
  _client = await createViemHandleClient(walletClient);
  _clientWallet = addr ?? null;
  return _client;
}

export function clearHandleClient(): void {
  _client = null;
  _clientWallet = null;
}

/**
 * Encrypt a uint256 value (wei amount) and return {handle, proof}.
 * contractAddress here is our ConfidentialToken - it binds the proof to our app.
 */
export async function encryptAmount(
  amountWei: bigint,
  walletClient: WalletClient,
  contractAddress: `0x${string}`
): Promise<{ handle: `0x${string}`; proof: `0x${string}` }> {
  const client = await getHandleClient(walletClient);
  const { handle, handleProof } = await client.encryptInput(
    amountWei,
    'uint256',
    contractAddress   // applicationContract - binds proof to our ConfidentialToken
  );
  return { handle: handle as `0x${string}`, proof: handleProof as `0x${string}` };
}

/**
 * Decrypt a confidential balance handle to reveal the plaintext bigint.
 * Returns null if decryption fails (e.g. not authorized, subgraph unavailable).
 */
export async function decryptBalance(
  handle: `0x${string}`,
  walletClient: WalletClient,
): Promise<bigint | null> {
  try {
    const zero = '0x0000000000000000000000000000000000000000000000000000000000000000';
    if (!handle || handle === zero) return 0n;
    const client = await getHandleClient(walletClient);
    const result = await client.decrypt<'uint256'>(handle as any);
    return result.value as bigint;
  } catch (err: any) {
    console.warn('[noxSdk] decrypt failed:', err?.message || err);
    return null;
  }
}
