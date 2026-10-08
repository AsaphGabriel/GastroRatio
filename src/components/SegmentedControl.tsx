import React from 'react';

interface SegmentedControlOption<T extends string> {
  id: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: [SegmentedControlOption<T>, SegmentedControlOption<T>];
  className?: string;
}

/**
 * Segmented Control contínuo em trilho nivelado único.
 * Elimina botões arredondados colidindo de forma desajeitada.
 * A pastilha deslizante preenche exatamente a metade ativa com encaixe orgânico perfeito.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className = ''
}: SegmentedControlProps<T>) {
  const activeIndex = options.findIndex((opt) => opt.id === value);

  return (
    <div
      className={`relative flex items-center p-1 bg-theme-segmented-track border border-theme-subtle rounded-xl select-none max-w-md w-full shadow-inner ${className}`}
      role="tablist"
      aria-orientation="horizontal"
    >
      {/* Pastilha Deslizante Nivelada */}
      <div
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-theme-segmented-thumb rounded-lg shadow-sm border border-theme-subtle/80 transition-all duration-200 ease-out pointer-events-none"
        style={{
          left: activeIndex === 0 ? '4px' : 'calc(50%)'
        }}
      />

      {/* Botões de Ação Interativos (Encaixe contínuo) */}
      {options.map((opt) => {
        const isActive = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.id)}
            className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold transition-colors duration-150 rounded-lg cursor-pointer ${
              isActive
                ? 'text-theme-main'
                : 'text-theme-muted hover:text-theme-main'
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
            {opt.sublabel && (
              <span className="text-[10px] font-normal opacity-70 hidden sm:inline">
                {opt.sublabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
