'use client';
type CheckmarkIconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
};

const CheckmarkIcon: React.FC<CheckmarkIconProps> = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
    >
      <path
        d='M5 14L9 17L18 6'
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
};

export default CheckmarkIcon;
