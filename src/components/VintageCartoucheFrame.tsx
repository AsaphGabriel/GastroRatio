import React from 'react';

export const VintageCartoucheFrame: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`relative inline-flex p-1 ${className}`}>
      {/* SVG Escalável simulando a estética Pâtisserie de Vó */}
      <svg
        className="absolute inset-0 w-full h-full drop-shadow-md pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 4,0 
             L 96,0 
             A 4,4 0 0,0 100,4 
             L 100,96 
             A 4,4 0 0,0 96,100 
             L 4,100 
             A 4,4 0 0,0 0,96 
             L 0,4 
             A 4,4 0 0,0 4,0 Z"
          fill="#fdfbf7"
          stroke="#6b2830"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M 4,2.5 
             L 96,2.5 
             A 1.5,1.5 0 0,0 97.5,4 
             L 97.5,96 
             A 1.5,1.5 0 0,0 96,97.5 
             L 4,97.5 
             A 1.5,1.5 0 0,0 2.5,96 
             L 2.5,4 
             A 1.5,1.5 0 0,0 4,2.5 Z"
          fill="none"
          stroke="#6b2830"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="relative z-10 w-full h-full flex flex-wrap items-center justify-center gap-2 px-3 py-2">
        {children}
      </div>
    </div>
  );
};
