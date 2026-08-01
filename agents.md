# ORCA Project - Agent Rules & Context

## 1. Project Overview
ORCA is a **Confidential Chat Wallet** built on Ethereum Sepolia. It leverages the **Nox Protocol** for on-chain privacy and confidentiality, allowing users to hold, deposit, withdraw, and transfer USDC confidentially without revealing plaintext balances.

---

## 2. Architecture & Tech Stack
### Frontend (Vite + React + TypeScript)
- **Styling Constraints**: The project uses **Vanilla CSS** (`.module.css` and `index.css`). **Do not use Tailwind CSS** under any circumstances. Ensure all designs feel highly premium, modern, and dynamic (glassmorphism, subtle gradients, micro-animations).
- **Web3**: `viem` and `wagmi` for blockchain interactions.
- **Auth**: `@privy-io/react-auth` for email-based embedded wallets. The wallet is automatically created on login (`createOnLogin: 'users-without-wallets'`).
- **Confidentiality**: `@iexec-nox/handle` (Nox SDK wrapper in `src/lib/noxSdk.ts`) is used to encrypt inputs and generate zero-knowledge proofs locally.
- **State Management**: Handled primarily through `src/hooks/useAppState.ts` which manages the active `OrcaWallet`, contacts list, and fetching confidential balances.

### Backend (Python + FastAPI)
- **Relayer**: A gasless relayer (`api/relayer.py`) that uses `web3.py` and a central `PRIVATE_KEY` (loaded from `.env`). It submits transactions (`relayedTransfer`, `relayedWithdrawUSDC`, etc.) on behalf of users, covering their gas fees on Sepolia.
- **Database**: Supabase (PostgreSQL). The backend uses the `supabase` Python client with a `SERVICE_ROLE` key to manage persistent storage. **Do not use local SQLite (`orca.db`).**
- **API Endpoints (`api/main.py`)**:
  - `POST /api/users/register`: Registers a new user.
  - `GET /api/users/{address}`: Fetches user by wallet address.
  - `GET /api/preferences` & `POST /api/preferences`: Manage user preferences (e.g., `balance_visible`). Requires `X-Wallet-Address` header.
  - `GET /contacts` & `POST /contacts` & `DELETE /contacts/{id}`: Manage user's address book.
  - `POST /api/relay/*`: Endpoints to submit gasless transactions.

### Smart Contracts
- Interacts with a `ConfidentialToken` contract deployed on Sepolia (`VITE_CONTRACT_ADDRESS`).
- Users generate encryption proofs (`handle`, `proof`) using the Nox SDK on the frontend. These are then sent to the Python relayer API, which submits them on-chain.

---

## 3. Important Rules for Agents
- **Prioritize Specific Tools**: Always use the most specific tool available (e.g., `view_file` over `cat`, `grep_search` over `grep`).
- **Design Aesthetic**: If you are adding UI components, they MUST look visually stunning. Avoid simple MVP layouts. Use animations and proper typography.
- **Gasless Flow**: Never instruct the user to fund their wallet with Sepolia ETH for gas. Gas is explicitly covered by the backend relayer.
- **Database Operations**: All persistent storage MUST route through the Python FastAPI backend to Supabase. Do not write local storage logic for things that must persist across sessions (except for safe browser-specific cache).
- **Run Environment**: The app is run via `npm run dev`, which uses `concurrently` to launch both the Vite frontend and the FastAPI backend (`api/.venv/bin/uvicorn`) simultaneously.

---

## 4. Known Technical Challenges (Context)
- **The Privy Modal Issue**: The Nox SDK requires an EIP-712 signature from the frontend's viem `walletClient` (via Privy) to generate a zero-knowledge encryption proof (`encryptInput`). This was resolved by setting `showWalletUIs: false` in the `PrivyProvider` config — Privy signs silently via MPC without showing any modal. The user's private key is never stored or exposed.
- **Future Work**: Investigate Account Abstraction (ERC-4337) Smart Accounts or Privy Server Delegated Actions for additional transaction automation patterns if needed.

---

## 5. Vercel Deployment Architecture

### File Structure
```
ORCA/
├── api/
│   └── index.py          ← Vercel entry point (thin wrapper only)
├── backend/              ← All business logic (FastAPI + relayer + DB)
│   ├── main.py
│   ├── relayer.py
│   └── database.py
├── src/                  ← Vite React frontend
├── vercel.json           ← Vercel config (rewrites + function settings)
└── requirements.txt      ← Python deps at repo root (Vercel requirement)
```

### How it works
- **All `/api/*` routes** → `api/index.py` (Python serverless, 60s timeout)
- **All other routes** → `dist/index.html` (React SPA)
- `api/index.py` injects `backend/` into `sys.path` then re-exports `app` from `backend/main.py`
- **No env var needed** for the API URL in production — frontend uses `''` base URL (same-origin)

### Required Vercel Environment Variables
| Variable | Notes |
|---|---|
| `PRIVATE_KEY` | Relayer signing key — mark as Secret |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key — mark as Secret |
| `SEPOLIA_RPC` | Sepolia RPC endpoint |
| `CONFIDENTIAL_TOKEN_ADDRESS` | Deployed contract address |
| `VITE_PRIVY_APP_ID` | Privy app ID (build-time) |
| `VITE_SEPOLIA_RPC` | Sepolia RPC for browser (build-time) |
| `VITE_CONTRACT_ADDRESS` | Contract address for frontend (build-time) |

> **Do NOT set `VITE_RELAYER_URL`** in Vercel — the frontend defaults to `''` (same-origin) which is correct.

### Local Dev (unchanged)
Run backend: `cd backend && uvicorn main:app --port 8080 --reload`
Run frontend: `npm run dev` (Vite proxy forwards `/api` → `http://127.0.0.1:8080`)

