"""
Vercel Serverless Function Entry Point for PYQVerse FastAPI Backend.

Directly exports the authoritative FastAPI application instance to Vercel's
Python runtime (@vercel/python), compliant with the standard ASGI contract.
"""

import sys
from pathlib import Path

# Resolve path to backend directory
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

for p in [str(BACKEND_DIR), str(ROOT_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.main import app
