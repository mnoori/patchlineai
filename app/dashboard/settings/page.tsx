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
import { PlatformIntegrations } from "@/components/insights/platform-integrations"
import { toast } from "sonner"
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
  Bell,
  Zap,
  Sliders,
  Sparkles,
  Laptop,
  Fingerprint,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Download,
  FileText,
  Languages,
  MessageSquare,
  Smartphone,
  Wifi,
} from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { motion } from "framer-motion"
import { userAPI, platformsAPI } from "@/lib/api-client"
import { usePlatformConnections } from "@/hooks/use-platform-connections"

export default function SettingsPage() {
  const { userId } = useCurrentUser()

  const [darkMode, setDarkMode] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [weeklyReports, setWeeklyReports] = useState(true)
  const [releaseReminders, setReleaseReminders] = useState(true)
  const [contractAlerts, setContractAlerts] = useState(true)
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [language, setLanguage] = useState("english")
  const [timezone, setTimezone] = useState("America/Los_Angeles")
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY")
  const [analyticsConsent, setAnalyticsConsent] = useState(true)
  const [marketingConsent, setMarketingConsent] = useState(true)
  const [autoBackup, setAutoBackup] = useState(true)
  const [dataRetention, setDataRetention] = useState("1year")

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [website, setWebsite] = useState("")
  const [bio, setBio] = useState("")

  const [isDirty, setIsDirty] = useState(false)

  const { platforms, loading: loadingPlatforms, connectPlatform, disconnectPlatform, refreshPlatforms } = usePlatformConnections()

  // Handle OAuth callback
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    
    if (connected) {
      toast.success(`${connected} connected successfully!`)
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
      // Reload platforms to show the new connection
      refreshPlatforms()
    } else if (error) {
      let errorMessage = 'Connection failed'
      
      switch (error) {
        case 'spotify_secret_missing':
          errorMessage = 'Spotify connection failed: Client secret not configured. Please contact support.'
          break
        case 'configuration_missing':
          errorMessage = 'Platform not properly configured. Please contact support.'
          break
        case 'invalid_provider':
          errorMessage = 'Invalid platform selected.'
          break
        case 'connection_failed':
          errorMessage = 'Connection failed. Please try again.'
          break
        default:
          errorMessage = `Connection failed: ${error}`
      }
      
      toast.error(errorMessage)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [refreshPlatforms])

  useEffect(() => {
    async function loadUser() {
      if (!userId) return
      try {
        const data = await userAPI.get(userId) as any
        setFullName(data.fullName || "")
        setEmail(data.email || "")
        setCompany(data.company || "")
        setWebsite(data.website || "")
        setBio(data.bio || "")
      } catch (e) {
        console.error("Failed to fetch user", e)
      }
    }
    loadUser()
  }, [userId])

  // Platform loading is now handled by the usePlatformConnections hook

  async function handleProfileSave() {
    if (!userId) return
    try {
      await userAPI.update({
        userId,
        fullName,
        email,
        company,
        website,
        bio,
      })
      setIsDirty(false)
    } catch (e) {
      console.error("Save failed", e)
    }
  }

  const markDirty = () => setIsDirty(true)

  async function handlePlatformConnect(platform: string, connect: boolean) {
    if (connect) {
      connectPlatform(platform)
    } else {
      const result = await disconnectPlatform(platform)
      if (result?.success) {
        toast.success(`${platform} disconnected successfully`)
      } else {
        toast.error(result?.error || `Failed to disconnect ${platform}`)
      }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div className="space-y-8" initial="hidden" animate="visible" variants={containerVariants}>
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </motion.div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-4xl grid-cols-5 mb-8">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-cosmic-teal/20 data-[state=active]:text-cosmic-teal"
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="platforms"
            className="data-[state=active]:bg-cosmic-teal/20 data-[state=active]:text-cosmic-teal"
          >
            <Music2 className="h-4 w-4 mr-2" />
            Platforms
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-cosmic-teal/20 data-[state=active]:text-cosmic-teal"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-cosmic-teal/20 data-[state=active]:text-cosmic-teal"
          >
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="data-[state=active]:bg-cosmic-teal/20 data-[state=active]:text-cosmic-teal"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="glass-effect border-border/50 hover:border-cosmic-teal/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-cosmic-teal" />
                  Profile Information
                </CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3 flex flex-col items-center">
                    <Avatar className="h-32 w-32 mb-4 border-4 border-cosmic-teal/20 hover:border-cosmic-teal/50 transition-all duration-300">
                      <AvatarImage src="/music-label-owner-avatar.png" alt="Label Owner" />
                      <AvatarFallback>
                        <Disc className="h-12 w-12 text-cosmic-teal" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 hover:bg-cosmic-teal/20 hover:text-cosmic-teal transition-all duration-200"
                      >
                        <Upload className="h-4 w-4" /> Upload
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-red-500 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
                      >
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
                          <Input
                            id="name"
                            placeholder="John Doe"
                            className="pl-10 bg-background/50 border-border/50 focus:border-cosmic-teal/50 transition-all duration-200"
                            value={fullName}
                            onChange={(e) => {
                              setFullName(e.target.value)
                              markDirty()
                            }}
                          />
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
                            className="pl-10 bg-background/50 border-border/50 focus:border-cosmic-teal/50 transition-all duration-200"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value)
                              markDirty()
                            }}
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
                            className="pl-10 bg-background/50 border-border/50 focus:border-cosmic-teal/50 transition-all duration-200"
                            value={company}
                            onChange={(e) => {
                              setCompany(e.target.value)
                              markDirty()
                            }}
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
                            className="pl-10 bg-background/50 border-border/50 focus:border-cosmic-teal/50 transition-all duration-200"
                            value={website}
                            onChange={(e) => {
                              setWebsite(e.target.value)
                              markDirty()
                            }}
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
                        className="bg-background/50 border-border/50 focus:border-cosmic-teal/50 transition-all duration-200"
                        value={bio}
                        onChange={(e) => {
                          setBio(e.target.value)
                          markDirty()
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    className="gap-1 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black transition-all duration-200"
                    variant={isDirty ? undefined : "outline"}
                    disabled={!isDirty}
                    onClick={handleProfileSave}
                  >
                    <Save className="h-4 w-4" /> Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass-effect border-border/50 hover:border-cosmic-teal/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-cosmic-teal" />
                  Preferences
                </CardTitle>
                <CardDescription>Customize your interface and regional settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Interface</h3>

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

                    <div className="space-y-2">
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
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Regional Settings</h3>

                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <div className="relative">
                        <Languages className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <select
                          id="language"
                          className="w-full pl-10 h-10 rounded-md border border-border/50 bg-background/50 focus:border-cosmic-teal/50 transition-all duration-200"
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                        >
                          <option value="english">English</option>
                          <option value="spanish">Spanish</option>
                          <option value="french">French</option>
                          <option value="german">German</option>
                          <option value="japanese">Japanese</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <select
                          id="timezone"
                          className="w-full pl-10 h-10 rounded-md border border-border/50 bg-background/50 focus:border-cosmic-teal/50 transition-all duration-200"
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                        >
                          <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                          <option value="America/Denver">Mountain Time (US & Canada)</option>
                          <option value="America/Chicago">Central Time (US & Canada)</option>
                          <option value="America/New_York">Eastern Time (US & Canada)</option>
                          <option value="Europe/London">London</option>
                          <option value="Europe/Paris">Paris</option>
                          <option value="Asia/Tokyo">Tokyo</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date-format">Date Format</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <select
                          id="date-format"
                          className="w-full pl-10 h-10 rounded-md border border-border/50 bg-background/50 focus:border-cosmic-teal/50 transition-all duration-200"
                          value={dateFormat}
                          onChange={(e) => setDateFormat(e.target.value)}
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="gap-1 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black transition-all duration-200">
                    <Save className="h-4 w-4" /> Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <motion.div variants={itemVariants}>
            <PlatformIntegrations />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass-effect border-border/50 hover:border-cosmic-teal/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-cosmic-teal" />
                  Platform Settings
                </CardTitle>
                <CardDescription>Configure how your platforms interact with Patchline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Data Sync</h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-sync">Automatic Sync</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically sync data from connected platforms
                        </p>
                      </div>
                      <Switch id="auto-sync" checked={true} className="data-[state=checked]:bg-cosmic-teal" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sync-frequency">Sync Frequency</Label>
                        <p className="text-sm text-muted-foreground">How often to sync data from platforms</p>
                      </div>
                      <select
                        id="sync-frequency"
                        className="w-40 h-10 rounded-md border border-border/50 bg-background/50 focus:border-cosmic-teal/50 transition-all duration-200"
                      >
                        <option value="daily">Daily</option>
                        <option value="hourly">Hourly</option>
                        <option value="realtime">Real-time</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="historical-data">Historical Data</Label>
                        <p className="text-sm text-muted-foreground">
                          Import historical data when connecting platforms
                        </p>
                      </div>
                      <Switch id="historical-data" checked={true} className="data-[state=checked]:bg-cosmic-teal" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Platform Permissions</h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="read-analytics">Read Analytics</Label>
                        <p className="text-sm text-muted-foreground">Allow platforms to read analytics data</p>
                      </div>
                      <Switch id="read-analytics" checked={true} className="data-[state=checked]:bg-cosmic-teal" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="post-content">Post Content</Label>
                        <p className="text-sm text-muted-foreground">Allow posting content to platforms</p>
                      </div>
                      <Switch id="post-content" checked={true} className="data-[state=checked]:bg-cosmic-teal" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="manage-releases">Manage Releases</Label>
                        <p className="text-sm text-muted-foreground">Allow managing releases on platforms</p>
                      </div>
                      <Switch id="manage-releases" checked={false} className="data-[state=checked]:bg-cosmic-teal" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="gap-1 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black transition-all duration-200">
                    <Save className="h-4 w-4" /> Save Platform Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="glass-effect border-border/50 hover:border-cosmic-teal/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-cosmic-teal" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Notification Channels</h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications" className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-cosmic-teal" />
                          Email Notifications
                        </Label>
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
                        <Label htmlFor="push-notifications" className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-cosmic-teal" />
                          Push Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">Receive notifications in your browser</p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={pushNotifications}
                        onCheckedChange={setPushNotifications}
                        className="data-[state=checked]:bg-cosmic-teal"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sms-notifications" className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-cosmic-teal" />
                          SMS Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">Receive important alerts via SMS</p>
                      </div>
                      <Switch id="sms-notifications" checked={false} className="data-[state=checked]:bg-cosmic-teal" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Notification Types</h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="weekly-reports" className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-cosmic-teal" />
                          Weekly Reports
                        </Label>
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
                        <Label htmlFor="release-reminders" className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-cosmic-teal" />
                          Release Reminders
                        </Label>
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
                        <Label htmlFor="contract-alerts" className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-cosmic-teal" />
                          Contract Alerts
                        </Label>
                        <p className="text-sm text-muted-foreground">Get notified about contract expirations</p>
                      </div>
                      <Switch
                        id="contract-alerts"
                        checked={contractAlerts}
                        onCheckedChange={setContractAlerts}
                        className="data-[state=checked]:bg-cosmic-teal"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="ai-insights" className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-cosmic-teal" />
                          AI Insights
                        </Label>
                        <p className="text-sm text-muted-foreground">Get notified about AI-generated insights</p>
                      </div>
                      <Switch id="ai-insights" checked={true} className="data-[state=checked]:bg-cosmic-teal" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Notification Schedule</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quiet-hours-start">Quiet Hours Start</Label>
                      <Input
                        id="quiet-hours-start"
                        type="time"
                        defaultValue="22:00"
                        className="bg-background/50 border-border/50 focus:border-cosmic-teal/50 transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quiet-hours-end">Quiet Hours End</Label>
                      <Input
                        id="quiet-hours-end"
                        type="time"
                        defaultValue="08:00"
                        className="bg-background/50 border-border/50 focus:border-cosmic-teal/50 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="weekend-notifications">Weekend Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications on weekends</p>
                    </div>
                    <Switch
                      id="weekend-notifications"
                      checked={false}
                      className="data-[state=checked]:bg-cosmic-teal"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="gap-1 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black transition-all duration-200">
                    <Save className="h-4 w-4" /> Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="glass-effect border-border/50 hover:border-cosmic-teal/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-cosmic-teal" />
                  Password
                </CardTitle>
                <CardDescription>Update your password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="current-password"
                        type={showPassword ? "text" : "password"}
                        className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-cosmic-teal/50 transition-all duration-200"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-cosmic-teal/50 transition-all duration-200"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-cosmic-teal/50 transition-all duration-200"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="gap-1 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black transition-all duration-200">
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass-effect border-border/50 hover:border-cosmic-teal/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-cosmic-teal" />
                  Two-Factor Authentication
                </CardTitle>
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
                      <Input
                        id="verification-code"
                        placeholder="Enter the 6-digit code"
                        className="bg-background/50 border-border/50 focus:border-cosmic-teal/50 transition-all duration-200"
                      />
                    </div>
                    <Button className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black transition-all duration-200">
                      Verify and Enable
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass-effect border-border/50 hover:border-cosmic-teal/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Laptop className="h-5 w-5 text-cosmic-teal" />
                  Sessions
                </CardTitle>
                <CardDescription>Manage your active sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-cosmic-teal/10 border border-cosmic-teal/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-cosmic-teal/20 flex items-center justify-center">
                        <Laptop className="h-5 w-5 text-cosmic-teal" />
                      </div>
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-muted-foreground">San Francisco, CA • Chrome on macOS</p>
                      </div>
                    </div>
                    <div className="text-sm text-cosmic-teal font-medium flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-cosmic-teal animate-pulse"></div>
                      Active Now
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-background/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-background/20 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Mobile App</p>
                        <p className="text-sm text-muted-foreground">San Francisco, CA • iOS 16</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
                    >
                      Log Out
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-background/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-background/20 flex items-center justify-center">
                        <Wifi className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Unknown Device</p>
                        <p className="text-sm text-muted-foreground">New York, NY • Firefox on Windows</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
                    >
                      Log Out
                    </Button>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    variant="outline"
                    className="text-red-500 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
                  >
                    Log Out of All Sessions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass-effect border-border/50 hover:border-cosmic-teal/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-cosmic-teal" />
                  Privacy & Data
                </CardTitle>
                <CardDescription>Manage your privacy settings and data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Privacy Settings</h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="analytics-consent">Analytics Consent</Label>
                        <p className="text-sm text-muted-foreground">Allow us to collect anonymous usage data</p>
                      </div>
                      <Switch
                        id="analytics-consent"
                        checked={analyticsConsent}
                        onCheckedChange={setAnalyticsConsent}
                        className="data-[state=checked]:bg-cosmic-teal"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="marketing-consent">Marketing Consent</Label>
                        <p className="text-sm text-muted-foreground">Receive marketing communications</p>
                      </div>
                      <Switch
                        id="marketing-consent"
                        checked={marketingConsent}
                        onCheckedChange={setMarketingConsent}
                        className="data-[state=checked]:bg-cosmic-teal"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Data Management</h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-backup">Automatic Backup</Label>
                        <p className="text-sm text-muted-foreground">Automatically backup your data</p>
                      </div>
                      <Switch
                        id="auto-backup"
                        checked={autoBackup}
                        onCheckedChange={setAutoBackup}
                        className="data-[state=checked]:bg-cosmic-teal"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data-retention">Data Retention</Label>
                      <select
                        id="data-retention"
                        className="w-full h-10 rounded-md border border-border/50 bg-background/50 focus:border-cosmic-teal/50 transition-all duration-200"
                        value={dataRetention}
                        onChange={(e) => setDataRetention(e.target.value)}
                      >
                        <option value="1month">1 Month</option>
                        <option value="3months">3 Months</option>
                        <option value="6months">6 Months</option>
                        <option value="1year">1 Year</option>
                        <option value="forever">Forever</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <Button
                        variant="outline"
                        className="w-full text-red-500 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
                      >
                        <Download className="h-4 w-4 mr-2" /> Download My Data
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="gap-1 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black transition-all duration-200">
                    <Save className="h-4 w-4" /> Save Privacy Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="glass-effect border-border/50 hover:border-cosmic-teal/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-cosmic-teal" />
                  Current Plan
                </CardTitle>
                <CardDescription>Manage your subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                      <span className="text-cosmic-teal">Label Plan</span>
                      <span className="text-xs bg-cosmic-teal/20 text-cosmic-teal px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </h3>
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
                      <Button
                        variant="outline"
                        className="hover:bg-cosmic-teal/20 hover:text-cosmic-teal transition-all duration-200"
                      >
                        Change Plan
                      </Button>
                      <Button
                        variant="outline"
                        className="text-red-500 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
                      >
                        Cancel Plan
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass-effect border-border/50 hover:border-cosmic-teal/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-cosmic-teal" />
                  Payment Method
                </CardTitle>
                <CardDescription>Manage your payment information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/10 border border-border/50 hover:border-cosmic-teal/30 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-cosmic-teal/20 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-cosmic-teal" />
                    </div>
                    <div>
                      <p className="font-medium">Visa ending in 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/25</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-cosmic-teal/20 hover:text-cosmic-teal transition-all duration-200"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="gap-1 hover:bg-cosmic-teal/20 hover:text-cosmic-teal transition-all duration-200"
                  >
                    <Plus className="h-4 w-4" /> Add Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass-effect border-border/50 hover:border-cosmic-teal/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cosmic-teal" />
                  Billing History
                </CardTitle>
                <CardDescription>View your past invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-border/50 overflow-hidden">
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-cosmic-teal/20 hover:text-cosmic-teal transition-all duration-200"
                              >
                                <Download className="h-4 w-4 mr-1" /> Download
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
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
