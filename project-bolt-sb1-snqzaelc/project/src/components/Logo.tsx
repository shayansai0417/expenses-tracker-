interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 40, className }: LogoProps) {
  return (
    <svg
      aria-label="KARCH logo"
      className={className}
      role="img"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="karch-logo-gold" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F2D675" />
          <stop offset=".52" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#A67C00" />
        </linearGradient>
      </defs>
      <path
        d="M32 3.5 56.5 13v17.2c0 15-10.3 24.9-24.5 30.3C17.8 55.1 7.5 45.2 7.5 30.2V13L32 3.5Z"
        fill="url(#karch-logo-gold)"
        stroke="#F2D675"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M23 18v28M42 18 25 32l18 14"
        stroke="#0A0A0A"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13 15.8 32 8.4l19 7.4" stroke="#FFF1B8" strokeOpacity=".75" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
