'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Settings, Save, RefreshCw, AlertCircle } from 'lucide-react'

interface AgentSettingsProps {
  agentType: 'scout' | 'legal' | 'metadata' | 'fan'
  onSave?: (settings: any) => void
}

export function AgentSettings({ agentType, onSave }: AgentSettingsProps) {
  const [settings, setSettings] = useState({
    enabled: true,
    frequency: 'daily',
    notifications: true,
    autoMode: false,
    customPrompt: '',
    priority: 'medium'
  })

  const handleSave = () => {
    onSave?.(settings)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent Settings
        </CardTitle>
        <CardDescription>
          Configure your {agentType} agent preferences and behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Agent</Label>
            <p className="text-sm text-muted-foreground">
              Turn the {agentType} agent on or off
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => setSettings({ ...settings, enabled })}
          />
        </div>

        <div className="space-y-2">
          <Label>Update Frequency</Label>
          <Select
            value={settings.frequency}
            onValueChange={(frequency) => setSettings({ ...settings, frequency })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="realtime">Real-time</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications for important updates
            </p>
          </div>
          <Switch
            checked={settings.notifications}
            onCheckedChange={(notifications) => setSettings({ ...settings, notifications })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Auto Mode</Label>
            <p className="text-sm text-muted-foreground">
              Let the agent work automatically without manual approval
            </p>
          </div>
          <Switch
            checked={settings.autoMode}
            onCheckedChange={(autoMode) => setSettings({ ...settings, autoMode })}
          />
        </div>

        <div className="space-y-2">
          <Label>Priority Level</Label>
          <Select
            value={settings.priority}
            onValueChange={(priority) => setSettings({ ...settings, priority })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Custom Instructions</Label>
          <Textarea
            placeholder="Enter any custom instructions for the agent..."
            value={settings.customPrompt}
            onChange={(e) => setSettings({ ...settings, customPrompt: e.target.value })}
            rows={4}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset to Default
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
