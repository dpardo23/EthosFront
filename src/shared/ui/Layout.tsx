import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

/**
 * Root layout shell providing the global HTML structure, font loading, and theme context.
 */
interface TabsProps {
  tabs: { id: string; label: string; icon?: ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            activeTab === tab.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background">{content}</div>
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground" />
      </div>
    </div>
  );
}

type DropdownItem =
  | { label?: string; icon?: React.ElementType; onClick?: () => void; danger?: boolean; type?: 'divider' }
  | { type: 'divider' };

interface DropdownProps {
  items: DropdownItem[];
  children: ReactNode;
}

export function Dropdown({ items, children }: DropdownProps) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="invisible absolute right-0 top-full z-50 mt-2 min-w-44 rounded-lg border border-border bg-card p-1 opacity-0 shadow-lg transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        {items.map((item, index) => {
          if (item.type === 'divider') return <div key={`divider-${index}`} className="my-1 h-px bg-border" />;
          const Icon = item.icon;
          return (
            <button
              key={`${item.label ?? 'item'}-${index}`}
              type="button"
              onClick={item.onClick}
              className={cn('flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent', item.danger ? 'text-destructive' : 'text-foreground')}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function ToggleSwitch({ checked, onChange, label, disabled }: ToggleSwitchProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          checked ? 'bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.4)]' : 'bg-muted',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span className={cn('pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
      {label && <span className="text-sm font-medium text-foreground">{label}</span>}
    </label>
  );
}

export const Switch = ToggleSwitch;
