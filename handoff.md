# ORCA Project Handoff

## 1. What Was Accomplished in the Current Session
- **Database Migration**: Successfully migrated the legacy SQLite database (`orca.db`) to a managed Supabase Postgres instance.
  - Users, contacts, transactions, and user preferences tables were migrated.
  - The `SUPABASE_SERVICE_KEY` was correctly configured with `GRANT ALL PRIVILEGES` to fix permission errors.
- **Backend Refactor**: The FastApi backend (`api/main.py`, `api/database.py`) was fully rewritten to interface with Supabase using the Python `supabase` client.
  - Implemented new `GET /api/preferences` and `POST /api/preferences` endpoints for user state syncing.
- **Frontend State Management**: Updated `src/App.tsx` and `src/views/HomeView.tsx` to pull state from the Supabase backend rather than relying on browser `localStorage`.
- **Bug Fixes**: 
  - Fixed an issue in `src/App.tsx` where refreshing the page briefly flashed the `LandingPage` before rehydrating the Privy authenticated session. The frontend now accurately holds the loading state and transitions directly to the `AppShell` or `AuthView` (for reconnecting) if the user is authenticated.
- **Dev Environment**: Created a Python virtual environment (`api/.venv`) and added `concurrently` to `package.json` to allow running both the Vite frontend and FastAPI backend via a single `npm run dev` command.

## 2. Current State of the App
- The application compiles and runs successfully. 
- The backend successfully relays gasless transactions (via `relayer.py`) and stores user data securely in Supabase.
- The frontend correctly uses the Privy embedded wallet.
- **The Issue**: Every time a user initiates a transaction (deposit, transfer, withdraw), the Nox SDK (`@iexec-nox/handle`) requires an EIP-712 signature from the frontend's viem `walletClient` to generate a zero-knowledge proof. Because the app uses Privy's embedded wallet, this triggers a Privy confirmation modal for **every single transaction**, severely impacting the UX.

## 3. The Unresolved Challenge (Bypassing the Privy Modal)
- **Goal**: Implement "automatic transaction signing" where the user only needs to approve a transaction once per session/lifetime, and subsequent transactions (like Nox SDK encryption proofs) are signed automatically without a modal.
- **Attempted Solution**: Proposed a "Deterministic Session Key" (Burner Wallet) where the user signs one seed message, which is hashed to generate a local Viem `PrivateKeyAccount`. This was rejected.
- **Required Research**: Proper research is needed to bypass the Privy transaction signing modal correctly. 
  - *Note on Privy Delegated Actions*: Privy offers "Delegated Actions" which allows automatic signing without modals, but this is primarily designed for **Server-Side** signing using the Privy Node.js SDK. Our architecture currently requires the signature to happen on the **Frontend** because the Nox SDK (`client.encryptInput`) is tightly coupled to the frontend viem `walletClient`. 
  - *Potential Alternatives*: 
    1. Look into Account Abstraction (ERC-4337) Smart Accounts (e.g., Safe, ZeroDev, Biconomy) with Session Key modules integrated with Privy.
    2. Investigate if Privy has released frontend-delegated session keys for EOA embedded wallets.
    3. Modify the Nox SDK implementation to support server-side encryption/proof generation via Privy Server Delegated Actions.

## 4. Next Steps
- Research the optimal way to achieve "Approve Once" automatic transaction signing with Privy + Nox SDK.
- Once decided, implement the transaction signing bypass and remove the repetitive Privy modals.
- Continue with UI/UX polish and any remaining feature implementation.
