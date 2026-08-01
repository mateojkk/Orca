import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import hardhat from 'hardhat';
import 'dotenv/config';

async function main() {
  const rawKey = process.env.PRIVATE_KEY;
  if (!rawKey || rawKey === '0000000000000000000000000000000000000000000000000000000000000001') {
    console.error('ERROR: Please set your funded Sepolia PRIVATE_KEY in .env before deploying.');
    process.exit(1);
  }
  const key = rawKey.startsWith('0x') ? (rawKey as `0x${string}`) : (`0x${rawKey}` as `0x${string}`);
  const account = privateKeyToAccount(key);
  console.log('Deployer Address:', account.address);

  const artifact = await hardhat.artifacts.readArtifact('ConfidentialToken');
  const SEPOLIA_USDC = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';

  const rpcUrl = process.env.SEPOLIA_RPC || 'https://rpc.sepolia.org';
  const publicClient = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ account, chain: sepolia, transport: http(rpcUrl) });

  console.log('Submitting deployment transaction to Sepolia...');
  const txHash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode as `0x${string}`,
    args: [SEPOLIA_USDC],
  });
  console.log('Tx Submitted:', txHash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log('\n==================================================');
  console.log('SUCCESS! ConfidentialToken deployed to Sepolia at:');
  console.log(receipt.contractAddress);
  console.log('==================================================\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
