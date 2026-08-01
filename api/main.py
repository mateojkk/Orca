"""
main.py — ORCA Relayer & Database API
FastAPI server providing gasless transaction relaying and user/invite database management.
"""
import asyncio
from typing import Annotated, Optional
from fastapi import FastAPI, HTTPException, Depends, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from web3 import Web3
import uvicorn

from relayer import (
    submit_relayed_transfer,
    submit_relayed_withdraw,
    submit_write_cheque,
    submit_claim_cheque,
    get_tx_status,
    fund_user_if_needed,
    w3,
)
from database import (
    init_db,
    register_user,
    get_user_by_address,
    get_contacts,
    add_contact,
    delete_contact,
    get_user_preferences,
    update_user_preferences,
    get_transactions,
    insert_transaction,
)

app = FastAPI(title="ORCA Relayer & API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


def get_web3() -> Web3:
    return w3


Web3Dep = Annotated[Web3, Depends(get_web3)]


class RelayRequest(BaseModel):
    model_config = {"populate_by_name": True}
    from_addr: str = Field(..., alias="from")
    to: str
    handle: str
    proof: str


class RelayWithdrawRequest(BaseModel):
    model_config = {"populate_by_name": True}
    from_addr: str = Field(..., alias="from")
    to: str
    handle: str
    proof: str
    plaintextAmount: str


class ChequeWriteRequest(BaseModel):
    model_config = {"populate_by_name": True}
    from_addr: str = Field(..., alias="from")
    chequeId: str
    handle: str
    proof: str


class ChequeClaimRequest(BaseModel):
    to: str
    signature: str

class FundRequest(BaseModel):
    address: str


class UserRegisterRequest(BaseModel):
    privy_id: str
    email: str
    username: str
    address: str


class ContactRequest(BaseModel):
    name: str
    walletAddress: str

class UserPreferencesRequest(BaseModel):
    balance_visible: bool


@app.get("/health")
def health():
    return {"status": "ok", "service": "orca-relayer-api"}


@app.post("/api/users/register")
def api_register_user(body: UserRegisterRequest):
    register_user(body.privy_id, body.email, body.username, body.address)
    return {"status": "success", "username": body.username}


@app.get("/api/users/{address}")
def api_get_user(address: str):
    user = get_user_by_address(address)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def require_wallet_owner(x_wallet_address: Optional[str] = Header(default=None)) -> str:
    if not x_wallet_address or not w3.is_address(x_wallet_address):
        raise HTTPException(status_code=400, detail="Missing or invalid X-Wallet-Address")
    return x_wallet_address

@app.get("/api/preferences")
def api_get_preferences(owner: Annotated[str, Depends(require_wallet_owner)]):
    return get_user_preferences(owner)

@app.post("/api/preferences")
def api_update_preferences(body: UserPreferencesRequest, owner: Annotated[str, Depends(require_wallet_owner)]):
    return update_user_preferences(owner, body.balance_visible)


@app.get("/api/transactions")
def api_get_transactions(owner: Annotated[str, Depends(require_wallet_owner)]):
    return get_transactions(owner)


@app.get("/contacts")
def api_get_contacts(owner: Annotated[str, Depends(require_wallet_owner)]):
    return get_contacts(owner)


@app.post("/contacts")
def api_add_contact(body: ContactRequest, owner: Annotated[str, Depends(require_wallet_owner)]):
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Contact name is required")
    if not w3.is_address(body.walletAddress):
        raise HTTPException(status_code=400, detail="Invalid contact address")
    return add_contact(owner, body.name.strip().lower(), body.walletAddress)


@app.delete("/contacts/{contact_id}", status_code=204)
def api_delete_contact(contact_id: int, owner: Annotated[str, Depends(require_wallet_owner)]):
    if not delete_contact(owner, contact_id):
        raise HTTPException(status_code=404, detail="Contact not found")
    return Response(status_code=204)


@app.post("/api/relay/submit")
async def relay_submit(body: RelayRequest, web3: Web3Dep):
    if not web3.is_address(body.from_addr) or not web3.is_address(body.to):
        raise HTTPException(status_code=400, detail="Invalid Ethereum address")
    if not body.handle.startswith("0x") or len(body.handle) != 66:
        raise HTTPException(status_code=400, detail="Invalid handle format")

    try:
        loop = asyncio.get_running_loop()
        tx_hash = await loop.run_in_executor(
            None, submit_relayed_transfer, body.from_addr, body.to, body.handle, body.proof
        )
        insert_transaction(tx_hash, body.from_addr, body.to, "transfer", body.handle)
        return {"txHash": tx_hash, "status": "submitted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"relay failed: {str(e)}")


@app.post("/api/relay/withdraw")
async def relay_withdraw(body: RelayWithdrawRequest, web3: Web3Dep):
    if not web3.is_address(body.from_addr) or not web3.is_address(body.to):
        raise HTTPException(status_code=400, detail="Invalid Ethereum address")
    if not body.handle.startswith("0x") or len(body.handle) != 66:
        raise HTTPException(status_code=400, detail="Invalid handle format")
    try:
        amount = int(body.plaintextAmount)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid plaintextAmount")

    try:
        loop = asyncio.get_running_loop()
        tx_hash = await loop.run_in_executor(
            None, submit_relayed_withdraw, body.from_addr, body.to, body.handle, body.proof, amount
        )
        insert_transaction(tx_hash, body.from_addr, body.to, "withdraw", body.handle)
        return {"txHash": tx_hash, "status": "submitted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"relay failed: {str(e)}")


@app.post("/api/relay/cheque/write")
async def relay_cheque_write(body: ChequeWriteRequest, web3: Web3Dep):
    if not web3.is_address(body.from_addr):
        raise HTTPException(status_code=400, detail="Invalid address")
    try:
        loop = asyncio.get_running_loop()
        tx_hash = await loop.run_in_executor(
            None, submit_write_cheque, body.from_addr, body.chequeId, body.handle, body.proof
        )
        insert_transaction(tx_hash, body.from_addr, body.chequeId, "cheque_write", body.handle)
        return {"txHash": tx_hash, "status": "submitted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"relay failed: {str(e)}")


@app.post("/api/relay/cheque/claim")
async def relay_cheque_claim(body: ChequeClaimRequest, web3: Web3Dep):
    if not web3.is_address(body.to):
        raise HTTPException(status_code=400, detail="Invalid target address")
    try:
        loop = asyncio.get_running_loop()
        tx_hash = await loop.run_in_executor(
            None, submit_claim_cheque, body.to, body.signature
        )
        insert_transaction(tx_hash, "claim", body.to, "cheque_claim")
        return {"txHash": tx_hash, "status": "submitted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"relay failed: {str(e)}")


@app.post("/api/relay/fund")
async def relay_fund(body: FundRequest, web3: Web3Dep):
    if not web3.is_address(body.address):
        raise HTTPException(status_code=400, detail="Invalid address")
    try:
        loop = asyncio.get_running_loop()
        res = await loop.run_in_executor(
            None, fund_user_if_needed, body.address
        )
        return {"status": "success", "result": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"relay fund failed: {str(e)}")


@app.get("/api/relay/status/{tx_hash}")
def relay_status(tx_hash: str):
    return get_tx_status(tx_hash)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
