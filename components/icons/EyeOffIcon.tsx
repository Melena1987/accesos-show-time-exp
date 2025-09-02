import React from 'react';

const EyeOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
    <path d="M10.73 10.73C12.45 9.42 15.35 9.22 17.5 11c1.55 1.28 2.5 3.05 2.5 4.5 0 1.95-1.5 4.33-4.5 6.5-1.95 1.4-4.3 2-6.5 2-1.45 0-3.22-.95-4.5-2.5C2.22 19.35 1 16.45 1 14.73c.73-2.15 2.5-4.27 5-5.27"></path>
    <path d="m2 2 20 20"></path>
  </svg>
);

export default EyeOffIcon;
