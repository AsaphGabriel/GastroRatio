import React from 'react';

interface WheatDividerProps {
  className?: string;
}

/**
 * Divisor vetorial elegante em SVG sólido plano de ramo de trigo (#B38E5D).
 * Zero fotos ou 3D saturado — puro flat line art botânico.
 */
export const WheatDivider: React.FC<WheatDividerProps> = ({ className = 'w-32 h-5 text-theme-wheat' }) => {
  return (
    <svg
      viewBox="0 0 160 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Haste central sutil */}
      <line x1="10" y1="12" x2="150" y2="12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />

      {/* Grãos à esquerda (espiga inclinada para a direita) */}
      <path d="M52 12C48 9 48 5 52 3C55 5 56 9 52 12Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
      <path d="M52 12C48 15 48 19 52 21C55 19 56 15 52 12Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />

      <path d="M64 12C60 8 60 4 64 2C67 4 68 8 64 12Z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1" />
      <path d="M64 12C60 16 60 20 64 22C67 20 68 16 64 12Z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1" />

      {/* Grão central dominante */}
      <path d="M76 12C72 7 72 3 76 1C80 3 81 7 76 12Z" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M76 12C72 17 72 21 76 23C80 21 81 17 76 12Z" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1.2" />

      {/* Nó central */}
      <circle cx="80" cy="12" r="2.5" fill="currentColor" />

      {/* Grãos à direita */}
      <path d="M88 12C84 7 84 3 88 1C92 3 93 7 88 12Z" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M88 12C84 17 84 21 88 23C92 21 93 17 88 12Z" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1.2" />

      <path d="M100 12C96 8 96 4 100 2C103 4 104 8 100 12Z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1" />
      <path d="M100 12C96 16 96 20 100 22C103 20 104 16 100 12Z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1" />

      <path d="M112 12C108 9 108 5 112 3C115 5 116 9 112 12Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
      <path d="M112 12C108 15 108 19 112 21C115 19 116 15 112 12Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
};
