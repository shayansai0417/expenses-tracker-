import * as Lucide from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const cache = new Map<string, LucideIcon>();

export function getDynamicIcon(name?: string): LucideIcon {
  if (!name) return Lucide.HelpCircle;
  if (cache.has(name)) return cache.get(name)!;

  const iconMap = Lucide as unknown as Record<string, LucideIcon>;
  // Distinct styled neutral icon fallback: HelpCircle (question-mark circle) or Tag
  const Icon = iconMap[name] ?? Lucide.HelpCircle ?? Lucide.Tag ?? Lucide.Circle;
  cache.set(name, Icon);
  return Icon;
}
