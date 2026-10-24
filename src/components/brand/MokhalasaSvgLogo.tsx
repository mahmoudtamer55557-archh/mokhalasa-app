import React from 'react';

interface MokhalasaSvgLogoProps {
  variant?: 'dark' | 'light'; // dark text for light background, light text for dark background
  height?: number;
  className?: string;
  onClick?: () => void;
}

export const MokhalasaSvgLogo: React.FC<MokhalasaSvgLogoProps> = ({
  variant = 'dark',
  height = 42,
  className = '',
  onClick,
}) => {
  const isLight = variant === 'light';
  const textColor = isLight ? '#FFFFFF' : '#0B2D4A';
  const accentColor = '#10B981';

  // Aspect ratio: width 220, height 70
  const width = Math.round((height / 70) * 220);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 220 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      aria-label="مخلصة Mokhalasa Wordmark Logo"
      role="img"
    >
      {/* Arabic Wordmark */}
      <text
        x="110"
        y="42"
        textAnchor="middle"
        fontFamily="'Cairo', 'Segoe UI', Arial, sans-serif"
        fontWeight="900"
        fontSize="38"
        fill={textColor}
        letterSpacing="-0.02em"
      >
        مَخْلَصَة
      </text>

      {/* Modern Accent Leaf / Diacritic over 'خ' in Accent Green */}
      <path
        d="M142 12C146 10 152 11 154 15C155 19 150 23 146 22C143 21 140 16 142 12Z"
        fill={accentColor}
      />
      <path
        d="M96 14C98 12 102 13 103 16C104 19 101 21 98 20C96 19 94 16 96 14Z"
        fill={accentColor}
      />

      {/* English Wordmark Below */}
      <text
        x="110"
        y="62"
        textAnchor="middle"
        fontFamily="'Tajawal', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="800"
        fontSize="12.5"
        letterSpacing="0.32em"
      >
        <tspan fill={textColor}>MOKHALAS</tspan>
        <tspan fill={accentColor}>A</tspan>
      </text>
    </svg>
  );
};

export default MokhalasaSvgLogo;
