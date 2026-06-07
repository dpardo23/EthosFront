import { useTranslation } from 'react-i18next';
import { usePreferencesStore } from '@/store/preferencesStore';
import { cn } from '@/shared/lib/utils';
import type { Language } from '@/shared/types';

/**
 * Dropdown selector for switching the application's display language via i18n.
 */
const LANGUAGES: { code: Language; flag: string; label: string; nativeLabel: string }[] = [
  { code: 'es', flag: '🇪🇸', label: 'settings.lang.es', nativeLabel: 'Español' },
  { code: 'en', flag: '🇬🇧', label: 'settings.lang.en', nativeLabel: 'English' },
  { code: 'pt', flag: '🇧🇷', label: 'settings.lang.pt', nativeLabel: 'Português' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const { updatePreferences } = usePreferencesStore();

  const handleChange = (lang: Language) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('ethoshub_language', lang);
    updatePreferences({ language: lang });
  };

  const current = i18n.language as Language;

  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label="Interface language">
      {LANGUAGES.map(({ code, flag, nativeLabel }) => {
        const isActive = current === code;
        return (
          <button
            key={code}
            role="radio"
            aria-checked={isActive}
            onClick={() => handleChange(code)}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-150 text-left',
              isActive
                ? 'border-violet-500 bg-violet-500/8 text-foreground shadow-sm shadow-violet-500/10'
                : 'border-border bg-transparent text-muted-foreground hover:border-violet-500/40 hover:bg-muted/40 hover:text-foreground',
            )}
          >
            <span className="text-base leading-none" aria-hidden="true">{flag}</span>
            <span>{nativeLabel}</span>
            {isActive && (
              <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-violet-500">
                <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 10 10">
                  <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
