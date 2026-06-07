import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { cn } from '../lib/utils';

/**
 * Controlled text input component with label, error, and icon slot props.
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, ...props }, ref) => (
    <div className="w-full">
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>}
      <input
        ref={ref}
        id={id}
        className={cn(
          'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, maxLength, showCount, value, ...props }, ref) => {
    const currentLength = typeof value === 'string' ? value.length : 0;
    return (
      <div className="w-full">
        {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>}
        <textarea
          ref={ref}
          id={id}
          value={value}
          maxLength={maxLength}
          className={cn(
            'flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className,
          )}
          {...props}
        />
        <div className="mt-1 flex justify-between">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {showCount && maxLength && (
            <p className={cn('ml-auto text-sm text-muted-foreground', currentLength > maxLength && 'text-destructive')}>
              {maxLength - currentLength} caracteres restantes
            </p>
          )}
        </div>
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, id, options, ...props }, ref) => (
    <div className="w-full">
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>}
      <select
        ref={ref}
        id={id}
        className={cn(
          'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive',
          className,
        )}
        {...props}
      >
        {options.map((o) => <option key={o.value} value={o.value} className="bg-background text-foreground">{o.label}</option>)}
      </select>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  ),
);
Select.displayName = 'Select';

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, onChange, ...props }, ref) => (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={ref}
        type="search"
        className={cn(
          'flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        onChange={(e) => { onChange?.(e); onSearch?.(e.target.value); }}
        {...props}
      />
    </div>
  ),
);
SearchInput.displayName = 'SearchInput';
