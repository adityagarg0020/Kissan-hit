import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import PriceTicker from '../common/PriceTicker';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileNavigation from './MobileNavigation';
import AiChatBubble from '../common/AiChatBubble';
import { useTranslation } from '../../i18n';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="app-shell">
      {/* 1. Global Live Price Ticker (RIGHT -> LEFT continuous marquee) */}
      <PriceTicker />

      <div className="app-body-layout">
        {/* 2. Desktop Persistent Sidebar */}
        <div className="desktop-sidebar-container">
          <Sidebar />
        </div>

        {/* 3. Main Workspace Area */}
        <div className="main-viewport-container">
          {/* Top Navbar */}
          <Navbar onToggleMobileMenu={() => setMobileMenuOpen(true)} />

          {/* Dedicated Page View Outlet */}
          <main className="content-outlet">
            <Outlet />
          </main>

          {/* Standardized Footer */}
          <footer className="global-app-footer">
            <p>
              <strong>{t('common.footer.title')}</strong>
            </p>
            <p style={{ marginTop: '0.25rem' }}>
              {t('common.footer.dataSource')}
            </p>
            <p style={{ marginTop: '0.25rem', fontSize: '0.74rem' }}>
              {t('common.footer.disclaimer')}
            </p>
          </footer>
        </div>
      </div>

      {/* 4. Mobile Navigation (Drawer + Compact Bottom Bar) */}
      <MobileNavigation
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* 5. Floating AI Assistant Chat Bubble */}
      <AiChatBubble />
    </div>
  );
}
