#!/usr/bin/env python3
"""
Master Orchestrator for Rebuilding the Entire Patchline Infrastructure.

This script provides a single, non-interactive entry point to:
1. Recreate all Lambda functions to prevent update conflicts.
2. Cleanly delete and recreate all Bedrock agents.
3. Automatically configure all agent collaborations.
"""
import subprocess
import sys
import argparse
from pathlib import Path

def run_script(command, cwd):
    """Executes a script and handles its output and errors."""
    print(f"\n{'='*60}\n[ORCHESTRATOR] Running: {' '.join(command)}\n{'='*60}")
    try:
        process = subprocess.run(
            command,
            cwd=cwd,
            check=True,
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        print(process.stdout)
        print(f"\n[ORCHESTRATOR] Finished: {' '.join(command)}")
    except subprocess.CalledProcessError as e:
        print(f"\n{'!'*60}\n[FATAL ERROR] Script failed: {' '.join(command)}\n{'!'*60}")
        print("\n--- STDOUT ---")
        print(e.stdout)
        print("\n--- STDERR ---")
        print(e.stderr)
        sys.exit(e.returncode)

def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(description="Orchestrator to rebuild the Patchline agent infrastructure.")
    parser.add_argument("--yes", "-y", action="store_true", help="Run the entire rebuild process non-interactively.")
    args = parser.parse_args()

    project_root = Path(__file__).parent.parent
    if not (project_root / 'agents.yaml').exists():
        print(f"[FATAL ERROR] agents.yaml not found in project root: {project_root}")
        sys.exit(1)

    print("="*60)
    print("=== PATCHLINE INFRASTRUCTURE REBUILD ORCHESTRATOR ===")
    print("="*60)
    print("This will completely rebuild:\n  1. All Lambda Functions\n  2. All Bedrock Agents\n  3. All Agent Collaborations")
    
    if not args.yes:
        response = input("\n> Are you sure you want to proceed? (yes/no): ")
        if response.lower() != 'yes':
            print("Aborted by user.")
            sys.exit(0)

    # --- Step 1: Recreate all Lambda Functions ---
    lambda_script_path = str(project_root / 'backend' / 'scripts' / 'manage-lambda-functions.py')
    lambda_command = ['python', lambda_script_path, '--recreate', '--agent=all']
    run_script(lambda_command, project_root)

    # --- Step 2: Recreate all Agents and set up Collaborations ---
    # The agent script now handles cleanup, creation, and collaboration setup.
    agent_script_path = str(project_root / 'scripts' / 'clean-and-rebuild-agents.py')
    agent_command = ['python', agent_script_path, '--yes']
    run_script(agent_command, project_root)

    print("\n\n" + "="*60)
    print("✅✅✅ REBUILD COMPLETE! ✅✅✅")
    print("="*60)
    print("The entire Patchline agent infrastructure has been rebuilt.")
    print("Please restart your application server to use the new agent configurations.")

if __name__ == "__main__":
    main() 