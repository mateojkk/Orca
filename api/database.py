"""
database.py — ORCA Supabase Database Interface
Stores users, contacts, transactions, and user preferences in Supabase.
"""
import os
from pathlib import Path
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client

ROOT_ENV = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ROOT_ENV)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ WARNING: SUPABASE_URL or SUPABASE_SERVICE_KEY not set in .env")
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def init_db():
    print("Supabase connection initialized via Service Key (database.py).")
    # Table initialization should be done via schema.sql in the Supabase Dashboard.


# Helper functions
def get_user_by_address(address: str) -> Optional[Dict[str, Any]]:
    if not supabase: return None
    res = supabase.table("users").select("*").ilike("address", address).execute()
    return res.data[0] if res.data else None


def register_user(privy_id: str, email: str, username: str, address: str):
    if not supabase: return
    # Upsert logic based on privy_id or address. Supabase uses the primary key or unique constraints for upsert.
    # To keep it simple, we'll try to insert, and on conflict, update. 
    supabase.table("users").upsert(
        {"privy_id": privy_id, "email": email, "username": username, "address": address},
        on_conflict="address"
    ).execute()


def get_contacts(owner_address: str) -> List[Dict[str, Any]]:
    if not supabase: return []
    res = supabase.table("contacts").select("id, name, address").ilike("owner_address", owner_address).order("name").execute()
    return res.data


def add_contact(owner_address: str, name: str, address: str) -> Dict[str, Any]:
    if not supabase: return {}
    # Upsert contact (assuming unique constraint on owner_address and address)
    res = supabase.table("contacts").upsert(
        {"owner_address": owner_address, "name": name, "address": address},
        on_conflict="owner_address,address"
    ).execute()
    
    # Return the contact just like before
    fetch_res = supabase.table("contacts").select("id, name, address").ilike("owner_address", owner_address).ilike("address", address).execute()
    return fetch_res.data[0] if fetch_res.data else {}


def delete_contact(owner_address: str, contact_id: int) -> bool:
    if not supabase: return False
    res = supabase.table("contacts").delete().eq("id", contact_id).ilike("owner_address", owner_address).execute()
    return len(res.data) > 0


# User Preferences

def get_user_preferences(address: str) -> Dict[str, Any]:
    if not supabase: return {"balance_visible": True}
    res = supabase.table("user_preferences").select("*").ilike("address", address).execute()
    if res.data:
        return res.data[0]
    else:
        # Create default preferences
        default_prefs = {"address": address, "balance_visible": True}
        supabase.table("user_preferences").insert(default_prefs).execute()
        return default_prefs

def update_user_preferences(address: str, balance_visible: bool) -> Dict[str, Any]:
    if not supabase: return {}
    res = supabase.table("user_preferences").upsert(
        {"address": address, "balance_visible": balance_visible},
        on_conflict="address"
    ).execute()
    return res.data[0] if res.data else {}

# Transactions

def get_transactions(address: str) -> List[Dict[str, Any]]:
    if not supabase: return []
    # Fetch transactions where the user is either the sender or the recipient
    res = supabase.table("transactions").select("*").or_(f"from_address.ilike.{address},to_address.ilike.{address}").order("created_at", desc=True).execute()
    return res.data

def insert_transaction(tx_hash: str, from_address: str, to_address: str, type: str, handle: str = None) -> None:
    if not supabase: return
    supabase.table("transactions").insert({
        "tx_hash": tx_hash,
        "from_address": from_address,
        "to_address": to_address,
        "type": type,
        "handle": handle,
        "status": "confirmed"
    }).execute()
