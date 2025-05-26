export interface Release {
  id: string
  title: string
  artist: string
  type: "Single" | "EP" | "Album"
  tracks: number
  releaseDate: string
  status: "Draft" | "In Progress" | "Scheduled" | "Released"
  progress: number
  coverArt?: string
  genre: string
  label: string
  catalogNumber: string
  timeline: TimelineStep[]
  distributionStatus: DistributionPlatform[]
  marketingTasks: MarketingTask[]
  risks: Risk[]
  eta?: string
  forecastDate?: string
}

export interface TimelineStep {
  id: string
  name: string
  icon: string
  completed: boolean
  current: boolean
  tasks: Task[]
}

export interface Task {
  id: string
  name: string
  completed: boolean
  dueDate?: string
  overdue?: boolean
  assignee?: string
}

export interface DistributionPlatform {
  id: string
  name: string
  status: "Pending" | "Approved" | "Rejected" | "Live" | "Error"
  error?: string
  canFix?: boolean
}

export interface MarketingTask {
  id: string
  name: string
  type: "content" | "campaign" | "outreach"
  completed: boolean
  canGenerate: boolean
  dueDate?: string
}

export interface Risk {
  id: string
  type: "timeline" | "content" | "distribution"
  severity: "low" | "medium" | "high"
  message: string
  actionable: boolean
}

export const mockReleases: Release[] = [
  {
    id: "1",
    title: "Summer EP",
    artist: "Luna Ray",
    type: "EP",
    tracks: 5,
    releaseDate: "June 15, 2025",
    status: "In Progress",
    progress: 75,
    genre: "Electronic / Pop",
    label: "Independent",
    catalogNumber: "LR-EP-001",
    eta: "5 days left",
    forecastDate: "Ready for pre-save Jun 1",
    timeline: [
      {
        id: "upload",
        name: "Upload Tracks",
        icon: "Upload",
        completed: true,
        current: false,
        tasks: [
          { id: "upload-1", name: "Upload master files", completed: true },
          { id: "upload-2", name: "Quality check", completed: true },
        ],
      },
      {
        id: "metadata",
        name: "Metadata",
        icon: "FileText",
        completed: true,
        current: false,
        tasks: [
          { id: "meta-1", name: "Track titles & credits", completed: true },
          { id: "meta-2", name: "ISRC codes", completed: true },
        ],
      },
      {
        id: "artwork",
        name: "Artwork",
        icon: "Brush",
        completed: true,
        current: false,
        tasks: [
          { id: "art-1", name: "Cover art 3000x3000", completed: true },
          { id: "art-2", name: "Alternative sizes", completed: false, overdue: true },
        ],
      },
      {
        id: "distribution",
        name: "Distribution",
        icon: "Send",
        completed: false,
        current: true,
        tasks: [
          { id: "dist-1", name: "Submit to DSPs", completed: false },
          { id: "dist-2", name: "Pre-save setup", completed: false },
        ],
      },
      {
        id: "marketing",
        name: "Marketing",
        icon: "Megaphone",
        completed: false,
        current: false,
        tasks: [
          { id: "mark-1", name: "Press release", completed: false },
          { id: "mark-2", name: "Social media assets", completed: false },
        ],
      },
    ],
    distributionStatus: [
      { id: "spotify", name: "Spotify", status: "Approved" },
      { id: "apple", name: "Apple Music", status: "Error", error: "Cover art wrong ratio", canFix: true },
      { id: "youtube", name: "YouTube Music", status: "Pending" },
      { id: "amazon", name: "Amazon Music", status: "Pending" },
    ],
    marketingTasks: [
      { id: "press", name: "Press Release", type: "content", completed: false, canGenerate: true },
      { id: "teaser", name: "Teaser Video", type: "content", completed: false, canGenerate: true },
      { id: "ads", name: "Ad Campaign", type: "campaign", completed: false, canGenerate: false },
    ],
    risks: [
      {
        id: "art-risk",
        type: "content",
        severity: "medium",
        message: "Artwork alternative sizes overdue",
        actionable: true,
      },
    ],
  },
  {
    id: "2",
    title: "Remix Package",
    artist: "Luna Ray ft. Various Artists",
    type: "EP",
    tracks: 4,
    releaseDate: "July 22, 2025",
    status: "Scheduled",
    progress: 100,
    genre: "Electronic",
    label: "Independent",
    catalogNumber: "LR-RMX-001",
    eta: "On schedule",
    timeline: [
      {
        id: "upload",
        name: "Upload Tracks",
        icon: "Upload",
        completed: true,
        current: false,
        tasks: [
          { id: "upload-1", name: "Upload master files", completed: true },
          { id: "upload-2", name: "Quality check", completed: true },
        ],
      },
      {
        id: "metadata",
        name: "Metadata",
        icon: "FileText",
        completed: true,
        current: false,
        tasks: [
          { id: "meta-1", name: "Track titles & credits", completed: true },
          { id: "meta-2", name: "ISRC codes", completed: true },
        ],
      },
      {
        id: "artwork",
        name: "Artwork",
        icon: "Brush",
        completed: true,
        current: false,
        tasks: [
          { id: "art-1", name: "Cover art 3000x3000", completed: true },
          { id: "art-2", name: "Alternative sizes", completed: true },
        ],
      },
      {
        id: "distribution",
        name: "Distribution",
        icon: "Send",
        completed: true,
        current: false,
        tasks: [
          { id: "dist-1", name: "Submit to DSPs", completed: true },
          { id: "dist-2", name: "Pre-save setup", completed: true },
        ],
      },
      {
        id: "marketing",
        name: "Marketing",
        icon: "Megaphone",
        completed: true,
        current: false,
        tasks: [
          { id: "mark-1", name: "Press release", completed: true },
          { id: "mark-2", name: "Social media assets", completed: true },
        ],
      },
    ],
    distributionStatus: [
      { id: "spotify", name: "Spotify", status: "Approved" },
      { id: "apple", name: "Apple Music", status: "Approved" },
      { id: "youtube", name: "YouTube Music", status: "Approved" },
      { id: "amazon", name: "Amazon Music", status: "Approved" },
    ],
    marketingTasks: [
      { id: "press", name: "Press Release", type: "content", completed: true, canGenerate: false },
      { id: "teaser", name: "Teaser Video", type: "content", completed: true, canGenerate: false },
      { id: "ads", name: "Ad Campaign", type: "campaign", completed: true, canGenerate: false },
    ],
    risks: [],
  },
  {
    id: "3",
    title: "Acoustic Sessions",
    artist: "Luna Ray",
    type: "Album",
    tracks: 8,
    releaseDate: "August 10, 2025",
    status: "Scheduled",
    progress: 100,
    genre: "Acoustic / Folk",
    label: "Independent",
    catalogNumber: "LR-ALB-002",
    eta: "On schedule",
    timeline: [
      {
        id: "upload",
        name: "Upload Tracks",
        icon: "Upload",
        completed: true,
        current: false,
        tasks: [
          { id: "upload-1", name: "Upload master files", completed: true },
          { id: "upload-2", name: "Quality check", completed: true },
        ],
      },
      {
        id: "metadata",
        name: "Metadata",
        icon: "FileText",
        completed: true,
        current: false,
        tasks: [
          { id: "meta-1", name: "Track titles & credits", completed: true },
          { id: "meta-2", name: "ISRC codes", completed: true },
        ],
      },
      {
        id: "artwork",
        name: "Artwork",
        icon: "Brush",
        completed: true,
        current: false,
        tasks: [
          { id: "art-1", name: "Cover art 3000x3000", completed: true },
          { id: "art-2", name: "Alternative sizes", completed: true },
        ],
      },
      {
        id: "distribution",
        name: "Distribution",
        icon: "Send",
        completed: true,
        current: false,
        tasks: [
          { id: "dist-1", name: "Submit to DSPs", completed: true },
          { id: "dist-2", name: "Pre-save setup", completed: true },
        ],
      },
      {
        id: "marketing",
        name: "Marketing",
        icon: "Megaphone",
        completed: true,
        current: false,
        tasks: [
          { id: "mark-1", name: "Press release", completed: true },
          { id: "mark-2", name: "Social media assets", completed: true },
        ],
      },
    ],
    distributionStatus: [
      { id: "spotify", name: "Spotify", status: "Approved" },
      { id: "apple", name: "Apple Music", status: "Approved" },
      { id: "youtube", name: "YouTube Music", status: "Approved" },
      { id: "amazon", name: "Amazon Music", status: "Approved" },
    ],
    marketingTasks: [
      { id: "press", name: "Press Release", type: "content", completed: true, canGenerate: false },
      { id: "teaser", name: "Teaser Video", type: "content", completed: true, canGenerate: false },
      { id: "ads", name: "Ad Campaign", type: "campaign", completed: true, canGenerate: false },
    ],
    risks: [],
  },
]
