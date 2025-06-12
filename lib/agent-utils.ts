import { AGENTS, AgentKey, DEFAULT_AGENT } from "@/config/agents"

export const getAgent = (key?: AgentKey) => (key ? AGENTS[key] : DEFAULT_AGENT)

export const agentName = (key?: AgentKey) => getAgent(key).displayName

export const agentGradient = (key?: AgentKey) => getAgent(key).gradientClass

/**
 * Simple mustache-like template renderer that replaces {{agentName}} with the agent's displayName.
 * Additional variables can be added later if needed.
 */
export function renderPrompt(template: string, key?: AgentKey): string {
  return template.replace(/{{\s*agentName\s*}}/g, agentName(key))
} 