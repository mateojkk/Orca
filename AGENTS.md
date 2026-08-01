# ORCA — Confidential Terminal Wallet (WTF Hackathon)

## Project Overview

A confidential terminal-style wallet on **Ethereum Sepolia** using **Nox Protocol** for encrypted balances/transfers. Fork of Mikuu (Tempo wallet) adapted for the iExec WTF Hackathon Summer Edition.

Architecture: User encrypts amounts via Nox JS SDK → validates via `validateInputProof(handle, user, proof)` directly on NoxCompute → contract uses `euint256.wrap(handle)` for confidential ops. Gasless via faucet-funded relayer.

## Tech Stack

- **Contracts**: Solidity 0.8.27+ (requires >=0.8.35 due to Nox dependency), Hardhat 3
- **Nox Protocol**: `@iexec-nox/nox-protocol-contracts` v0.2.4
- **Frontend**: Vite 8 + React 19 + TypeScript 6
- **Auth**: Privy (from Mikuu, kept as-is)
- **Relayer**: Python/FastAPI backend (from Mikuu, adapted)

## Key Files

| File | Purpose |
|------|---------|
| `contracts/ConfidentialToken.sol` | ERC-7984-like confidential token with deposit/withdraw/transfer + relayer support |
| `hardhat.config.ts` | HH3 config — Sepolia network, solidity 0.8.27 optimizer enabled |
| `package.json` | Vite + Hardhat deps. Nox contracts at `@iexec-nox/nox-protocol-contracts` |
| `src/` | Vite React frontend (currently scaffold, needs adaptation from Mikuu) |

## Nox Compute Addresses (Sepolia)

- NoxCompute: `0x24Ef36Ec5b626D7DCD09a98F3083c2758F0F77bF` (chain 11155111)

## Smart Contract — ConfidentialToken.sol

### Critical Architecture Decisions

1. **Proof validation bypasses Nox library's `fromExternal()`** — `fromExternal` passes `msg.sender` as owner, which breaks relayers. Instead we call `INoxCompute(NOX_COMPUTE).validateInputProof(handle, user, proof, TEEType.Uint256)` directly. This validates the proof against the real user AND grants transient access to our contract (see `Compute.sol:93`).

2. **ACL must be set manually every time** — After every `Nox.mint()`, `Nox.transfer()`, `Nox.burn()`: call `Nox.allowThis(resultHandle)` + `Nox.addViewer(resultHandle, user)`. Without this, handles are only transiently accessible and break on the next tx.

3. **Zero-handle initialization** — `_ensureBalance()` initializes new users with `Nox.toEuint256(0)` before any operation. Necessary because NoxCompute's `_requireDefinedHandles()` reverts on `bytes32(0)`.

### Contract Functions

| Function | Caller | Description |
|----------|--------|-------------|
| `deposit()` | anyone (payable) | Send ETH → get confidential balance via `Nox.mint()` |
| `withdraw(handle, proof, plaintextAmount)` | anyone | Burn confidential balance → receive ETH (user provides plaintext amount for the transfer) |
| `transfer(to, handle, proof)` | anyone (pays own gas) | Send confidential tokens to another user |
| `relayedTransfer(from, to, handle, proof)` | relayer only | Gasless version — relayer submits, contract validates proof against `from` |
| `setRelayer(newRelayer)` | current relayer | Update relayer address |

### Known Issue

`withdraw()` takes `plaintextAmount` as a separate param — there's no on-chain check that it matches the encrypted handle. The user could lie. In production, use `Nox.publicDecrypt()` with a decryption proof to verify. For hackathon, acceptable if the burn already consumed the confidential balance (and the user can only withdraw what they burned — but the ETH send uses the plaintext value).

## Hardhat 3 Peculiarities

- Config format: `networks.sepolia.type: "http"` is REQUIRED (discriminator field)
- Accounts: array of hex private key strings
- `@nomicfoundation/hardhat-toolbox` is NOT compatible with HH3 (installed wrong package, already removed)
- `@nomicfoundation/hardhat-ignition-viem` IS the HH3-compatible deployment plugin
- Compile: `npx hardhat compile` (requires solc >=0.8.35 to satisfy Nox.sol pragma)

## Mikuu Integration Points (when adapting frontend)

Mikuu is at `/home/mateo/mikuu` — DO NOT MODIFY. Copy relevant files:

| Mikuu File | Purpose for ORCA |
|-------------|-----------------|
| `frontend/src/lib/terminal/` | Terminal UI state machine (commandParser, commandFlow, stepFlow, useTerminalController) |
| `frontend/src/lib/wallet.ts` | Wallet lifecycle — adapt to use Nox JS SDK for encryptInput/decrypt |
| `frontend/src/components/` | Terminal, AppShell, views |
| `frontend/src/lib/tempoChain.ts` | Replace with Sepolia chain + NoxCompute config |
| `api/` | FastAPI backend — add `/api/relay/submit` endpoint for gasless tx submission |

## Environment (`.env`)

```
PRIVATE_KEY=<relayer wallet private key (has Sepolia ETH from faucet)>
SEPOLIA_RPC=https://rpc.sepolia.org
```

## Build & Deploy

```bash
# Compile contracts
npx hardhat compile

# Deploy to Sepolia (requires Ignition module — not yet written)
npx hardhat ignition deploy ignition/modules/ConfidentialToken.ts --network sepolia

# Frontend dev
npm run dev
```

## TODO (next steps)

- [x] Fix solc version (need >=0.8.35 for Nox.sol, currently set to 0.8.27 — update hardhat.config.ts)
- [x] Write Ignition deployment module at `ignition/modules/ConfidentialToken.ts`
- [ ] Compile and fix any Solidity errors (NOTE: `ConfidentialToken.sol` is missing `relayedWriteCheque`, `relayedClaimCheque`, and `isUserInitialized` which the frontend/backend expect)
- [ ] Deploy to Sepolia
- [x] Adapt Mikuu frontend terminal UI (Fully ported to `src/lib/terminal` and `src/components/Terminal.tsx`)
- [x] Set up Nox JS SDK in frontend (`src/lib/noxSdk.ts` is fully implemented)
- [ ] Finalize FastAPI backend for relayer endpoint (Backend exists, needs the new contract ABI/address)
- [ ] Write `feedback.md` for hackathon
- [ ] Record demo video (4 min max)
- [ ] Post on X tagging @iEx_ec
