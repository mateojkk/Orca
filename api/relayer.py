"""
relayer.py — ORCA gasless relayer logic

Loads the relayer private key from env, signs and submits
relayedTransfer() calls on behalf of users.
"""
import os
import threading
from pathlib import Path
from dotenv import load_dotenv
from web3 import Web3
from eth_account import Account

# Load from project root .env
ROOT_ENV = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ROOT_ENV)

PRIVATE_KEY   = os.getenv("PRIVATE_KEY", "")
SEPOLIA_RPC   = os.getenv("SEPOLIA_RPC", "https://rpc.sepolia.org")
CONTRACT_ADDR = os.getenv("CONTRACT_ADDRESS") or os.getenv("CONFIDENTIAL_TOKEN_ADDRESS", "")

if not PRIVATE_KEY:
    print("⚠️  WARNING: PRIVATE_KEY not set — relayer will not be able to sign transactions")

w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC))

if PRIVATE_KEY:
    relayer_account = Account.from_key(PRIVATE_KEY)
else:
    relayer_account = None

nonce_lock = threading.Lock()

RELAYED_TRANSFER_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "from",   "type": "address"},
            {"internalType": "address", "name": "to",     "type": "address"},
            {"internalType": "bytes32", "name": "handle", "type": "bytes32"},
            {"internalType": "bytes",   "name": "proof",  "type": "bytes"},
        ],
        "name": "relayedTransfer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "address", "name": "from",   "type": "address"},
            {"internalType": "address", "name": "chequeId", "type": "address"},
            {"internalType": "bytes32", "name": "handle", "type": "bytes32"},
            {"internalType": "bytes",   "name": "proof",  "type": "bytes"},
        ],
        "name": "relayedWriteCheque",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "address", "name": "to",     "type": "address"},
            {"internalType": "uint8",   "name": "v",      "type": "uint8"},
            {"internalType": "bytes32", "name": "r",      "type": "bytes32"},
            {"internalType": "bytes32", "name": "s",      "type": "bytes32"},
        ],
        "name": "relayedClaimCheque",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "address", "name": "from",   "type": "address"},
            {"internalType": "address", "name": "to",     "type": "address"},
            {"internalType": "bytes32", "name": "handle", "type": "bytes32"},
            {"internalType": "bytes",   "name": "proof",  "type": "bytes"},
            {"internalType": "uint256", "name": "plaintextAmount", "type": "uint256"},
        ],
        "name": "relayedWithdrawUSDC",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]


def get_contract():
    if not CONTRACT_ADDR or CONTRACT_ADDR == "0x0000000000000000000000000000000000000000":
        raise ValueError("CONTRACT_ADDRESS not set in .env")
    return w3.eth.contract(
        address=Web3.to_checksum_address(CONTRACT_ADDR),
        abi=RELAYED_TRANSFER_ABI,
    )


def submit_relayed_transfer(
    from_addr: str,
    to_addr: str,
    handle: str,
    proof: str,
) -> str:
    if not relayer_account:
        raise ValueError("Relayer private key not configured")

    contract = get_contract()
    checksum_from = Web3.to_checksum_address(from_addr)
    checksum_to   = Web3.to_checksum_address(to_addr)

    handle_hex = handle.removeprefix("0x")
    if len(handle_hex) != 64:
        raise ValueError(f"handle must be exactly 32 bytes (64 hex chars), got {len(handle_hex)}")
    handle_bytes = bytes.fromhex(handle_hex)
    proof_bytes  = bytes.fromhex(proof.removeprefix("0x"))

    with nonce_lock:
        nonce     = w3.eth.get_transaction_count(relayer_account.address, "pending")
        gas_price = w3.eth.gas_price

        txn = contract.functions.relayedTransfer(
            checksum_from,
            checksum_to,
            handle_bytes,
            proof_bytes,
        ).build_transaction({
            "chainId":  11155111,
            "from":     relayer_account.address,
            "nonce":    nonce,
            "gas":      300_000,
            "gasPrice": gas_price,
        })

        signed   = relayer_account.sign_transaction(txn)
        tx_hash  = w3.eth.send_raw_transaction(signed.raw_transaction)
        return "0x" + tx_hash.hex()


def submit_relayed_withdraw(
    from_addr: str,
    to_addr: str,
    handle: str,
    proof: str,
    plaintext_amount: int,
) -> str:
    if not relayer_account:
        raise ValueError("Relayer private key not configured")

    contract = get_contract()
    checksum_from = Web3.to_checksum_address(from_addr)
    checksum_to   = Web3.to_checksum_address(to_addr)

    handle_hex = handle.removeprefix("0x")
    if len(handle_hex) != 64:
        raise ValueError(f"handle must be exactly 32 bytes (64 hex chars), got {len(handle_hex)}")
    handle_bytes = bytes.fromhex(handle_hex)
    proof_bytes  = bytes.fromhex(proof.removeprefix("0x"))

    with nonce_lock:
        nonce     = w3.eth.get_transaction_count(relayer_account.address, "pending")
        gas_price = w3.eth.gas_price

        txn = contract.functions.relayedWithdrawUSDC(
            checksum_from,
            checksum_to,
            handle_bytes,
            proof_bytes,
            plaintext_amount,
        ).build_transaction({
            "chainId":  11155111,
            "from":     relayer_account.address,
            "nonce":    nonce,
            "gas":      300_000,
            "gasPrice": gas_price,
        })

        signed   = relayer_account.sign_transaction(txn)
        tx_hash  = w3.eth.send_raw_transaction(signed.raw_transaction)
        return "0x" + tx_hash.hex()


def submit_write_cheque(
    from_addr: str,
    cheque_id: str,
    handle: str,
    proof: str,
) -> str:
    if not relayer_account:
        raise ValueError("Relayer private key not configured")

    contract = get_contract()
    checksum_from = Web3.to_checksum_address(from_addr)
    checksum_cheque = Web3.to_checksum_address(cheque_id)

    handle_hex = handle.removeprefix("0x")
    if len(handle_hex) != 64:
        raise ValueError(f"handle must be exactly 32 bytes (64 hex chars), got {len(handle_hex)}")
    handle_bytes = bytes.fromhex(handle_hex)
    proof_bytes  = bytes.fromhex(proof.removeprefix("0x"))

    with nonce_lock:
        nonce     = w3.eth.get_transaction_count(relayer_account.address, "pending")
        gas_price = w3.eth.gas_price

        txn = contract.functions.relayedWriteCheque(
            checksum_from,
            checksum_cheque,
            handle_bytes,
            proof_bytes,
        ).build_transaction({
            "chainId":  11155111,
            "from":     relayer_account.address,
            "nonce":    nonce,
            "gas":      300_000,
            "gasPrice": gas_price,
        })

        signed   = relayer_account.sign_transaction(txn)
        tx_hash  = w3.eth.send_raw_transaction(signed.raw_transaction)
        return "0x" + tx_hash.hex()


def submit_claim_cheque(
    to_addr: str,
    signature: str,
) -> str:
    if not relayer_account:
        raise ValueError("Relayer private key not configured")

    contract = get_contract()
    checksum_to = Web3.to_checksum_address(to_addr)

    sig_hex = signature.removeprefix("0x")
    if len(sig_hex) != 130:
        raise ValueError(f"signature must be 65 bytes (130 hex chars), got {len(sig_hex)}")
    
    r = bytes.fromhex(sig_hex[0:64])
    s = bytes.fromhex(sig_hex[64:128])
    v = int(sig_hex[128:130], 16)
    if v < 27:
        v += 27

    with nonce_lock:
        nonce     = w3.eth.get_transaction_count(relayer_account.address, "pending")
        gas_price = w3.eth.gas_price

        txn = contract.functions.relayedClaimCheque(
            checksum_to,
            v,
            r,
            s,
        ).build_transaction({
            "chainId":  11155111,
            "from":     relayer_account.address,
            "nonce":    nonce,
            "gas":      200_000,
            "gasPrice": gas_price,
        })

        signed   = relayer_account.sign_transaction(txn)
        tx_hash  = w3.eth.send_raw_transaction(signed.raw_transaction)
        return "0x" + tx_hash.hex()


def fund_user_if_needed(user_address: str) -> str:
    if not relayer_account:
        raise ValueError("Relayer private key not configured")
        
    checksum_addr = Web3.to_checksum_address(user_address)
    balance = w3.eth.get_balance(checksum_addr)
    
    # If they have at least 0.003 ETH, it's enough for gas
    min_balance = w3.to_wei(0.003, 'ether')
    target_balance = w3.to_wei(0.008, 'ether')
    
    if balance >= min_balance:
        return "sufficient_balance"
        
    amount_to_send = target_balance - balance
    
    with nonce_lock:
        nonce = w3.eth.get_transaction_count(relayer_account.address, "pending")
        gas_price = w3.eth.gas_price
        
        txn = {
            "chainId": 11155111,
            "from": relayer_account.address,
            "to": checksum_addr,
            "value": amount_to_send,
            "nonce": nonce,
            "gas": 21000,
            "gasPrice": gas_price
        }
        signed = relayer_account.sign_transaction(txn)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        
        # We don't necessarily want to block the thread forever, but waiting for receipt 
        # ensures they actually have the gas before they try to do a transaction on the frontend.
        # We wait up to 120 seconds.
        try:
            w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        except Exception:
            pass # Return tx hash anyway if it timeouts, they might retry.
            
        return "0x" + tx_hash.hex()


def get_tx_status(tx_hash: str) -> dict:
    """Check if a transaction has been mined."""
    try:
        receipt = w3.eth.get_transaction_receipt(tx_hash)
        if receipt is None:
            return {"status": "pending", "txHash": tx_hash}
        
        if receipt.status == 1:
            status_str = "success"
        else:
            status_str = "failed"

        return {
            "status": status_str,
            "txHash": tx_hash,
            "blockNumber": receipt.blockNumber,
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "txHash": tx_hash}
