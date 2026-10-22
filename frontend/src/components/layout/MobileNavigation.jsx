import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  TrendingUp,
  MapPin,
  Bell,
  Bot,
  X
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import LanguageSwitcher from '../common/LanguageSwitcher';
import Sidebar from './Sidebar';

export default function MobileNavigation({ isOpen, onClose }) {
  const { t } = useTranslation();

  const bottomItems = [
    { path: '/dashboard', key: 'home', defaultLabel: 'Home', icon: Home },
    { path: '/market', key: 'prices', defaultLabel: 'Prices', icon: TrendingUp },
    { path: '/nearby-mandis', key: 'nearby', defaultLabel: 'Nearby', icon: MapPin },
    { path: '/ai-assistant', key: 'aiChat', defaultLabel: 'AI Chat', icon: Bot },
    { path: '/alerts', key: 'alerts', defaultLabel: 'Alerts', icon: Bell }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="mobile-drawer-overlay" onClick={onClose} aria-hidden="true">
          <div
            className="mobile-drawer-content"
            onClick={(e) => e.stopPropagation()}
            aria-label="Mobile Navigation Menu"
          >
            <div className="mobile-drawer-header">
              <span style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '1.1rem' }}>
                🌾 {t('common.appName')}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LanguageSwitcher compact={true} />
                <button
                  onClick={onClose}
                  className="btn-close-drawer"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <Sidebar onCloseMobile={onClose} />
          </div>
        </div>
      )}

      {/* Compact Bottom Navigation Bar */}
      <nav className="mobile-bottom-bar" aria-label="Quick Mobile Navigation">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} className="bottom-nav-icon" />
              <span className="bottom-nav-label">
                {t(`common.navShort.${item.key}`, item.defaultLabel)}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
