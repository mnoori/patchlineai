/**
 * PatchLine AI Project Structure
 * 
 * This file represents the entire project structure for v0.dev
 * It contains key components, routes, and structure to help v0.dev understand the project
 */

// === PROJECT STRUCTURE ===
const projectStructure = {
  app: {
    "layout.tsx": "NextJS App Router Layout",
    "page.tsx": "Home Page",
    "globals.css": "Global Styles",
    patchline: {
      "page.tsx": "Patchline Feature Page"
    },
    "pitch-deck": {
      "page.tsx": "Pitch Deck Page"
    },
    team: {
      "page.tsx": "Team Page"
    },
    api: {
      "route.ts": "API Routes"
    }
  },
  components: {
    ui: {
      "accordion.tsx": "UI Component",
      "alert-dialog.tsx": "UI Component",
      "alert.tsx": "UI Component",
      "avatar.tsx": "UI Component",
      "badge.tsx": "UI Component",
      "button.tsx": "UI Component",
      "calendar.tsx": "UI Component",
      "card.tsx": "UI Component",
      "checkbox.tsx": "UI Component",
      "dialog.tsx": "UI Component",
      "form.tsx": "UI Component",
      "input.tsx": "UI Component",
      // Other UI components...
    },
    "pitch-deck": {
      "pitch-deck-viewer.tsx": "Pitch Deck Viewer Component"
    },
    "ai-agent": {
      "pitch-deck-cta.tsx": "CTA Component",
      "trending-artists.tsx": "Trending Artists Component",
      "dashboard-preview.tsx": "Dashboard Preview Component",
      "architecture-section.tsx": "Architecture Section Component"
    },
    "theme-provider.tsx": "Theme Provider",
    "team-section.tsx": "Team Section",
    "hero.tsx": "Hero Component",
    "about.tsx": "About Component",
    "contact.tsx": "Contact Component"
  },
  backend: {
    api: {
      "contact": "Contact API",
      "early-access": "Early Access API",
      "spotify-artist": "Spotify Artist API",
      "spotify-token": "Spotify Token API"
    }
  },
  shared: {
    types: {
      "index.ts": "Shared Types"
    },
    utils: {
      "config.ts": "Configuration",
      "spotify-auth.ts": "Spotify Authentication",
      "utils.ts": "Utility Functions",
      "youtube-api.ts": "YouTube API"
    }
  },
  public: {
    // Image assets
    "images": "Public Assets"
  }
};

// === KEY COMPONENTS ===

// Home Page
const HomePage = `
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Hero />
      <About />
      <Services />
      <TeamSection />
      <Contact />
      <Newsletter />
    </main>
  );
}
`;

// Layout Component
const LayoutComponent = `
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Navigation />
          {children}
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
`;

// Hero Component
const HeroComponent = `
export default function Hero() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Generative AI for Music Creators
              </h1>
              <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                PatchLine AI helps producers, composers, and labels automate workflows, generate better sounds,
                and achieve their perfect mix in record time.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link
                href="/early-access"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                Get Early Access
              </Link>
              <Link
                href="/pitch-deck"
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                View Pitch Deck
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <img
              src="/neon-alchemist.png"
              width={550}
              height={550}
              alt="PatchLine AI Dashboard"
              className="rounded-xl object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
`;

// Team Section Component
const TeamSectionComponent = `
export default function TeamSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted dark:bg-muted/40">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm dark:bg-muted/60">
              The Team
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Meet Our Visionaries</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Combining expertise in AI, music production, and business to build the future of music creation.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12">
          <div className="flex flex-col items-center space-y-4">
            <img
              src="/team/mehdi-profile.jpg"
              width={200}
              height={200}
              alt="Mehdi Noori"
              className="rounded-full object-cover border-4 border-background dark:border-background"
            />
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-bold">Mehdi Noori</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Founder & CEO</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI researcher and electronic music producer with a passion for creative technology.
              </p>
            </div>
            <div className="flex space-x-4">
              <Link href="https://twitter.com/mehdinoori" target="_blank" rel="noopener noreferrer">
                <TwitterIcon className="h-5 w-5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="https://linkedin.com/in/mehdinoori" target="_blank" rel="noopener noreferrer">
                <LinkedinIcon className="h-5 w-5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>
          {/* Additional team members would go here */}
        </div>
      </div>
    </section>
  );
}
`;

// Dashboard Preview Component
const DashboardPreviewComponent = `
export default function DashboardPreview() {
  return (
    <div className="rounded-xl border bg-background shadow-xl overflow-hidden">
      <div className="flex border-b">
        <div className="w-64 border-r bg-muted/40 p-4">
          <div className="flex items-center gap-2 mb-8">
            <div className="rounded-full bg-primary h-8 w-8 flex items-center justify-center text-primary-foreground font-bold">P</div>
            <div className="font-semibold">PatchLine AI</div>
          </div>
          <nav className="space-y-2">
            <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary font-medium">
              <HomeIcon className="h-5 w-5" />
              <span>Dashboard</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
              <BarChart2Icon className="h-5 w-5" />
              <span>Analytics</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
              <MusicIcon className="h-5 w-5" />
              <span>Projects</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
              <LibraryIcon className="h-5 w-5" />
              <span>Sound Library</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
              <UsersIcon className="h-5 w-5" />
              <span>Collaboration</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
              <SettingsIcon className="h-5 w-5" />
              <span>Settings</span>
            </div>
          </nav>
        </div>
        <div className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="rounded-md border bg-background pl-8 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-44"
                />
              </div>
              <Button size="sm" variant="outline">
                <BellIcon className="h-4 w-4 mr-2" />
                <span>Notifications</span>
              </Button>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">M</div>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">Total Projects</h3>
                <MusicIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-xs text-muted-foreground mt-1">+3 this month</p>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">Sound Generations</h3>
                <ZapIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">247</p>
              <p className="text-xs text-muted-foreground mt-1">+58 this week</p>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">Saved Time</h3>
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">32 hours</p>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border bg-card shadow-sm">
              <div className="p-4 border-b">
                <h3 className="font-medium">Recent Projects</h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded bg-primary/10 flex items-center justify-center">
                        <MusicIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Summer Vibes EP</p>
                        <p className="text-xs text-muted-foreground">Updated 2 hours ago</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded bg-primary/10 flex items-center justify-center">
                        <MusicIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Neon City Beats</p>
                        <p className="text-xs text-muted-foreground">Updated yesterday</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded bg-primary/10 flex items-center justify-center">
                        <MusicIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Ambient Landscapes</p>
                        <p className="text-xs text-muted-foreground">Updated 3 days ago</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card shadow-sm">
              <div className="p-4 border-b">
                <h3 className="font-medium">AI Sound Generation</h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="prompt" className="text-xs font-medium">Describe your sound</Label>
                    <Textarea
                      id="prompt"
                      placeholder="Describe the sound you want to generate..."
                      className="mt-1 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="genre" className="text-xs font-medium">Genre</Label>
                      <Select>
                        <SelectTrigger id="genre">
                          <SelectValue placeholder="Select genre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="electronic">Electronic</SelectItem>
                          <SelectItem value="ambient">Ambient</SelectItem>
                          <SelectItem value="lofi">Lo-Fi</SelectItem>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="techno">Techno</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="duration" className="text-xs font-medium">Duration</Label>
                      <Select>
                        <SelectTrigger id="duration">
                          <SelectValue placeholder="Duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 seconds</SelectItem>
                          <SelectItem value="30">30 seconds</SelectItem>
                          <SelectItem value="60">1 minute</SelectItem>
                          <SelectItem value="120">2 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full">
                    <ZapIcon className="h-4 w-4 mr-2" />
                    Generate Sound
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

// API Route Example
const apiRouteExample = `
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();
    
    // Validate input
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email and message are required' },
        { status: 400 }
      );
    }

    // Here you would typically send this data to your email service or database
    // For example, using a service like SendGrid, Mailchimp, etc.
    
    // For demonstration, we'll just log it
    console.log('Contact form submission:', { name, email, message });
    
    // Return success response
    return NextResponse.json(
      { success: true, message: 'Message sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in contact API:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
`;

// Utility Function Example
const utilityFunctionExample = `
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
`;

// Types Example
const typesExample = `
export interface Artist {
  id: string;
  name: string;
  genres: string[];
  imageUrl: string;
  popularity: number;
  followers: number;
}

export interface Track {
  id: string;
  title: string;
  artistName: string;
  albumName: string;
  duration: number;
  previewUrl: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  tracks: Track[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  imageUrl?: string;
  projects: Project[];
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}
`;

// Configuration Example
const configExample = `
// Configuration settings for the application

export const config = {
  // API configuration
  api: {
    spotifyBaseUrl: 'https://api.spotify.com/v1',
    youtubeBaseUrl: 'https://www.googleapis.com/youtube/v3',
  },
  
  // Feature flags
  features: {
    enableAIGeneration: true,
    enableCollaboration: true,
    enableAnalytics: true,
  },
  
  // Limits and quotas
  limits: {
    maxProjects: 10,
    maxSoundGenerationsPerDay: 50,
    maxCollaboratorsPerProject: 5,
  },
  
  // UI settings
  ui: {
    theme: {
      primary: '#8A2BE2', // BlueViolet
      secondary: '#3A86FF',
      accent: '#FF006E',
      background: '#121212',
    },
    animations: {
      enableAnimations: true,
    },
  },
};

export default config;
`;

export {
  projectStructure,
  HomePage,
  LayoutComponent,
  HeroComponent,
  TeamSectionComponent,
  DashboardPreviewComponent,
  apiRouteExample,
  utilityFunctionExample,
  typesExample,
  configExample
}; 