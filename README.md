# ◈ ORCA

<p align="center">
  <strong>The Ultimate Private Banking Terminal for EVM Chains.</strong>
</p>

ORCA is a privacy-first, gasless financial terminal built for the Ethereum ecosystem. It abstracts away the complexities of blockchain UX—no gas fees, no confusing hex addresses, and absolute financial privacy by default. 

Built for modern users who want the security of crypto with the UX of a neobank.

## ✨ Key Features

- **Absolute Financial Privacy**: ORCA integrates with **iExec's TEE (Trusted Execution Environment)** to wrap public USDC into confidential cUSDC. Your balances and transfer amounts are encrypted on-chain.
- **100% Gasless UX**: You never need ETH to use ORCA. A custom Python-based Relayer submits transactions on your behalf and covers all gas fees. 
- **Developer-Friendly Terminal**: Send money like you write code. The built-in command-line interface lets you type `send 5 to Alice` rather than dealing with clunky modals.
- **Smart Address Book**: Map complex `0x...` addresses to simple, human-readable contact names.
- **Private Cheques**: Send asynchronous, off-chain payments. Generate a cryptographic secret (a "cheque") for a specific amount, and whoever claims that secret receives the funds.
- **Walletless Onboarding**: Powered by **Privy**, users can create secure embedded wallets using just their email—no MetaMask or browser extensions required.

## 🏗️ Architecture

ORCA is structured as a monorepo containing both the frontend client and the backend relayer.

### 1. The Terminal Client (Frontend)
- **Stack**: React, TypeScript, Vite, CSS Modules.
- **Role**: Handles the UI, terminal command parsing, local state, and Privy embedded wallet orchestration. 
- **Key Modules**:
  - `commandParser.ts` & `commandFlow.ts`: The brains behind the CLI interface.
  - `orcaWallet.ts`: Manages viem wallet clients and Privy integration.

### 2. The Gasless Relayer (Backend)
- **Stack**: Python, FastAPI, Web3.py, Supabase (PostgreSQL).
- **Role**: A serverless API (deployed on Vercel) that takes signed EIP-712 messages from the frontend and submits them to the Sepolia testnet using a funded relayer account. 
- **Key Modules**:
  - `relayer.py`: Manages nonces, interacts with the blockchain, and broadcasts transactions.
  - `database.py`: Syncs transaction history and address books to Supabase for instant frontend fetching.

### 3. The Confidential Contracts (Smart Contracts)
- **Stack**: Solidity, iExec Nox SDK.
- **Role**: ERC-20 compliant contracts extended with iExec's confidential computing capabilities to ensure that balances and transfer amounts remain completely encrypted.

## 🚀 Getting Started (Development)

### Prerequisites
- Node.js (v18+)
- Python 3.9+
- A Supabase Project
- A Privy App ID

### Frontend Setup
```bash
# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

### Backend Setup
```bash
# Navigate to the api directory
cd api

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server (runs on port 8080)
uvicorn main:app --port 8080 --reload
```

## 🛠️ Environment Variables

You'll need a `.env` file in the root directory with the following keys:

```env
# Frontend
VITE_PRIVY_APP_ID=your_privy_app_id
VITE_RELAYER_URL=http://localhost:8080

# Backend Relayer
PRIVATE_KEY=your_relayer_wallet_private_key
SEPOLIA_RPC=https://rpc.sepolia.org
CONTRACT_ADDRESS=your_deployed_contract_address

# Database
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

## 📜 License
MIT
