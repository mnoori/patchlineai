# Agent Configuration System

## Overview

The agent configuration system provides a centralized way to manage agent metadata, branding, and behavior across the entire Patchline platform. This eliminates hard-coded agent names and ensures consistent branding.

## Architecture

### Core Files

- **`config/agents.ts`** - Central configuration for all agents
- **`lib/agent-utils.ts`** - Helper functions for accessing agent data
- **`__tests__/no-patchy-references.test.ts`** - CI test to prevent brand regressions

### Configuration Structure

```typescript
// config/agents.ts
export type AgentKey = "aria" | "scout" | "legal" | "growth"

export interface AgentConfig {
  key: AgentKey
  displayName: string
  gradientClass: string       // Tailwind gradient for consistent branding
  avatarUrl?: string          // Optional avatar image
  model?: string              // Default LLM model
}

export const AGENTS: Record<AgentKey, AgentConfig> = {
  aria: {
    key: "aria",
    displayName: "Aria",
    gradientClass: "bg-gradient-to-r from-purple-400 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent",
    avatarUrl: "/avatars/aria.png",
    model: "gpt-4o",
  },
  // ... other agents
}
```

## Usage

### Frontend Components

```typescript
import { agentName, agentGradient } from "@/lib/agent-utils"

// Display agent name with gradient
<span className={agentGradient()}>{agentName()}</span>

// Use specific agent
<span className={agentGradient("scout")}>{agentName("scout")}</span>
```

### Backend Prompts

For backend prompts and instructions, use template placeholders:

```markdown
# Example: backend/scripts/gmail-agent-instructions.md
You are {{agentName}}, an AI assistant that helps music industry professionals...
```

Then render the template:

```typescript
import { renderPrompt } from "@/lib/agent-utils"

const rawPrompt = fs.readFileSync("instructions.md", "utf8")
const prompt = renderPrompt(rawPrompt, "aria") // Replaces {{agentName}} with "Aria"
```

## Helper Functions

### `agentName(key?: AgentKey): string`
Returns the display name for an agent. Defaults to "Aria" if no key provided.

### `agentGradient(key?: AgentKey): string`
Returns the Tailwind gradient class for an agent. Ensures consistent visual branding.

### `renderPrompt(template: string, key?: AgentKey): string`
Replaces `{{agentName}}` placeholders in templates with the actual agent name.

### `getAgent(key?: AgentKey): AgentConfig`
Returns the full configuration object for an agent.

## Adding New Agents

1. **Update the type definition:**
```typescript
export type AgentKey = "aria" | "scout" | "legal" | "growth" | "newAgent"
```

2. **Add the configuration:**
```typescript
export const AGENTS: Record<AgentKey, AgentConfig> = {
  // ... existing agents
  newAgent: {
    key: "newAgent",
    displayName: "New Agent",
    gradientClass: "bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent",
    model: "claude-3-sonnet",
  },
}
```

3. **Use in components:**
```typescript
<span className={agentGradient("newAgent")}>{agentName("newAgent")}</span>
```

## Brand Guidelines

### Color Usage
- **Primary Agent (Aria):** Purple-to-pink gradient
- **Scout Agent:** Cyan-to-blue gradient  
- **Legal Agent:** Emerald-to-lime gradient
- **Growth Agent:** Amber-to-red gradient

### Consistency Rules
1. Never hard-code agent names in UI components
2. Always use `agentGradient()` for agent name styling
3. Use template placeholders (`{{agentName}}`) in backend prompts
4. Test changes with the brand consistency CI test

## Migration from Hard-coded Names

### Before (❌)
```typescript
<span className="text-amber-400">Patchy</span>
```

### After (✅)
```typescript
<span className={agentGradient()}>{agentName()}</span>
```

### Backend Prompts Before (❌)
```markdown
You are Patchy, an AI assistant...
```

### Backend Prompts After (✅)
```markdown
You are {{agentName}}, an AI assistant...
```

## CI/CD Integration

The system includes automated tests to prevent brand regressions:

```bash
# Run brand consistency tests
npm test -- no-patchy-references.test.ts
```

This test will fail if:
- Any "Patchy" references are found in source code
- Hard-coded agent names exist in backend prompts (without templates)

## Benefits

1. **Consistency:** Single source of truth for agent branding
2. **Scalability:** Easy to add new agents or rebrand existing ones
3. **Maintainability:** No hunt-and-replace when changing agent names
4. **Safety:** CI tests prevent accidental brand inconsistencies
5. **Flexibility:** Support for multiple agents with distinct branding

## Future Enhancements

- **Dynamic Agent Loading:** Load agent configs from API/database
- **A/B Testing:** Test different agent names/branding
- **Localization:** Support for multi-language agent names
- **Theme Integration:** Agent colors that adapt to light/dark themes 