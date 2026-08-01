# ORCA Project Handoff

Welcome to the ORCA project! I've been helping the user migrate and adapt the Mikuu Terminal UI and integrate the Nox JS SDK.

We are right at the finish line. The frontend Terminal UI and Nox SDK are fully ported and integrated. The backend API has endpoints set up. The only major missing piece is finalizing the Smart Contract and wiring up the addresses.

## Current State of the Workspace
- **Path**: `/home/mateo/basement/ORCA`
- **Compiler**: `hardhat.config.ts` is configured with `solc 0.8.35`.
- **Frontend**: The React Terminal UI and Nox `encryptAmount/decrypt` logic are completely finished (see `src/lib/terminal` and `src/lib/noxSdk.ts`).
- **Backend**: The FastAPI relayer is written and exposes cheque writing/claiming endpoints (`api/main.py`).

## Your Next Steps (ASAP)

1. **Complete `ConfidentialToken.sol`**
   The frontend (`src/lib/orcaContract.ts`) and backend (`api/relayer.py`) expect three functions that currently do NOT exist in `contracts/ConfidentialToken.sol`:
   - `relayedWriteCheque(address from, address chequeId, bytes32 handle, bytes proof)`
     *Logic*: Deduct the encrypted `handle` from `_balances[from]` and store it in the `_cheques[chequeId]` mapping. Add viewer access.
   - `relayedClaimCheque(address to, uint8 v, bytes32 r, bytes32 s)`
     *Logic*: Recover the signer (`chequeId`) using `ecrecover` from the signature (the signed payload is likely the `to` address to prevent frontrunning). Transfer the balance from `_cheques[chequeId]` to `_balances[to]`. Mark `_chequeClaimed[chequeId] = true`.
   - `isUserInitialized(address user) returns (bool)`
     *Logic*: Return `true` if `_balances[user]` is initialized (not zero-handle).

2. **Deploy to Sepolia**
   - Use the existing deployment script: `npx hardhat ignition deploy ignition/modules/ConfidentialToken.ts --network sepolia`

3. **Wire up Addresses and ABIs**
   - Update the hardcoded ABI in `src/lib/orcaContract.ts` to match the newly deployed contract.
   - Set the `VITE_CONTRACT_ADDRESS` in the frontend `.env`.
   - Update the ABI and contract address in the backend (`api/relayer.py` and `api/.env`).

4. **Verify End-to-End**
   - Boot up the Vite frontend (`npm run dev`) and FastAPI backend (`cd api && python main.py`).
   - Run a test through the Terminal UI: login, unlock, `deposit`, `cheque`, `claim`, and `withdraw`.

Good luck! Check `AGENTS.md` for more high-level architecture details on how Nox handles permissions (`Nox.allowThis()`, `Nox.addViewer()`).
