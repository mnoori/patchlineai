export function SimpleTRSIcon({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer rounded square (patchbay module) */}
      <rect x="2" y="2" width="20" height="20" rx="3" fill="#0F172A" stroke="currentColor" strokeWidth="1.5" />
      
      {/* Jack input holes - simpler version with just 2 jacks */}
      <circle cx="8" cy="8" r="2.5" fill="#1E293B" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="2.5" fill="#1E293B" stroke="currentColor" strokeWidth="1.5" />
      
      {/* TRS Cable connecting the jacks */}
      <path 
        d="M8 8 C 10 10, 14 14, 16 16" 
        stroke="currentColor" 
        strokeWidth="1.75" 
        fill="none" 
        strokeLinecap="round"
      />
      
      {/* Jack connectors (gold tips) */}
      <circle cx="8" cy="8" r="1" fill="gold" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="16" cy="16" r="1" fill="gold" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  )
}
