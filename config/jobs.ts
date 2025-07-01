export interface JobPosting {
  id: string
  title: string
  salary: string
  equity: string
  location: string
  status: 'actively-hiring' | 'closed' | 'draft'
  postedDate: string
  applicationUrl: string
  description: {
    mission: string[]
    responsibilities: {
      title: string
      description: string
    }[]
    requirements: string[]
    compensation: {
      contractRate: string
      equity: string
      perks: {
        title: string
        description: string
        icon: string
      }[]
    }
  }
}

export const JOBS: Record<string, JobPosting> = {
  'lead-founding-ai-engineer': {
    id: 'lead-founding-ai-engineer',
    title: 'Lead/Founding AI Engineer',
    salary: '$60k – $70k',
    equity: '0.5% – 1.5%',
    location: 'Remote / Brooklyn',
    status: 'actively-hiring',
    postedDate: 'Posted Today',
    applicationUrl: 'https://wellfound.com/l/2BrWgi',
    description: {
      mission: [
        "We're building an Agentic AI Platform for the Business of Music.",
        "Our mission is simple: give music professionals their time back.",
        "Label operations today are weighed down by repetitive workflows—metadata tagging, rights management, royalty mapping, catalogue QA, content creation and release planning. We're using disruptive AI systems to handle the grunt work, so teams across A&R, publishing ops, and catalogue strategy can focus on higher-leverage work.",
        "The recorded music industry surpassed $29.6B in 2024. We have a clear plan to go after it. Strategy's done. Design's live. First deals in motion. Now we need you."
      ],
      responsibilities: [
        {
          title: "Architect and ship.",
          description: "You'll design and build full-stack AI-powered tools using AWS (Bedrock, Amplify, Lambda, Step Functions), vector databases, and a React + Next.js frontend."
        },
        {
          title: "Train our proprietary model.",
          description: "You'll lead the fine-tuning of a domain-specific LLM built for music metadata, rights intelligence, and royalty workflows."
        },
        {
          title: "Integrate deeply.",
          description: "You'll connect our platform into the messy world of music business APIs, spreadsheets, and legacy software."
        },
        {
          title: "Move fast.",
          description: "We ship every 2 weeks and demo live. Expect autonomy, trust, and accountability."
        },
        {
          title: "Collaborate closely.",
          description: "You'll co-design the roadmap with the founder, mentor junior contributors, and help shape the culture and bar of the engineering team."
        }
      ],
      requirements: [
        "5+ years experience in full-stack engineering, with at least 2 years in production-grade ML/LLM systems",
        "Strong TypeScript and Python fundamentals",
        "Deep AWS or equivalent cloud expertise, including serverless, CI/CD, and infra-as-code",
        "Experience integrating LLMs, vector DBs, and multi-agent orchestration (LangGraph, Autogen, etc.)",
        "Experience with AI content creation tools",
        "Experience with workflow automation tools such as Zapier",
        "A strong curiosity for music-tech and how the industry actually works"
      ],
      compensation: {
        contractRate: "$30/hr for initial sprint (with room to scale as revenue/funding grows)",
        equity: "XX% (flexible based on contribution), 4-year vest, 1-year cliff, acceleration on exit",
        perks: [
          {
            title: "Music Festival Pass",
            description: "Annual ticket + travel to a global music festival of your choice",
            icon: "🎵"
          },
          {
            title: "Summer Off-Fridays",
            description: "From May through August",
            icon: "☀️"
          },
          {
            title: "Workstyle",
            description: "Work wherever you thrive; drop by our Brooklyn studio anytime for a jam session",
            icon: "📍"
          }
        ]
      }
    }
  }
}

export const getActiveJobs = (): JobPosting[] => {
  return Object.values(JOBS).filter(job => job.status === 'actively-hiring')
}

export const getJobById = (id: string): JobPosting | undefined => {
  return JOBS[id]
} 