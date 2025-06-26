'use client'

import { 
  Logo, 
  GradientText, 
  LogoShowcase, 
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  GradientBackground,
  GradientOrbs,
  FeatureCard,
  HeroSection
} from '@/components/brand'
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, BRAND } from '@/lib/brand'
import { createGradient } from '@/lib/brand/utils'

export default function BrandShowcasePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section Demo */}
      <HeroSection
        title="Revolutionizing the Music Industry"
        subtitle="with Intelligent Infrastructure"
        features={[
          {
            title: "Label OS",
            description: "Smart dashboards for record labels"
          },
          {
            title: "Modular AI Agents", 
            description: "Specialized tools for royalties, metadata, and marketing"
          },
          {
            title: "Real-Time Collaboration",
            description: "AI tools for artists, managers, and teams to co-create"
          }
        ]}
        showLogo={true}
        logoSize="xl"
      />

      {/* Brand Components Showcase */}
      <div className="max-w-7xl mx-auto space-y-12 p-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <GradientText className="text-4xl font-medium">
            {BRAND.fullName} Brand System
          </GradientText>
          <p className="text-lg text-muted-foreground">
            Comprehensive brand implementation showcase
          </p>
        </div>

        {/* Logo Variations */}
        <section className="space-y-6">
          <GradientText className="text-3xl font-medium">Logo Variations</GradientText>
          <div className="grid grid-cols-4 gap-8 bg-card p-8 rounded-lg">
            <div className="text-center space-y-2">
              <Logo size="sm" />
              <p className="text-sm text-muted-foreground">Small</p>
            </div>
            <div className="text-center space-y-2">
              <Logo size="md" />
              <p className="text-sm text-muted-foreground">Medium</p>
            </div>
            <div className="text-center space-y-2">
              <Logo size="lg" />
              <p className="text-sm text-muted-foreground">Large</p>
            </div>
            <div className="text-center space-y-2">
              <Logo size="xl" showText />
              <p className="text-sm text-muted-foreground">With Text</p>
            </div>
          </div>
        </section>

        {/* Logo Usage Guidelines */}
        <section className="space-y-6">
          <GradientText className="text-3xl font-medium">Logo Usage Guidelines</GradientText>
          <LogoShowcase />
        </section>

        {/* Color Palette */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Color Palette</h2>
          
          {/* Primary Colors */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Primary Colors</h3>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(COLORS.primary).map(([name, color]) => (
                <div key={name} className="space-y-2">
                  <div 
                    className="h-24 rounded-lg border border-border"
                    style={{ backgroundColor: color }}
                  />
                  <p className="font-medium capitalize">{name.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-sm text-muted-foreground">{color}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gradient Colors */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Gradient Colors</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div 
                  className="h-24 rounded-lg"
                  style={{ background: createGradient('to right') }}
                />
                <p className="font-medium">Brand Gradient</p>
              </div>
              <div className="space-y-2">
                <div 
                  className="h-24 rounded-lg"
                  style={{ background: createGradient(135, [COLORS.primary.cyan, COLORS.primary.brightBlue]) }}
                />
                <p className="font-medium">Cyan to Blue</p>
              </div>
              <div className="space-y-2">
                <div 
                  className="h-24 rounded-lg"
                  style={{ background: createGradient('to bottom', [COLORS.primary.brightBlue, COLORS.primary.deepBlue]) }}
                />
                <p className="font-medium">Blue Gradient</p>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Typography</h2>
          <div className="space-y-4 bg-card p-8 rounded-lg">
            <div className="space-y-2">
              <p className="text-7xl font-extrabold">Aa</p>
              <p className="text-sm text-muted-foreground">7xl / Extrabold</p>
            </div>
            <div className="space-y-2">
              <p className="text-5xl font-bold">Headlines</p>
              <p className="text-sm text-muted-foreground">5xl / Bold</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-semibold">Subheadings</p>
              <p className="text-sm text-muted-foreground">3xl / Semibold</p>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-medium">Body Large</p>
              <p className="text-sm text-muted-foreground">xl / Medium</p>
            </div>
            <div className="space-y-2">
              <p className="text-base font-regular">Body Text Regular</p>
              <p className="text-sm text-muted-foreground">base / Regular</p>
            </div>
          </div>
        </section>

        {/* Gradient Backgrounds */}
        <section className="space-y-6">
          <GradientText className="text-3xl font-medium">Gradient Backgrounds</GradientText>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Cyan (#00E6E4) flows from top to black (#010102) at bottom</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="relative h-64 rounded-lg overflow-hidden">
              <GradientBackground variant="section" className="h-full">
                <div className="flex items-center justify-center h-full">
                  <p className="text-white font-semibold">Section Gradient</p>
                </div>
              </GradientBackground>
            </div>
            <div className="relative h-64 rounded-lg overflow-hidden">
              <GradientBackground variant="card" className="h-full">
                <div className="flex items-center justify-center h-full">
                  <p className="text-white font-semibold">Card Gradient</p>
                </div>
              </GradientBackground>
            </div>
            <div className="relative h-64 rounded-lg overflow-hidden">
              <GradientBackground variant="subtle" className="h-full">
                <div className="flex items-center justify-center h-full">
                  <p className="text-white font-semibold">Subtle Gradient</p>
                </div>
              </GradientBackground>
            </div>
            <div className="relative h-64 rounded-lg overflow-hidden bg-background border border-border">
              <GradientOrbs variant="default" />
              <div className="relative z-10 flex items-center justify-center h-full">
                <p className="font-semibold">Default Orbs</p>
              </div>
            </div>
            <div className="relative h-64 rounded-lg overflow-hidden bg-background border border-border">
              <GradientOrbs variant="subtle" />
              <div className="relative z-10 flex items-center justify-center h-full">
                <p className="font-semibold">Subtle Orbs</p>
              </div>
            </div>
            <div className="relative h-64 rounded-lg overflow-hidden bg-background border border-border">
              <GradientOrbs variant="vibrant" />
              <div className="relative z-10 flex items-center justify-center h-full">
                <p className="font-semibold">Vibrant Orbs</p>
              </div>
            </div>
            <div className="relative h-64 rounded-lg overflow-hidden bg-background border border-border">
              <GradientOrbs variant="dispersed" />
              <div className="relative z-10 flex items-center justify-center h-full">
                <p className="font-semibold">Dispersed Orbs</p>
              </div>
            </div>
            <div className="relative h-64 rounded-lg overflow-hidden bg-background border border-border">
              <GradientOrbs variant="subtle-bottom" />
              <div className="relative z-10 flex items-center justify-center h-full">
                <p className="font-semibold">Subtle Bottom</p>
              </div>
            </div>
            <div className="relative h-64 rounded-lg overflow-hidden bg-background border border-border">
              <GradientOrbs variant="dispersed-bottom" />
              <div className="relative z-10 flex items-center justify-center h-full">
                <p className="font-semibold">Dispersed Bottom</p>
              </div>
            </div>
          </div>
        </section>

        {/* Gradient Text Examples */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Gradient Text</h2>
          <div className="space-y-4">
            <GradientText className="text-4xl font-bold">
              Default Brand Gradient
            </GradientText>
            <GradientText gradient="cyan" className="text-4xl font-bold">
              Cyan Gradient
            </GradientText>
            <GradientText gradient="blue" className="text-4xl font-bold">
              Blue Gradient
            </GradientText>
            <GradientText gradient="custom" customColors={['#FF0080', '#7928CA']} className="text-4xl font-bold">
              Custom Gradient
            </GradientText>
          </div>
        </section>

        {/* UI Components */}
        <section className="space-y-6">
          <GradientText className="text-3xl font-medium">UI Components</GradientText>
          
          {/* Cards */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Cards</h3>
            <div className="grid grid-cols-2 gap-6">
              {/* Glass Card */}
              <Card variant="glass" hover="glow">
                <CardHeader>
                  <CardTitle>Glass Effect</CardTitle>
                  <CardDescription>Card with glass morphism effect</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Perfect for overlays and floating elements.</p>
                </CardContent>
              </Card>

              {/* Gradient Border Card */}
              <Card variant="gradient" hover="lift">
                <CardHeader>
                  <CardTitle>Gradient Border</CardTitle>
                  <CardDescription>Card with animated gradient border</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Eye-catching cards for important content.</p>
                </CardContent>
              </Card>

              {/* Outlined Card */}
              <Card variant="outlined" hover="glow">
                <CardHeader>
                  <CardTitle>Outlined Card</CardTitle>
                  <CardDescription>Cyan outline with glow effect</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Great for feature cards and CTAs.</p>
                </CardContent>
              </Card>

              {/* Elevated Card */}
              <Card variant="elevated" hover="lift">
                <CardHeader>
                  <CardTitle>Elevated Card</CardTitle>
                  <CardDescription>Card with shadow elevation</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Classic card style with depth.</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Feature Cards */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Feature Cards</h3>
            <div className="grid grid-cols-3 gap-6">
              <FeatureCard
                title="Smart Analytics"
                description="Real-time insights for your music catalog"
                glowColor="cyan"
              />
              <FeatureCard
                title="AI-Powered Tools"
                description="Automate repetitive tasks with intelligence"
                glowColor="blue"
              />
              <FeatureCard
                title="Seamless Integration"
                description="Connect with your existing music platforms"
                glowColor="gradient"
              />
            </div>
          </div>

          {/* Buttons */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Buttons</h3>
            <div className="space-y-4">
              {/* Button Variants */}
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="gradient">Gradient</Button>
                <Button variant="glow">Glow Effect</Button>
              </div>
              
              {/* Button Sizes */}
              <div className="flex items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Spacing System */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Spacing System</h2>
          <div className="space-y-4">
            {Object.entries(SPACING).map(([name, value]) => (
              <div key={name} className="flex items-center gap-4">
                <span className="w-12 text-sm font-mono">{name}</span>
                <div 
                  className="bg-brand-bright-blue h-4"
                  style={{ width: value }}
                />
                <span className="text-sm text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Border Radius */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Border Radius</h2>
          <div className="grid grid-cols-6 gap-4">
            {Object.entries(RADIUS).map(([name, value]) => (
              <div key={name} className="text-center space-y-2">
                <div 
                  className="w-24 h-24 bg-brand-bright-blue mx-auto"
                  style={{ borderRadius: value }}
                />
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
} 