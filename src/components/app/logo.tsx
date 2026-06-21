import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 32, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-label="Finastic logo"
      role="img"
    >
      <defs>
        <linearGradient
          id="finastic-mark-gradient"
          x1="0"
          y1="0"
          x2="36"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--success)" />
          <stop offset="1" stopColor="var(--info)" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="9" fill="url(#finastic-mark-gradient)" />
      <line
        x1="10.5"
        y1="10"
        x2="10.5"
        y2="26"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M10.5 10 L22 10 L27 5.5"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23.5 5 L27 5.5 L26.5 9"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="10.5"
        y1="18"
        x2="20.5"
        y2="18"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
