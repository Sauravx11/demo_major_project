/**
 * Logo component with "Pragati" (Progress) theme
 * Uses an upward trend arrow plus graduation cap for a modern look
 */
export default function Logo({ size = 32, className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="pragati-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      
      {/* Background shape */}
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#pragati-gradient)" fillOpacity="0.1" />

      {/* Upward Progress Indicator (Track) */}
      <path 
        d="M6 18L10 14L13 17L18 12" 
        stroke="url(#pragati-gradient)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M14 12H18V16" 
        stroke="url(#pragati-gradient)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Graduation Cap (Vidya) - small subtle element */}
      <path 
        d="M12 4L6 7L12 10L18 7L12 4Z" 
        fill="url(#pragati-gradient)" 
      />
      <path 
        d="M18 7V10" 
        stroke="url(#pragati-gradient)" 
        strokeWidth="1" 
        strokeLinecap="round" 
      />
    </svg>
  );
}
