import type { HardhatUserConfig } from "hardhat/config";
import hardhatIgnitionViem from "@nomicfoundation/hardhat-ignition-viem";
import "dotenv/config";

const rawKey = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000001";
const PRIVATE_KEY = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
const SEPOLIA_RPC = process.env.SEPOLIA_RPC || "https://rpc.sepolia.org";

const config: HardhatUserConfig = {
  plugins: [hardhatIgnitionViem],
  solidity: {
    version: "0.8.35",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    sepolia: {
      type: "http",
      url: SEPOLIA_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
  },
};

export default config;
