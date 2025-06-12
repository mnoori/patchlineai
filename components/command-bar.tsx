"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  LayoutDashboard,
  Music2,
  Calendar,
  Search,
  FileText,
  Database,
  Users,
  BarChart2,
  Settings,
  HelpCircle,
  Zap,
  Store,
  Plus,
  Mail,
  MessageSquare,
} from "lucide-react"

export function CommandBar() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/catalog"))}>
            <Music2 className="mr-2 h-4 w-4" />
            <span>Catalog</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/releases"))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Releases</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/insights"))}>
            <BarChart2 className="mr-2 h-4 w-4" />
            <span>Insights</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Agents">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/agents/scout"))}>
            <Search className="mr-2 h-4 w-4" />
            <span>Scout Agent</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/agents/legal"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Legal Agent</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/agents/metadata"))}>
            <Database className="mr-2 h-4 w-4" />
            <span>Metadata Agent</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/agents/fan"))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Fan Agent</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/agents/marketplace"))}>
            <Store className="mr-2 h-4 w-4" />
            <span>Marketplace</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => console.log("Create new release"))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Create New Release</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => console.log("Compose email"))}>
            <Mail className="mr-2 h-4 w-4" />
            <span>Compose Email</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => console.log("Chat with Aria"))}>
            <MessageSquare className="mr-2 h-4 w-4" />
                            <span>Chat with Aria</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => console.log("Run agent task"))}>
            <Zap className="mr-2 h-4 w-4" />
            <span>Run Agent Task</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/help"))}>
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help & Support</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
