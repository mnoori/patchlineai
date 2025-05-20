"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlatformConnectModal } from "@/components/platform-connect-modal"
import {
  User,
  Mail,
  Building,
  Globe,
  Shield,
  CreditCard,
  Key,
  Save,
  Upload,
  Trash2,
  Music2,
  Palette,
  Plus,
  CheckCircle2,
  Disc,
  Instagram,
  Music,
  XCircle,
} from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"

export default function SettingsPage() {
  const { userId } = useCurrentUser()

  const [darkMode, setDarkMode] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [weeklyReports, setWeeklyReports] = useState(true)
  const [releaseReminders, setReleaseReminders] = useState(true)
  const [contractAlerts, setContractAlerts] = useState(true)
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  const [connectModalPlatform, setConnectModalPlatform] = useState<"instagram" | "soundcloud" | null>(null)

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [website, setWebsite] = useState("")
  const [bio, setBio] = useState("")

  const [isDirty, setIsDirty] = useState(false)

  const [platforms, setPlatforms] = useState<any>({})
  const [loadingPlatforms, setLoadingPlatforms] = useState(false)

  useEffect(() => {
    async function loadUser() {
      if (!userId) return
      try {
        const res = await fetch(`/api/user?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          setFullName(data.fullName || "")
          setEmail(data.email || "")
          setCompany(data.company || "")
          setWebsite(data.website || "")
          setBio(data.bio || "")
        }
      } catch (e) {
        console.error("Failed to fetch user", e)
      }
    }
    loadUser()
  }, [userId])

  useEffect(() => {
    async function loadPlatforms() {
      if (!userId) return
      setLoadingPlatforms(true)
      try {
        const res = await fetch(`/api/platforms?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          setPlatforms(data.platforms || {})
        }
      } catch (e) {
        console.error("Failed to fetch platforms", e)
      } finally {
        setLoadingPlatforms(false)
      }
    }
    loadPlatforms()
  }, [userId])

  async function handleProfileSave() {
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          fullName,
          email,
          company,
          website,
          bio,
        }),
      })
      if (!res.ok) {
        console.error("Save failed")
      } else {
        setIsDirty(false)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const markDirty = () => setIsDirty(true)

  async function handlePlatformConnect(platform: string, connect: boolean) {
    if (!userId) return
    setLoadingPlatforms(true)
    try {
      const res = await fetch("/api/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, platform, connected: connect })
      })
      if (res.ok) {
        setPlatforms((prev: any) => ({ ...prev, [platform]: connect }))
      }
    } catch (e) {
      console.error("Failed to update platform connection", e)
    } finally {
      setLoadingPlatforms(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 flex flex-col items-center">
                  <Avatar className="h-32 w-32 mb-4">
                    <AvatarImage src="/music-label-owner-avatar.png" alt="Label Owner" />
                    <AvatarFallback>
                      <Disc className="h-12 w-12 text-cosmic-teal" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Upload className="h-4 w-4" /> Upload
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 text-red-500 hover:text-red-500">
                      <Trash2 className="h-4 w-4" /> Remove
                    </Button>
                  </div>
                </div>

                <div className="md:w-2/3 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="name" placeholder="John Doe" className="pl-10" value={fullName} onChange={(e) => { setFullName(e.target.value); markDirty() }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="john.doe@example.com"
                          className="pl-10"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); markDirty() }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company/Artist Name</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="company"
                          placeholder="Your company or artist name"
                          className="pl-10"
                          value={company}
                          onChange={(e) => { setCompany(e.target.value); markDirty() }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="website"
                          placeholder="https://example.com"
                          className="pl-10"
                          value={website}
                          onChange={(e) => { setWebsite(e.target.value); markDirty() }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself or your company"
                      rows={4}
                      value={bio}
                      onChange={(e) => { setBio(e.target.value); markDirty() }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  className="gap-1" 
                  variant={isDirty ? undefined : "outline"}
                  disabled={!isDirty}
                  onClick={handleProfileSave}
                >
                  <Save className="h-4 w-4" /> Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Connected Platforms</CardTitle>
              <CardDescription>Manage your connected music platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { key: "spotify", name: "Spotify", color: "bg-green-500" },
                  { key: "applemusic", name: "Apple Music", color: "bg-red-500" },
                  { key: "distrokid", name: "DistroKid", color: "bg-blue-500" },
                  { key: "instagram", name: "Instagram", color: "bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500" },
                  { key: "soundcloud", name: "SoundCloud", color: "bg-orange-500" },
                ]
                // Sort the platforms so connected ones appear at the top
                .sort((a, b) => {
                  const aConnected = platforms[a.key] || false;
                  const bConnected = platforms[b.key] || false;
                  if (aConnected && !bConnected) return -1;
                  if (!aConnected && bConnected) return 1;
                  return 0;
                })
                .map((p) => (
                  <div key={p.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${p.color}`}>
                        <Music2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {platforms[p.key] ? (
                            <span className="inline-flex items-center gap-1 text-cosmic-teal font-semibold"><CheckCircle2 className="h-4 w-4" /> Connected</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-muted-foreground"><XCircle className="h-4 w-4" /> Not connected</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {platforms[p.key] ? (
                      <Button variant="outline" size="sm" disabled={loadingPlatforms} onClick={() => handlePlatformConnect(p.key, false)}>
                        Disconnect
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="gap-1" disabled={loadingPlatforms} onClick={() => handlePlatformConnect(p.key, true)}>
                        <Plus className="h-4 w-4" /> Connect
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black gap-1">
                  <Save className="h-4 w-4" /> Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize your interface preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Enable dark mode for the interface</p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  className="data-[state=checked]:bg-cosmic-teal"
                />
              </div>

              <div className="space-y-4">
                <Label>Color Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-full rounded-md bg-cosmic-teal flex items-center justify-center border-2 border-cosmic-teal">
                      <Palette className="h-6 w-6 text-black" />
                    </div>
                    <span className="text-sm">Cosmic Teal</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-full rounded-md bg-purple-500 flex items-center justify-center">
                      <Palette className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm">Cosmic Purple</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-full rounded-md bg-pink-500 flex items-center justify-center">
                      <Palette className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm">Cosmic Pink</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black gap-1">
                  <Save className="h-4 w-4" /> Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                    className="data-[state=checked]:bg-cosmic-teal"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications in your browser</p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                    className="data-[state=checked]:bg-cosmic-teal"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Notification Types</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="weekly-reports">Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">Receive weekly performance reports</p>
                    </div>
                    <Switch
                      id="weekly-reports"
                      checked={weeklyReports}
                      onCheckedChange={setWeeklyReports}
                      className="data-[state=checked]:bg-cosmic-teal"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="release-reminders">Release Reminders</Label>
                      <p className="text-sm text-muted-foreground">Get notified about upcoming releases</p>
                    </div>
                    <Switch
                      id="release-reminders"
                      checked={releaseReminders}
                      onCheckedChange={setReleaseReminders}
                      className="data-[state=checked]:bg-cosmic-teal"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="contract-alerts">Contract Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified about contract expirations</p>
                    </div>
                    <Switch
                      id="contract-alerts"
                      checked={contractAlerts}
                      onCheckedChange={setContractAlerts}
                      className="data-[state=checked]:bg-cosmic-teal"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black gap-1">
                  <Save className="h-4 w-4" /> Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="current-password" type="password" className="pl-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="new-password" type="password" className="pl-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="confirm-password" type="password" className="pl-10" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">Update Password</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require a verification code when logging in from a new device
                  </p>
                </div>
                <Switch
                  id="two-factor"
                  checked={twoFactorAuth}
                  onCheckedChange={setTwoFactorAuth}
                  className="data-[state=checked]:bg-cosmic-teal"
                />
              </div>

              {twoFactorAuth && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-medium">Setup Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Scan the QR code with your authenticator app or enter the code manually.
                  </p>
                  <div className="flex justify-center">
                    <div className="h-48 w-48 bg-white p-4 rounded-md flex items-center justify-center">
                      <div className="text-black text-center">QR Code Placeholder</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="verification-code">Verification Code</Label>
                    <Input id="verification-code" placeholder="Enter the 6-digit code" />
                  </div>
                  <Button className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                    Verify and Enable
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>Manage your active sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-cosmic-teal" />
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">San Francisco, CA • Chrome on macOS</p>
                    </div>
                  </div>
                  <div className="text-sm text-green-500">Active Now</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Mobile App</p>
                      <p className="text-sm text-muted-foreground">San Francisco, CA • iOS 16</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-500">
                    Log Out
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Unknown Device</p>
                      <p className="text-sm text-muted-foreground">New York, NY • Firefox on Windows</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-500">
                    Log Out
                  </Button>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="outline" className="text-red-500 hover:text-red-500">
                  Log Out of All Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Manage your subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">Label Plan</h3>
                  <p className="text-muted-foreground mb-4">
                    $199<span className="text-sm">/month</span>
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-cosmic-teal" />
                      <span className="text-sm">All agents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-cosmic-teal" />
                      <span className="text-sm">5 team seats</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-cosmic-teal" />
                      <span className="text-sm">Advanced reports with exports</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-cosmic-teal" />
                      <span className="text-sm">10,000 tracks/month processing</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-between">
                  <div className="text-sm text-muted-foreground">
                    Your plan renews on <span className="font-medium">June 15, 2025</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">Change Plan</Button>
                    <Button variant="outline" className="text-red-500 hover:text-red-500">
                      Cancel Plan
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Manage your payment information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-cosmic-teal" />
                  <div>
                    <p className="font-medium">Visa ending in 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/25</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-500">
                    Remove
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" className="gap-1">
                  <Plus className="h-4 w-4" /> Add Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>View your past invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Description</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Amount</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          date: "May 15, 2025",
                          description: "Label Plan - Monthly",
                          amount: "$199.00",
                          status: "Paid",
                        },
                        {
                          date: "April 15, 2025",
                          description: "Label Plan - Monthly",
                          amount: "$199.00",
                          status: "Paid",
                        },
                        {
                          date: "March 15, 2025",
                          description: "Label Plan - Monthly",
                          amount: "$199.00",
                          status: "Paid",
                        },
                      ].map((invoice, index) => (
                        <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">{invoice.date}</td>
                          <td className="p-4 align-middle">{invoice.description}</td>
                          <td className="p-4 align-middle">{invoice.amount}</td>
                          <td className="p-4 align-middle">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-500">
                              {invoice.status}
                            </span>
                          </td>
                          <td className="p-4 align-middle">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {connectModalPlatform && (
        <PlatformConnectModal
          platform={connectModalPlatform}
          isOpen
          onClose={() => setConnectModalPlatform(null)}
        />
      )}
    </div>
  )
}
