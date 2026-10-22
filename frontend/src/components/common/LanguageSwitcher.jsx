import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation, SUPPORTED_LANGUAGES } from '../../i18n';

export default function LanguageSwitcher({ compact = false, style = {}, className = '' }) {
  const { language, changeLanguage } = useTranslation();

  return (
    <div
      className={`language-switcher ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-pill)',
        padding: '0.2rem 0.35rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        flexShrink: 0,
        ...style
      }}
      role="group"
      aria-label="Select Language / भाषा चुनें"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0 0.2rem', color: 'var(--primary-deep)', flexShrink: 0 }}>
        <Globe size={14} />
        {!compact && (
          <span style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            भाषा
          </span>
        )}
      </div>

      <div style={{ display: 'inline-flex', gap: '0.15rem', alignItems: 'center', flexShrink: 0 }}>
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isActive = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => changeLanguage(lang.code)}
              className={`language-switcher-btn ${isActive ? 'active' : ''}`.trim()}
              style={{
                border: 'none',
                backgroundColor: isActive ? 'var(--primary-deep, #143627)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-main, #192a20)',
                borderRadius: 'var(--radius-pill, 9999px)',
                padding: '0.22rem 0.55rem',
                fontSize: '0.78rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                outline: 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              title={lang.nativeName}
              aria-pressed={isActive}
            >
              {lang.nativeName}
            </button>
          );
        })}
      </div>
    </div>
  );
}

