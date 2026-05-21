import React, { useState, MouseEvent, ReactNode, CSSProperties } from 'react';

interface RippleState {
  key: number;
  x: number;
  y: number;
  size: number;
}

interface RippleButtonProps {
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  rippleColor?: string;
  rippleDuration?: number;
}

const RippleButton: React.FC<RippleButtonProps> = ({
  children,
  onClick,
  className = '',
  disabled = false,
  rippleColor = 'var(--button-ripple-color, rgba(255,255,255,0.35))',
  rippleDuration = 600,
}) => {
  const [ripples, setRipples] = useState<RippleState[]>([]);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    const newRipple: RippleState = { key: Date.now(), x, y, size };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setRipples(curr => curr.filter(r => r.key !== newRipple.key));
    }, rippleDuration);
    onClick?.(event);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`relative overflow-hidden isolate ${className}`}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.key}
          className="absolute rounded-full pointer-events-none animate-ripple-expand"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor,
            '--ripple-duration': `${rippleDuration}ms`,
          } as CSSProperties}
        />
      ))}
    </button>
  );
};

export { RippleButton };
