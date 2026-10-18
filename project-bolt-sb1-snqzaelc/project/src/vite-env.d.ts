/// <reference types="vite/client" />

declare module 'lucide-react' {
  import * as React from 'react';

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
    className?: string;
  }

  export type LucideIcon = React.FC<LucideProps>;

  export const Plus: LucideIcon;
  export const Receipt: LucideIcon;
  export const PiggyBank: LucideIcon;
  export const Wallet: LucideIcon;
  export const ArrowDownCircle: LucideIcon;
  export const ArrowUpCircle: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const TrendingDown: LucideIcon;
  export const X: LucideIcon;
  export const ArrowDownLeft: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const Check: LucideIcon;
  export const UploadCloud: LucideIcon;
  export const FileSpreadsheet: LucideIcon;
  export const Trash2: LucideIcon;
  export const Loader2: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const PenTool: LucideIcon;
  export const Search: LucideIcon;
  export const Inbox: LucideIcon;
  export const Circle: LucideIcon;
  export const UtensilsCrossed: LucideIcon;
  export const Home: LucideIcon;
  export const PlugZap: LucideIcon;
  export const Clapperboard: LucideIcon;
  export const Car: LucideIcon;
  export const Package: LucideIcon;
  export const Banknote: LucideIcon;
  export const Laptop: LucideIcon;
  export const Gift: LucideIcon;
  export const Upload: LucideIcon;
  export const FileText: LucideIcon;
  export const FileUp: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const Tag: LucideIcon;
  export const HeartPulse: LucideIcon;

  export const icons: Record<string, LucideIcon>;
  const defaultExport: Record<string, LucideIcon>;
  export default defaultExport;
}
