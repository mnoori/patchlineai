# Agent Collaboration Structure

## Overview

The Patchline multi-agent system uses a clean, organized structure for managing agent prompts and collaboration instructions.

## File Organization

### Agent Prompts
Agent prompts are stored in the `prompts/` directory:
- `prompts/gmail-agent.md` - Gmail agent main instructions
- `prompts/legal-agent.md` - Legal agent main instructions
- `prompts/blockchain-agent.md` - Blockchain agent main instructions
- `prompts/scout-agent.md` - Scout agent main instructions
- `prompts/supervisor-agent.md` - Supervisor agent main instructions

### Collaboration Instructions
Collaboration instructions (used when supervisor delegates to specialist agents) are also stored in the `prompts/` directory:
- `prompts/gmail-collaboration-instructions.md` - Instructions for Gmail collaboration
- `prompts/legal-collaboration-instructions.md` - Instructions for Legal collaboration
- `prompts/blockchain-collaboration-instructions.md` - Instructions for Blockchain collaboration
- `prompts/scout-collaboration-instructions.md` - Instructions for Scout collaboration

## Key Scripts

### Active Scripts
- `scripts/rebuild_agents.py` - Main script to rebuild all agents and set up collaborations
- `scripts/rebuild_everything.py` - Orchestrator that runs the complete rebuild pipeline
- `backend/scripts/create-bedrock-agent.py` - Creates individual Bedrock agents
- `backend/scripts/manage-lambda-functions.py` - Manages Lambda function deployments

### Legacy Scripts (Moved to `legacy/scripts/`)
These scripts have been moved to reduce confusion:
- `manage-agent-collaborations.py` - Redundant collaboration manager
- `setup-agent-collaboration.py` - Old collaboration setup script
- `add-collaborator.py` - Old script for adding individual collaborators

## How It Works

1. **Agent Creation**: The `rebuild_agents.py` script creates agents in a specific order:
   - Child agents (gmail, legal, blockchain, scout) are created first
   - Supervisor agent is created last
   
2. **Collaboration Setup**: 
   - Collaboration instructions are loaded from MD files in `prompts/`
   - The supervisor agent is configured with collaboration mode enabled
   - Each specialist agent is associated as a collaborator with its specific instructions

3. **Instruction Loading**:
   ```python
   def load_collaboration_instructions(agent_type: str) -> str:
       instruction_file = PROJECT_ROOT / 'prompts' / f'{agent_type}-collaboration-instructions.md'
       if instruction_file.exists():
           return instruction_file.read_text(encoding='utf-8').strip()
       else:
           return f"Delegate {agent_type}-related tasks to this agent."
   ```

## Benefits

1. **Consistency**: All instructions are in markdown files in one location
2. **Maintainability**: Easy to update collaboration instructions without modifying code
3. **Clarity**: Clear separation between agent prompts and collaboration instructions
4. **Reduced Confusion**: Legacy scripts moved to avoid multiple conflicting implementations 