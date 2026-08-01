"""
api/index.py — Vercel serverless entry point for ORCA backend.

Vercel auto-routes every .py file in api/ as a separate serverless function.
This is the ONLY .py file in api/; all business logic lives in backend/.

sys.path is extended so that:
  - `from backend.main import app` resolves (project root in path)
  - Inside backend/main.py, `from relayer import ...` resolves (backend/ in path)
"""
import sys
import os

_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_backend = os.path.join(_root, "backend")

# Insert both so absolute and package-relative imports both work
sys.path.insert(0, _backend)   # backend/ → allows: from relayer import ...
sys.path.insert(0, _root)      # project root → allows: from backend.main import app

from main import app  # main.py is in backend/, which is now first in sys.path

__all__ = ["app"]
