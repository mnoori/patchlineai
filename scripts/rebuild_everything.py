#!/usr/bin/env python3
"""
Master orchestrator script that rebuilds everything from scratch.
Runs the Lambda deployment and then agent creation/collaboration setup.
"""

import subprocess
import sys
import time
from pathlib import Path
from datetime import datetime
import os

def print_separator():
    """Print a separator line"""
    print("=" * 60)

def run_script(name, command, description):
    """Run a script and capture its output"""
    print_separator()
    print(f"[ORCHESTRATOR] Running: {description}")
    print(f"[ORCHESTRATOR] Command: {command}")
    print_separator()
    
    start_time = time.time()
    
    try:
        # Run with real-time output (no capture_output=True)
        result = subprocess.run(
            command,
            shell=True,
            text=True,
            encoding='utf-8' if sys.platform != 'win32' else 'cp1252',
            errors='replace'
        )
        
        duration = time.time() - start_time
        
        if result.returncode == 0:
            print(f"[ORCHESTRATOR] [OK] SUCCESS: {description}")
            return True
        else:
            print("!" * 60)
            print(f"[ORCHESTRATOR] [ERROR] FAILED: {description}")
            print(f"[ORCHESTRATOR] Exit code: {result.returncode}")
            print("!" * 60)
            return False
            
    except Exception as e:
        duration = time.time() - start_time
        print("!" * 60)
        print(f"[ORCHESTRATOR] [ERROR] EXCEPTION: {description}")
        print(f"[ORCHESTRATOR] Error: {str(e)}")
        print("!" * 60)
        return False

def purge_pyc(root: Path):
    """Delete all *.pyc files under project to avoid stale byte-code"""
    removed = 0
    for dirpath, _dirnames, filenames in os.walk(root):
        for fname in filenames:
            if fname.endswith('.pyc'):
                try:
                    os.remove(Path(dirpath) / fname)
                    removed += 1
                except OSError:
                    pass
    if removed:
        print(f"[CLEAN] Removed {removed} stale .pyc files")

def main():
    """Main orchestrator function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Rebuild Patchline infrastructure')
    parser.add_argument('--lambdas-only', action='store_true', 
                        help='Only rebuild Lambda functions')
    parser.add_argument('--agents-only', action='store_true', 
                        help='Only rebuild agents and collaborations')
    parser.add_argument('--agent', choices=['gmail', 'legal', 'blockchain', 'scout', 'supervisor'],
                        help='Rebuild only specific agent type')
    parser.add_argument('--yes', '-y', action='store_true',
                        help='Skip all confirmation prompts in child scripts (non-interactive)')
    args = parser.parse_args()
    
    start_time = datetime.now()
    
    print("\n" + "=" * 60)
    print("=== PATCHLINE REBUILD ORCHESTRATOR ===")
    print("=" * 60)
    print(f"Started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # always start with a fresh slate to avoid cached-bytecode surprises
    purge_pyc(Path(__file__).parent.parent)
    
    if args.lambdas_only:
        print("Mode: Lambda functions only")
    elif args.agents_only:
        print("Mode: Agents and collaborations only")
    elif args.agent:
        print(f"Mode: Single agent ({args.agent}) only")
    else:
        print("Mode: Full rebuild")
        print("This will:")
        print("  1. Recreate all Lambda functions")
        print("  2. Delete and recreate all agents")
        print("  3. Set up agent collaborations")
        print("\n[WARNING] This is a destructive operation!")
    
    # Change to project root
    project_root = Path(__file__).parent.parent
    
    # Track successes and failures
    steps = []
    
    # Step 1: Lambda Functions (unless agents-only)
    if not args.agents_only:
        lambda_script = project_root / "backend" / "scripts" / "manage-lambda-functions.py"
        if lambda_script.exists():
            lambda_cmd = f"python {lambda_script} --recreate"
            if args.agent:
                lambda_cmd += f" --agent={args.agent}"
            else:
                lambda_cmd += " --agent=all"
            
            success = run_script(
                "Lambda Functions",
                lambda_cmd,
                "Lambda Functions Recreation"
            )
            if not success:
                print_separator()
                print("[ORCHESTRATOR] Aborting because Lambda step failed. Fix it and rerun.")
                return 1
            steps.append(("Lambda Functions", success))
        else:
            print(f"[ORCHESTRATOR] [ERROR] Lambda script not found: {lambda_script}")
            steps.append(("Lambda Functions", False))
    
    # Step 2: Agents and Collaborations (unless lambdas-only)
    if not args.lambdas_only:
        agents_script = project_root / "scripts" / "rebuild_agents.py"
        if agents_script.exists():
            agents_cmd = f"python {agents_script}"
            if args.yes:
                agents_cmd += " --yes"
            if args.agent:
                agents_cmd += f" --agent={args.agent}"
            
            success = run_script(
                "Agents And Collaborations",
                agents_cmd,
                "Agents Creation and Collaboration Setup"
            )
            steps.append(("Agents And Collaborations", success))
        else:
            print(f"[ORCHESTRATOR] [ERROR] Agents script not found: {agents_script}")
            steps.append(("Agents And Collaborations", False))
    
    # Final Summary
    print_separator()
    print("=== ORCHESTRATOR FINAL STATUS ===")
    print_separator()
    
    # Calculate total duration
    end_time = datetime.now()
    duration = end_time - start_time
    minutes = int(duration.total_seconds() // 60)
    seconds = int(duration.total_seconds() % 60)
    
    successful = [name for name, success in steps if success]
    failed = [name for name, success in steps if not success]
    
    if not failed:
        print("[OK] REBUILD COMPLETE!")
        print(f"[OK] All {len(successful)} steps completed successfully:")
        for name in successful:
            print(f"   - {name}")
        print(f"\n[TIME] Total duration: {minutes} minutes {seconds} seconds")
        print("\n[OK] Next steps:")
        print("   - Test the supervisor agent with a multi-agent query")
        print("   - Verify agent routing is working correctly")
        print("   - Check CloudWatch logs if any issues occur")
        return 0
    else:
        print("[ERROR] REBUILD INCOMPLETE!")
        if successful:
            print(f"[OK] SUCCESSFUL STEPS ({len(successful)}):")
            for name in successful:
                print(f"   - {name}")
        print(f"[ERROR] FAILED STEPS ({len(failed)}):")
        for name in failed:
            print(f"   - {name}")
        print(f"\n[TIME] Total duration: {minutes} minutes {seconds} seconds")
        print("\n[WARNING] NEXT ACTIONS:")
        print("   - Check the error messages above")
        print("   - Fix any configuration or permission issues")
        print("   - Re-run this script or individual failed scripts")
        print("\n[TIP] You can re-run individual scripts to fix specific issues:")
        print(f"   - Lambda functions: python {lambda_script} --recreate --agent=all")
        print(f"   - Agents: python {agents_script}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
