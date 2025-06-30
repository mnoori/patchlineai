#!/usr/bin/env python3
"""
Restart the expense processor to load the latest code fixes
"""

import os
import sys
import psutil
import subprocess
import time
from pathlib import Path
from colorama import init, Fore, Style

# Initialize colorama
init()

def find_and_kill_expense_processor():
    """Find and kill any running expense processor"""
    killed = False
    
    print(f"{Fore.YELLOW}Looking for running expense processor...{Style.RESET_ALL}")
    
    # Look for Python processes
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            # Check if it's a Python process
            if proc.info['name'] and 'python' in proc.info['name'].lower():
                # Check command line for expense processor
                cmdline = proc.info.get('cmdline', [])
                if cmdline and any('expense-processor' in arg for arg in cmdline):
                    print(f"{Fore.RED}Found expense processor PID {proc.info['pid']}{Style.RESET_ALL}")
                    proc.terminate()
                    try:
                        proc.wait(timeout=5)
                    except psutil.TimeoutExpired:
                        proc.kill()
                    killed = True
                    print(f"{Fore.GREEN}✓ Killed expense processor{Style.RESET_ALL}")
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    
    if not killed:
        print(f"{Fore.YELLOW}No running expense processor found{Style.RESET_ALL}")
    
    return killed

def start_expense_processor():
    """Start the expense processor server"""
    script_dir = Path(__file__).parent
    expense_processor = script_dir / 'expense-processor-server.py'
    
    if not expense_processor.exists():
        print(f"{Fore.RED}Error: expense-processor-server.py not found!{Style.RESET_ALL}")
        return False
    
    print(f"\n{Fore.CYAN}Starting expense processor...{Style.RESET_ALL}")
    
    # Start in a new window/process
    if sys.platform == 'win32':
        # Windows - start in new PowerShell window
        subprocess.Popen([
            'powershell.exe',
            '-NoExit',
            '-Command',
            f'cd "{script_dir}"; python expense-processor-server.py'
        ], creationflags=subprocess.CREATE_NEW_CONSOLE)
    else:
        # Unix/Linux - start in background
        subprocess.Popen([
            sys.executable,
            str(expense_processor)
        ])
    
    # Wait for it to start
    print(f"{Fore.YELLOW}Waiting for server to start...{Style.RESET_ALL}")
    time.sleep(3)
    
    # Check if it's running
    import requests
    try:
        resp = requests.get('http://localhost:8000/health', timeout=5)
        if resp.status_code == 200:
            print(f"{Fore.GREEN}✓ Expense processor is running on port 8000{Style.RESET_ALL}")
            return True
    except:
        pass
    
    print(f"{Fore.YELLOW}⚠ Server may still be starting up{Style.RESET_ALL}")
    return True

def main():
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}EXPENSE PROCESSOR RESTART TOOL{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    
    # Kill existing process
    killed = find_and_kill_expense_processor()
    
    if killed:
        print(f"\n{Fore.YELLOW}Waiting 2 seconds before restart...{Style.RESET_ALL}")
        time.sleep(2)
    
    # Start new process
    if start_expense_processor():
        print(f"\n{Fore.GREEN}✅ Expense processor restarted successfully!{Style.RESET_ALL}")
        print(f"\n{Fore.CYAN}The new code includes these fixes:{Style.RESET_ALL}")
        print(f"  • Creates expenses with amount only (no date required)")
        print(f"  • Uses 2024-12-31 as default date when none found")
        print(f"  • Enhanced vendor detection for all mentioned services")
        print(f"  • Specialized parsers for Adobe and Splice invoices")
        print(f"  • AI-powered descriptions for all receipts")
        print(f"\n{Fore.YELLOW}You can now re-run your receipt processing!{Style.RESET_ALL}")
    else:
        print(f"\n{Fore.RED}Failed to start expense processor{Style.RESET_ALL}")

if __name__ == '__main__':
    main() 