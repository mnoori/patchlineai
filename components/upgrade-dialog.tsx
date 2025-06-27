"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, CreditCard, Zap } from "lucide-react"
import { usePermissions, User } from "@/lib/permissions"
import { getTierConfig, getUpgradePath, UserTier } from "@/lib/tier-config"
import { toast } from "sonner"

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpgradeDialog({ open, onOpenChange }: UpgradeDialogProps) {
  const { user, setUser } = usePermissions()
  const [selectedTier, setSelectedTier] = useState<UserTier | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  if (!user) return null

  const upgradePaths = getUpgradePath(user.tier)

  const handleUpgrade = async () => {
    if (!selectedTier || !user) return

    setIsProcessing(true)
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Create updated user with new tier
    const updatedUser = {
      ...user,
      tier: selectedTier
    }
    
    // Update user in state
    setUser(updatedUser)
    
    // CRITICAL FIX: Directly update localStorage to ensure persistence
    // This bypasses any potential timing issues with Zustand's persist middleware
    try {
      // Get current store data
      const currentStore = JSON.parse(localStorage.getItem('patchline-permissions') || '{}')
      
      // Update the user data
      currentStore.state = {
        ...currentStore.state,
        user: updatedUser
      }
      
      // Save back to localStorage immediately
      localStorage.setItem('patchline-permissions', JSON.stringify(currentStore))
      
      console.log('User tier upgraded and persisted to localStorage:', selectedTier)
    } catch (error) {
      console.error('Failed to directly update localStorage:', error)
    }
    
    toast.success(`Successfully upgraded to ${getTierConfig(selectedTier).name} plan! New features are now available.`)
    
    setIsProcessing(false)
    onOpenChange(false)
    
    // Keep the user on the current page to avoid reload issues
    // Instead, we'll show success UI right here
    const settingsUrl = new URL(window.location.href)
    settingsUrl.searchParams.set('tab', 'billing')
    settingsUrl.searchParams.set('upgrade', 'success')
    
    // Use history.pushState to update URL without page reload
    window.history.pushState({}, '', settingsUrl.toString())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-cosmic-teal" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Choose a plan that fits your needs. You can change or cancel anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={selectedTier || ""} onValueChange={(value) => setSelectedTier(value as UserTier)}>
            <div className="space-y-4">
              {upgradePaths.map((tierOption) => {
                const config = getTierConfig(tierOption)
                const isEnterprise = tierOption === UserTier.ULTRA
                
                return (
                  <label
                    key={tierOption}
                    htmlFor={tierOption}
                    className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedTier === tierOption
                        ? "border-cosmic-teal bg-cosmic-teal/5"
                        : "border-border hover:border-cosmic-teal/50"
                    } ${isEnterprise ? "opacity-75" : ""}`}
                  >
                    <RadioGroupItem
                      value={tierOption}
                      id={tierOption}
                      disabled={isEnterprise}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            {config.name}
                            {config.highlighted && (
                              <Badge variant="secondary" className="text-xs">
                                Most Popular
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">{config.tagline}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {isEnterprise ? "Custom" : `$${config.price.monthly}`}
                          </p>
                          {!isEnterprise && (
                            <p className="text-sm text-muted-foreground">/month</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-1 mt-3">
                        {config.features.slice(0, 4).map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-3 w-3 text-cosmic-teal shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      {isEnterprise && (
                        <p className="mt-3 text-sm text-muted-foreground">
                          Contact our sales team for custom pricing and features
                        </p>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          </RadioGroup>

                          {selectedTier === UserTier.PRO && (
            <div className="mt-6 p-4 rounded-lg bg-cosmic-teal/10 border border-cosmic-teal/30">
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-cosmic-teal" />
                14-Day Free Trial
              </h5>
              <p className="text-sm text-muted-foreground">
                Try Roster plan free for 14 days. No credit card required. Cancel anytime.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
                          {selectedTier === UserTier.ULTRA ? (
            <Button
              onClick={() => {
                window.location.href = "/contact"
              }}
              className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
            >
              Contact Sales
            </Button>
          ) : (
            <Button
              onClick={handleUpgrade}
              disabled={!selectedTier || isProcessing}
              className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
            >
                              {isProcessing ? "Processing..." : selectedTier === UserTier.PRO ? "Start Free Trial" : "Upgrade Now"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 