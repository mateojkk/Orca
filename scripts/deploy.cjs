const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  const rawKey = process.env.PRIVATE_KEY;
  if (!rawKey || rawKey === '0000000000000000000000000000000000000000000000000000000000000001') {
    console.error('\n❌ ERROR: Default dummy private key detected in .env!');
    console.error('Please update PRIVATE_KEY in .env with your funded Sepolia wallet private key before deploying.\n');
    process.exit(1);
  }

  const key = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`;
  const rpcUrl = process.env.SEPOLIA_RPC || 'https://rpc.sepolia.org';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(key, provider);

  console.log('Deployer Wallet:', wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log('Sepolia ETH Balance:', ethers.formatEther(balance), 'ETH');

  if (balance === 0n) {
    console.error('❌ ERROR: Deployer wallet has 0 Sepolia ETH! Please fund it from a Sepolia faucet.');
    process.exit(1);
  }

  const artifactPath = path.join(__dirname, '../artifacts/contracts/ConfidentialToken.sol/ConfidentialToken.json');
  if (!fs.existsSync(artifactPath)) {
    console.log('Compiling contracts...');
    require('child_process').execSync('npx hardhat compile', { stdio: 'inherit' });
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  const SEPOLIA_USDC = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
  console.log('Deploying ConfidentialToken to Sepolia...');
  const contract = await factory.deploy(SEPOLIA_USDC);
  console.log('Tx Hash:', contract.deploymentTransaction().hash);
  await contract.waitForDeployment();

  const deployedAddress = await contract.getAddress();
  console.log('\n==================================================');
  console.log('🎉 SUCCESS! ConfidentialToken deployed to Sepolia at:');
  console.log(deployedAddress);
  console.log('==================================================\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
