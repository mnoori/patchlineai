#!/usr/bin/env python3
"""
Batch-process tax documents through existing Patchline AI pipelines.
==================================================================

This CLI utility walks the backup folder you provided and, **without any
manual drag-and-drop**, uploads each document to the correct processing
pipeline via the Next.js API.  After each file is uploaded the AI
pipeline automatically runs on the server (Textract ➜ Expense Processor ➜
DB).  Once the request returns, the data is already visible in the UI
(`Tax Preparation › Expenses / Receipts`).

Bank statements processed:
    • Bilt   →  "bilt"            document type
    • Chase Sapphire →  "chase-sapphire" document type

Skipped:
    • BofA, Chase Checking, Chase Freedom (already processed)

Receipts processed:
    •   Reciepts/Amazon   →  "amazon-receipts"   document type
    •   Every other folder inside Reciepts/  →  "gmail-receipts"

The script works sequentially (one file at a time) so you can watch
progress.  It prints a concise per-file summary and a final timing
report.

USAGE
-----
    python batch-process-tax-docs.py        # normal run
    python batch-process-tax-docs.py --dry  # list files & pipelines only
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from typing import List, Tuple

import requests

# ────────────────────────────────────────────────────────────────────────────────
# Configuration – adjust if your paths or ports differ
# ────────────────────────────────────────────────────────────────────────────────
BACKUP_DIR   = Path(r"C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy")
API_BASE_URL = "http://localhost:3000/api"
UPLOAD_URL   = f"{API_BASE_URL}/upload"
USER_ID      = "default-user"

BANK_MAP = {
    "Bilt": {
        "folder": BACKUP_DIR / "Bank Statement" / "Bilt",
        "doc_type": "bilt",
    },
    "Chase Sapphire": {
        "folder": BACKUP_DIR / "Bank Statement" / "Chase Saphire",  # folder name spelling in backup
        "doc_type": "chase-sapphire",
    },
}

RECEIPTS_DIR = BACKUP_DIR / "Reciepts"   # note: source spelling
AMAZON_DIR   = RECEIPTS_DIR / "Amazon"

# colour helper
class C:
    G = "\033[92m"   # green
    Y = "\033[93m"   # yellow
    R = "\033[91m"   # red
    B = "\033[94m"   # blue
    C = "\033[96m"   # cyan
    O = "\033[95m"   # magenta
    X = "\033[0m"    # reset

# ────────────────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────────────────

def upload_pdf(path: Path, doc_type: str, session: requests.Session) -> Tuple[bool, dict]:
    """Full 3-step upload + process.  Returns (success, response-json)"""

    # 1️⃣  Request a pre-signed S3 URL from the Next.js API
    with open(path, 'rb') as fh:
        file_bytes = fh.read()

    files = {
        "file": (path.name, file_bytes, "application/pdf"),
    }
    form = {
        "bankType": doc_type,
        "userId": USER_ID,
    }
    try:
        resp = session.post(f"{API_BASE_URL}/documents/upload", files=files, data=form, timeout=60)
    except Exception as e:
        return False, {"error": f"upload-request failed: {e}"}

    if resp.status_code != 200:
        return False, {"error": f"upload-request HTTP {resp.status_code}"}

    ul_data = resp.json()
    upload_url  = ul_data.get('uploadUrl')
    s3_key      = ul_data.get('s3Key')
    document_id = ul_data.get('documentId')

    if not all([upload_url, s3_key, document_id]):
        return False, {"error": "incomplete uploadUrl response"}

    # 2️⃣  PUT the file bytes to S3 via the presigned URL
    try:
        put_resp = session.put(upload_url, data=file_bytes, headers={"Content-Type": "application/pdf"}, timeout=120)
        if put_resp.status_code not in (200, 204):
            return False, {"error": f"S3 PUT failed {put_resp.status_code}"}
    except Exception as e:
        return False, {"error": f"S3 PUT error: {e}"}

    # 3️⃣  Tell backend to start Textract / expense processing
    payload = {
        "s3Key": s3_key,
        "documentId": document_id,
        "filename": path.name,
        "userId": USER_ID,
        "documentType": doc_type,
    }
    try:
        proc_resp = session.post(f"{API_BASE_URL}/documents/process", json=payload, timeout=300)
    except Exception as e:
        return False, {"error": f"/documents/process error: {e}"}

    success = proc_resp.status_code == 200
    return success, (proc_resp.json() if success else {"error": f"process HTTP {proc_resp.status_code}"})


def enumerate_pdfs(folder: Path) -> List[Path]:
    if not folder.exists():
        return []
    return sorted(p for p in folder.glob("*.pdf"))


def print_expenses(expenses: list[dict]):
    for idx, e in enumerate(expenses, 1):
        amount = f"${e.get('amount', 0):.2f}"
        vendor = e.get("vendor", "Unknown")
        desc   = e.get("description", "")
        if len(desc) > 80:
            desc = desc[:77] + "…"
        print(f"      {C.G}•{C.X} {amount}  {vendor}\n        {desc}")

# ────────────────────────────────────────────────────────────────────────────────
# Main processing logic
# ────────────────────────────────────────────────────────────────────────────────

def process_group(name: str, pdfs: List[Path], doc_type: str, session: requests.Session, dry: bool) -> Tuple[int,int,float]:
    """Process a list of pdf files. Returns (#success, #total, seconds)"""
    total   = len(pdfs)
    success = 0
    start   = time.perf_counter()

    if total == 0:
        print(f"{C.Y}⚠ No PDFs in {name}{C.X}")
        return 0, 0, 0.0

    for i, pdf_path in enumerate(pdfs, 1):
        print(f"{C.C}\n[{i}/{total}] {pdf_path.name} → {doc_type}{C.X}")
        if dry:
            continue
        t0 = time.perf_counter()
        ok, resp_json = upload_pdf(pdf_path, doc_type, session)
        dt = time.perf_counter() - t0
        if ok:
            success += 1
            # /documents/process returns { success, extractedData, ... }
            if resp_json.get("success"):
                count = resp_json.get("extractedData", {}).get("amount", None)
                print(f"   {C.G}✓ Uploaded & processing started in {dt:.1f}s{C.X}")
            else:
                print(f"   {C.Y}⚠ Processing response: {resp_json}{C.X}")
        else:
            print(f"   {C.R}✗ Upload failed (status {resp_json.get('status', 'unknown')}){C.X}")
        # small pause so server isn't hammered
        if i < total and not dry:
            time.sleep(2)

    elapsed = time.perf_counter() - start
    return success, total, elapsed


def main():
    parser = argparse.ArgumentParser(description="CLI batch processor for Patchline AI tax documents")
    parser.add_argument("--dry", action="store_true", help="dry-run: list what would be processed without uploading")
    args = parser.parse_args()
    dry = args.dry

    print(f"{C.B}\nPatchline AI – CLI Batch Tax Processor{C.X}")
    print("Backup directory:", BACKUP_DIR)
    if dry:
        print(f"{C.Y}DRY-RUN — no files will be uploaded{C.X}")

    session = requests.Session()

    grand_total = grand_success = 0
    grand_start = time.perf_counter()

    # ─── Bank statements ────────────────────────────────────────────────────
    print(f"{C.B}\n—— BANK STATEMENTS ——{C.X}")
    for label, cfg in BANK_MAP.items():
        pdfs = enumerate_pdfs(cfg["folder"])
        succ, tot, elapsed = process_group(label, pdfs, cfg["doc_type"], session, dry)
        grand_success += succ
        grand_total   += tot

    # ─── Receipts ───────────────────────────────────────────────────────────
    print(f"{C.B}\n—— RECEIPTS ——{C.X}")
    # Amazon first
    amazon_pdfs = enumerate_pdfs(AMAZON_DIR)
    s,t,e = process_group("Amazon", amazon_pdfs, "amazon-receipts", session, dry)
    grand_success += s; grand_total += t
    # other folders
    for sub in RECEIPTS_DIR.iterdir():
        if not sub.is_dir() or sub.name == "Amazon":
            continue
        other_pdfs = enumerate_pdfs(sub)
        s,t,e = process_group(sub.name, other_pdfs, "gmail-receipts", session, dry)
        grand_success += s; grand_total += t

    # Summary
    elapsed_all = time.perf_counter() - grand_start
    print(f"{C.B}\n—— SUMMARY ——{C.X}")
    print(f"Processed {grand_success}/{grand_total} files in {elapsed_all:.1f}s")
    if not dry:
        print(f"Data is now visible in the UI → Tax Preparation tab (Expenses / Receipts).")

if __name__ == "__main__":
    main() 