import React from 'react';

interface MokhalasaWordmarkProps {
  variant?: 'dark' | 'light'; // 'dark' = for light bg (navy text), 'light' = for dark bg (white text)
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showEnglish?: boolean;
  layout?: 'stacked' | 'inline';
  className?: string;
  onClick?: () => void;
}

export const MokhalasaWordmark: React.FC<MokhalasaWordmarkProps> = ({
  variant = 'dark',
  size = 'md',
  showEnglish = true,
  layout = 'stacked',
  className = '',
  onClick,
}) => {
  const isLight = variant === 'light'; // on dark background
  const textColor = isLight ? '#FFFFFF' : '#0B2D4A';
  const greenAccent = '#10B981';

  // Size configurations
  const sizes = {
    sm: {
      arText: 'text-xl md:text-2xl',
      enText: 'text-[9px] md:text-[10px] tracking-[0.25em]',
      gap: 'gap-0',
      dotH: 'w-2 h-2',
    },
    md: {
      arText: 'text-2xl md:text-3xl',
      enText: 'text-[11px] md:text-[12px] tracking-[0.28em]',
      gap: 'gap-0.5',
      dotH: 'w-2.5 h-2.5',
    },
    lg: {
      arText: 'text-3xl md:text-4xl',
      enText: 'text-[13px] md:text-[14px] tracking-[0.3em]',
      gap: 'gap-1',
      dotH: 'w-3 h-3',
    },
    xl: {
      arText: 'text-4xl md:text-5xl lg:text-6xl',
      enText: 'text-sm md:text-base tracking-[0.35em]',
      gap: 'gap-1.5',
      dotH: 'w-4 h-4',
    },
  };

  const currentSize = sizes[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex ${layout === 'stacked' ? 'flex-col items-center justify-center' : 'flex-row items-center gap-3'} select-none ${className} ${onClick ? 'cursor-pointer' : ''}`}
      style={{ direction: 'rtl' }}
    >
      {/* Arabic Wordmark with Integrated Emerald Accents */}
      <div className="relative flex items-center leading-none">
        <span
          className={`font-black font-arabic ${currentSize.arText} tracking-tight transition-colors duration-200`}
          style={{ color: textColor }}
        >
          مُـخَـلَّـصَـة
        </span>
        {/* Subtle Brand Green Dot Accent above wordmark */}
        <span
          className="inline-block rounded-full bg-brand-green mr-1 align-baseline shadow-sm"
          style={{
            width: size === 'sm' ? '6px' : size === 'md' ? '8px' : '10px',
            height: size === 'sm' ? '6px' : size === 'md' ? '8px' : '10px',
            backgroundColor: greenAccent,
            marginBottom: '4px'
          }}
        />
      </div>

      {/* English Wordmark: Mokhalasa with green ending 'a' */}
      {showEnglish && (
        <div
          className={`font-english font-bold uppercase ${currentSize.enText} transition-colors duration-200 flex items-center justify-center`}
          style={{ direction: 'ltr' }}
        >
          <span style={{ color: textColor }}>MOKHALAS</span>
          <span style={{ color: greenAccent }}>A</span>
        </div>
      )}
    </div>
  );
};

export default MokhalasaWordmark;
