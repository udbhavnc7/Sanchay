import { LiquidMetalButton } from '@designcodeio/threeui/components/LiquidMetalButton';

interface MetalActionProps {
  text: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export function MetalAction({ text, onClick, className = '', disabled = false }: MetalActionProps) {
  return (
    <div
      className={`metal-action ${className}${disabled ? ' is-disabled' : ''}`.trim()}
      aria-disabled={disabled || undefined}
    >
      <LiquidMetalButton variant="pill" text={text} onClick={disabled ? undefined : onClick} />
    </div>
  );
}
