import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  MapPin,
  BarChart2,
  Sparkles,
  Wheat,
  Wallet,
  CloudSun,
  Bot,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Clock,
  Compass,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import farmerHeroImg from '../assets/farmer_hero.jpg';
import '../styles/landing.css';

export default function LandingPage() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('top');

  // Track active section on scroll for subtle navbar active state
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['transparency', 'how-it-works', 'features', 'top'];
      const scrollPosition = window.scrollY + 140;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el && scrollPosition >= el.offsetTop) {
          setActiveSection(sectionId);
          return;
        }
      }
      setActiveSection('top');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Set document title & meta description for SEO
  useEffect(() => {
    document.title = 'Kissan Saathi – AI-Powered Agricultural Intelligence';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content =
      'Kissan Saathi helps Indian farmers understand mandi prices, compare markets, track farm expenses, monitor weather and access AI-powered agricultural decision support.';
  }, []);

  const getAuthLink = (path) => (user ? path : `/login?redirect=${encodeURIComponent(path)}&reason=feature`);

  const featureCards = [
    {
      title: t('landing.features.liveMarketTitle'),
      desc: t('landing.features.liveMarketDesc'),
      icon: TrendingUp,
      emoji: '📈',
      link: getAuthLink('/market'),
      color: '#2d6a4f'
    },
    {
      title: t('landing.features.nearbyTitle'),
      desc: t('landing.features.nearbyDesc'),
      icon: MapPin,
      emoji: '📍',
      link: getAuthLink('/nearby-mandis'),
      color: '#d97706'
    },
    {
      title: t('landing.features.historicalTitle'),
      desc: t('landing.features.historicalDesc'),
      icon: BarChart2,
      emoji: '📊',
      link: getAuthLink('/historical'),
      color: '#2563eb'
    },
    {
      title: t('landing.features.predictionTitle'),
      desc: t('landing.features.predictionDesc'),
      icon: Sparkles,
      emoji: '🤖',
      link: getAuthLink('/prediction'),
      color: '#7c3aed'
    },
    {
      title: t('landing.features.sellDecisionTitle'),
      desc: t('landing.features.sellDecisionDesc'),
      icon: Wheat,
      emoji: '🌾',
      link: getAuthLink('/sell-decision'),
      color: '#059669'
    },
    {
      title: t('landing.features.expensesTitle'),
      desc: t('landing.features.expensesDesc'),
      icon: Wallet,
      emoji: '💰',
      link: getAuthLink('/expenses'),
      color: '#b45309'
    },
    {
      title: t('landing.features.weatherTitle'),
      desc: t('landing.features.weatherDesc'),
      icon: CloudSun,
      emoji: '🌦️',
      link: getAuthLink('/weather'),
      color: '#0284c7'
    },
    {
      title: t('landing.features.assistantTitle'),
      desc: t('landing.features.assistantDesc'),
      icon: Bot,
      emoji: '💬',
      link: getAuthLink('/ai-assistant'),
      color: '#4f46e5'
    }
  ];

  return (
    <div className="landing-page-root" id="top">
      {/* ==============================================================================
         1. LANDING NAVBAR
         ============================================================================== */}
      <header className="landing-navbar" role="banner">
        <div className="landing-navbar-inner">
          {/* Logo & Brand (Clean Kissan Saathi brand) */}
          <Link to="/" className="landing-brand" aria-label="Kissan Saathi Home">
            <span className="landing-brand-logo" aria-hidden="true">🌾</span>
            <span className="landing-brand-name">Kissan Saathi</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="landing-nav-links" aria-label="Landing Page Navigation">
            <a href="#top" className={`landing-nav-link ${activeSection === 'top' ? 'active' : ''}`}>
              {t('landing.nav.home')}
            </a>
            <Link to={getAuthLink('/market')} className="landing-nav-link">
              {t('landing.nav.market')}
            </Link>
            <a href="#features" className={`landing-nav-link ${activeSection === 'features' ? 'active' : ''}`}>
              {t('landing.nav.features')}
            </a>
            <a href="#how-it-works" className={`landing-nav-link ${activeSection === 'how-it-works' ? 'active' : ''}`}>
              {t('landing.nav.howItWorks')}
            </a>
            <Link to={getAuthLink('/weather')} className="landing-nav-link">
              {t('landing.nav.weather')}
            </Link>
            <a href="#transparency" className={`landing-nav-link ${activeSection === 'transparency' ? 'active' : ''}`}>
              {t('landing.nav.about')}
            </a>
          </nav>

          {/* Right Actions: Desktop (Language + Auth) & Mobile Toggle */}
          <div className="landing-nav-actions">
            <div className="landing-nav-actions-desktop">
              <LanguageSwitcher compact={true} className="landing-language-switcher" />

              {user ? (
                <Link to="/dashboard" className="landing-nav-cta">
                  <Layers size={16} />
                  <span>{t('landing.nav.dashboard')}</span>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="landing-nav-login">
                    {t('landing.nav.login')}
                  </Link>
                  <Link to="/login" className="landing-nav-cta">
                    <span>{t('landing.nav.getStarted')}</span>
                    <span className="cta-arrow" aria-hidden="true">→</span>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="landing-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="landing-mobile-menu" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
            <nav className="landing-mobile-nav-links">
              <a href="#top" className="landing-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                {t('landing.nav.home')}
              </a>
              <Link to={getAuthLink('/market')} className="landing-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                {t('landing.nav.market')}
              </Link>
              <a href="#features" className="landing-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                {t('landing.nav.features')}
              </a>
              <a href="#how-it-works" className="landing-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                {t('landing.nav.howItWorks')}
              </a>
              <Link to={getAuthLink('/weather')} className="landing-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                {t('landing.nav.weather')}
              </Link>
              <a href="#transparency" className="landing-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                {t('landing.nav.about')}
              </a>
            </nav>

            {/* Mobile Language Switcher */}
            <div className="landing-mobile-lang-row">
              <span className="landing-mobile-lang-label">
                🌐 {language === 'hi' ? 'भाषा' : language === 'mr' ? 'भाषा' : 'Language'}:
              </span>
              <LanguageSwitcher compact={false} className="landing-mobile-lang-switcher" />
            </div>

            {/* Mobile Auth Actions */}
            <div className="landing-mobile-auth-actions">
              {user ? (
                <Link
                  to="/dashboard"
                  className="landing-mobile-cta"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Layers size={18} />
                  <span>{t('landing.nav.dashboard')}</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="landing-mobile-login"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('landing.nav.login')}
                  </Link>
                  <Link
                    to="/login"
                    className="landing-mobile-cta"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>{t('landing.nav.getStarted')}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ==============================================================================
         2. HERO SECTION
         ============================================================================== */}
      <section className="landing-hero" aria-labelledby="hero-heading">
        <div className="landing-container">
          <div className="landing-hero-grid">
            {/* Left Content */}
            <div className="landing-hero-content">
              <div className="landing-hero-badge">
                <span>🌱</span>
                <span>{t('landing.hero.badge')}</span>
              </div>
              <h1 id="hero-heading" className="landing-hero-title">
                {t('landing.hero.headline')}
              </h1>
              <p className="landing-hero-subtitle">
                {t('landing.hero.supporting')}
              </p>

              <div className="landing-hero-ctas">
                {user ? (
                  <Link to="/dashboard" className="btn-landing-primary">
                    <Layers size={18} />
                    <span>{t('landing.hero.dashboardCta')}</span>
                  </Link>
                ) : (
                  <Link to="/login" className="btn-landing-primary">
                    <span>{t('landing.hero.primaryCta')}</span>
                    <ArrowRight size={18} />
                  </Link>
                )}
                <Link to={getAuthLink('/market')} className="btn-landing-secondary">
                  <TrendingUp size={18} />
                  <span>{t('landing.hero.secondaryCta')}</span>
                </Link>
              </div>
            </div>

            {/* Right Visual Frame */}
            <div className="landing-hero-visual-wrapper">
              <div className="landing-hero-image-card">
                <img
                  src={farmerHeroImg}
                  alt={t('landing.hero.imgAlt')}
                  className="landing-hero-image"
                  loading="eager"
                />
                <div className="landing-hero-floating-badge">
                  <div>
                    <div className="hero-badge-title">Agmarknet Verified</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--lp-text-dark)', fontWeight: 600 }}>
                      Wheat • Agra Mandi
                    </div>
                  </div>
                  <div className="hero-badge-val">₹2,450 / q</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================================
         3. TRUST / VALUE STRIP
         ============================================================================== */}
      <section className="landing-trust-strip" aria-label="Key Value Pillars">
        <div className="landing-container">
          <div className="landing-trust-grid">
            <div className="landing-trust-item">{t('landing.trustStrip.market')}</div>
            <div className="landing-trust-item">{t('landing.trustStrip.weather')}</div>
            <div className="landing-trust-item">{t('landing.trustStrip.economics')}</div>
            <div className="landing-trust-item">{t('landing.trustStrip.ai')}</div>
          </div>
        </div>
      </section>

      {/* ==============================================================================
         4. "WHAT KISSANSAATHI DOES" (8 Feature Cards)
         ============================================================================== */}
      <section className="landing-section" id="features" aria-labelledby="features-heading">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-tag">Platform Features</span>
            <h2 id="features-heading" className="landing-section-title">
              {t('landing.features.title')}
            </h2>
            <p className="landing-section-subtitle">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="landing-features-grid">
            {featureCards.map((card, idx) => (
              <Link to={card.link} key={idx} className="landing-feature-card">
                <div className="landing-feature-icon" style={{ color: card.color }}>
                  <span>{card.emoji}</span>
                </div>
                <h3 className="landing-feature-title">{card.title}</h3>
                <p className="landing-feature-desc">{card.desc}</p>
                <div className="landing-feature-link-text">
                  <span>Explore</span>
                  <ChevronRight size={15} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ==============================================================================
         5. MARKET-FIRST FOCUS (Core Market Intelligence)
         ============================================================================== */}
      <section className="landing-section landing-section-alt" id="market-section">
        <div className="landing-container">
          <div className="landing-split-layout">
            <div className="landing-split-content">
              <span className="landing-section-tag">Market Transparency</span>
              <h2 className="landing-section-title">
                {t('landing.marketSection.title')}
              </h2>
              <p className="landing-hero-subtitle">
                {t('landing.marketSection.text')}
              </p>
              <Link to={getAuthLink('/market')} className="btn-landing-primary" style={{ marginTop: '0.5rem' }}>
                <TrendingUp size={18} />
                <span>{t('landing.marketSection.cta')}</span>
              </Link>
            </div>

            <div className="landing-split-visual">
              <div className="landing-mockup-card">
                <div className="mockup-header-badge">
                  <ShieldCheck size={14} />
                  <span>Verified Wholesale Auction Benchmark</span>
                </div>
                <div className="mockup-data-grid">
                  <div className="mockup-data-cell">
                    <div className="mockup-data-label">{t('landing.marketSection.cropLabel')}</div>
                    <div className="mockup-data-val">{t('landing.marketSection.wheat')}</div>
                  </div>
                  <div className="mockup-data-cell">
                    <div className="mockup-data-label">{t('landing.marketSection.modalPriceLabel')}</div>
                    <div className="mockup-data-val" style={{ color: 'var(--lp-primary)' }}>
                      {t('landing.marketSection.modalPriceVal')}
                    </div>
                  </div>
                </div>
                <div className="mockup-data-cell" style={{ marginBottom: '1.25rem' }}>
                  <div className="mockup-data-label">{t('landing.marketSection.nearbyLabel')}</div>
                  <div style={{ fontWeight: 700, color: 'var(--lp-text-dark)', fontSize: '0.95rem' }}>
                    {t('landing.marketSection.nearbyVal')}
                  </div>
                </div>
                <p className="mockup-disclaimer">
                  {t('landing.marketSection.disclaimer')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================================
         6. HISTORICAL INTELLIGENCE SECTION
         ============================================================================== */}
      <section className="landing-section" id="historical-section">
        <div className="landing-container">
          <div className="landing-split-layout landing-split-reverse">
            <div className="landing-split-content">
              <span className="landing-section-tag">10-Year Trend Intelligence</span>
              <h2 className="landing-section-title">
                {t('landing.historicalSection.title')}
              </h2>
              <p className="landing-hero-subtitle">
                {t('landing.historicalSection.text')}
              </p>
              <Link to={getAuthLink('/historical')} className="btn-landing-primary" style={{ marginTop: '0.5rem' }}>
                <BarChart2 size={18} />
                <span>{t('landing.historicalSection.cta')}</span>
              </Link>
            </div>

            <div className="landing-split-visual">
              <div className="landing-mockup-card">
                <div className="mockup-header-badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                  <BarChart2 size={14} />
                  <span>Historical Price Trends (Wheat)</span>
                </div>

                <div className="mockup-chart-container">
                  <div className="mockup-chart-row">
                    <span className="mockup-chart-month">Apr</span>
                    <div className="mockup-chart-bar-bg">
                      <div className="mockup-chart-bar-fill" style={{ width: '65%' }}></div>
                    </div>
                    <span className="mockup-chart-rate">₹2,280</span>
                  </div>
                  <div className="mockup-chart-row">
                    <span className="mockup-chart-month">May</span>
                    <div className="mockup-chart-bar-bg">
                      <div className="mockup-chart-bar-fill" style={{ width: '85%' }}></div>
                    </div>
                    <span className="mockup-chart-rate">₹2,450</span>
                  </div>
                  <div className="mockup-chart-row">
                    <span className="mockup-chart-month">Jun</span>
                    <div className="mockup-chart-bar-bg">
                      <div className="mockup-chart-bar-fill" style={{ width: '92%' }}></div>
                    </div>
                    <span className="mockup-chart-rate">₹2,520</span>
                  </div>
                </div>

                <div className="mockup-data-grid">
                  <div className="mockup-data-cell">
                    <div className="mockup-data-label">{t('landing.historicalSection.bestMonthLabel')}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--lp-text-dark)' }}>
                      {t('landing.historicalSection.bestMonthVal')}
                    </div>
                  </div>
                  <div className="mockup-data-cell">
                    <div className="mockup-data-label">{t('landing.historicalSection.avgPriceLabel')}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--lp-text-dark)' }}>
                      {t('landing.historicalSection.avgPriceVal')}
                    </div>
                  </div>
                </div>

                <p className="mockup-disclaimer">
                  ⚠️ {t('landing.historicalSection.disclaimer')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================================
         7. FARM ECONOMICS SECTION
         ============================================================================== */}
      <section className="landing-section landing-section-alt" id="economics-section">
        <div className="landing-container">
          <div className="landing-split-layout">
            <div className="landing-split-content">
              <span className="landing-section-tag">Farm Economics</span>
              <h2 className="landing-section-title">
                {t('landing.expensesSection.title')}
              </h2>
              <p className="landing-hero-subtitle">
                {t('landing.expensesSection.text')}
              </p>
              <Link to={getAuthLink('/expenses')} className="btn-landing-primary" style={{ marginTop: '0.5rem' }}>
                <Wallet size={18} />
                <span>{t('landing.expensesSection.cta')}</span>
              </Link>
            </div>

            <div className="landing-split-visual">
              <div className="landing-mockup-card">
                <div className="mockup-header-badge" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                  <Wallet size={14} />
                  <span>Farm Expense & Break-Even Ledger</span>
                </div>

                <div className="mockup-data-grid">
                  <div className="mockup-data-cell">
                    <div className="mockup-data-label">{t('landing.expensesSection.areaLabel')}</div>
                    <div className="mockup-data-val">{t('landing.expensesSection.areaVal')}</div>
                  </div>
                  <div className="mockup-data-cell">
                    <div className="mockup-data-label">{t('landing.expensesSection.totalCostLabel')}</div>
                    <div className="mockup-data-val">{t('landing.expensesSection.totalCostVal')}</div>
                  </div>
                  <div className="mockup-data-cell">
                    <div className="mockup-data-label">{t('landing.expensesSection.revenueLabel')}</div>
                    <div className="mockup-data-val">{t('landing.expensesSection.revenueVal')}</div>
                  </div>
                  <div className="mockup-data-cell">
                    <div className="mockup-data-label">{t('landing.expensesSection.profitLabel')}</div>
                    <div className="mockup-data-val" style={{ color: 'var(--lp-primary)' }}>
                      {t('landing.expensesSection.profitVal')}
                    </div>
                  </div>
                </div>

                <p className="mockup-disclaimer">
                  🔒 {t('landing.expensesSection.note')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================================
         8. WEATHER SECTION
         ============================================================================== */}
      <section className="landing-section" id="weather-section">
        <div className="landing-container">
          <div className="landing-split-layout landing-split-reverse">
            <div className="landing-split-content">
              <span className="landing-section-tag">Agricultural Meteorology</span>
              <h2 className="landing-section-title">
                {t('landing.weatherSection.title')}
              </h2>
              <p className="landing-hero-subtitle">
                {t('landing.weatherSection.text')}
              </p>
              <Link to={getAuthLink('/weather')} className="btn-landing-primary" style={{ marginTop: '0.5rem' }}>
                <CloudSun size={18} />
                <span>{t('landing.weatherSection.cta')}</span>
              </Link>
            </div>

            <div className="landing-split-visual">
              <div className="landing-mockup-card">
                <div className="mockup-header-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                  <CloudSun size={14} />
                  <span>Localized Agricultural Weather</span>
                </div>

                <div className="mockup-data-grid">
                  <div className="mockup-data-cell">
                    <div className="mockup-data-label">🌡️ {t('landing.weatherSection.tempLabel')}</div>
                    <div className="mockup-data-val">31°C</div>
                  </div>
                  <div className="mockup-data-cell">
                    <div className="mockup-data-label">🌧️ {t('landing.weatherSection.rainLabel')}</div>
                    <div className="mockup-data-val">15%</div>
                  </div>
                  <div className="mockup-data-cell">
                    <div className="mockup-data-label">💧 {t('landing.weatherSection.humidityLabel')}</div>
                    <div className="mockup-data-val">58%</div>
                  </div>
                  <div className="mockup-data-cell">
                    <div className="mockup-data-label">💨 {t('landing.weatherSection.windLabel')}</div>
                    <div className="mockup-data-val">12 km/h</div>
                  </div>
                </div>

                <div className="mockup-data-cell" style={{ marginBottom: '1.25rem' }}>
                  <div className="mockup-data-label">⚠️ {t('landing.weatherSection.alertsLabel')}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--lp-text-dark)' }}>
                    {t('landing.weatherSection.alertsVal')}
                  </div>
                </div>

                <p className="mockup-disclaimer">
                  🌦️ {t('landing.weatherSection.note')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================================
         9. AI ASSISTANT SECTION
         ============================================================================== */}
      <section className="landing-section landing-section-alt" id="ai-section">
        <div className="landing-container">
          <div className="landing-split-layout">
            <div className="landing-split-content">
              <span className="landing-section-tag">AI Decision Support</span>
              <h2 className="landing-section-title">
                {t('landing.aiSection.title')}
              </h2>
              <p className="landing-hero-subtitle">
                {t('landing.aiSection.text')}
              </p>
              <Link to={getAuthLink('/ai-assistant')} className="btn-landing-primary" style={{ marginTop: '0.5rem' }}>
                <Bot size={18} />
                <span>{t('landing.aiSection.cta')}</span>
              </Link>
            </div>

            <div className="landing-split-visual">
              <div className="landing-mockup-card">
                <div className="mockup-header-badge" style={{ backgroundColor: '#ede9fe', color: '#6d28d9' }}>
                  <Bot size={14} />
                  <span>Conversational Assistant Preview</span>
                </div>

                <div className="chat-preview-box">
                  <div className="chat-bubble-farmer">
                    {t('landing.aiSection.q1')}
                  </div>
                  <div className="chat-bubble-ai">
                    {language === 'hi'
                      ? 'आज आगरा मंडी में गेहूं का मॉडल भाव ₹2,450/क्विंटल दर्ज हुआ है। आवक सामान्य है और भाव पिछले सप्ताह से स्थिर बने हुए हैं।'
                      : language === 'mr'
                      ? 'आज आग्रा बाजार समितीत गव्हाचा सरासरी भाव ₹२,४५०/क्विंटल नोंदवला गेला आहे. आवक सामान्य असून मागील आठवड्यापासून भाव स्थिर आहेत.'
                      : 'Today, the modal price for Wheat in Agra APMC is recorded at ₹2,450 per quintal. Market arrivals are normal with steady benchmark prices.'}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', background: '#faf9f5', border: '1px solid var(--lp-border)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--lp-text-muted)' }}>
                    {t('landing.aiSection.q2')}
                  </span>
                  <span style={{ fontSize: '0.75rem', background: '#faf9f5', border: '1px solid var(--lp-border)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--lp-text-muted)' }}>
                    {t('landing.aiSection.q3')}
                  </span>
                </div>

                <p className="mockup-disclaimer">
                  💡 {t('landing.aiSection.transparencyNote')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================================
         10. MULTILINGUAL SECTION
         ============================================================================== */}
      <section className="landing-section" id="multilingual-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-tag">Inclusive Design</span>
            <h2 className="landing-section-title">
              {t('landing.multilingual.title')}
            </h2>
            <p className="landing-section-subtitle">
              {t('landing.multilingual.text')}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', padding: '0.6rem 1.25rem', borderRadius: 'var(--lp-radius-pill)', border: '1px solid var(--lp-border)', boxShadow: 'var(--lp-shadow-sm)' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--lp-forest)' }}>
                {t('landing.multilingual.prompt')}
              </span>
              <LanguageSwitcher />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'var(--lp-mint)', color: 'var(--lp-primary)', padding: '0.35rem 0.85rem', borderRadius: 'var(--lp-radius-pill)', fontSize: '0.85rem', fontWeight: 700 }}>
              ✓ {t('landing.multilingual.langEn')}
            </span>
            <span style={{ background: 'var(--lp-mint)', color: 'var(--lp-primary)', padding: '0.35rem 0.85rem', borderRadius: 'var(--lp-radius-pill)', fontSize: '0.85rem', fontWeight: 700 }}>
              ✓ {t('landing.multilingual.langHi')}
            </span>
            <span style={{ background: 'var(--lp-mint)', color: 'var(--lp-primary)', padding: '0.35rem 0.85rem', borderRadius: 'var(--lp-radius-pill)', fontSize: '0.85rem', fontWeight: 700 }}>
              ✓ {t('landing.multilingual.langMr')}
            </span>
            <span style={{ background: 'var(--lp-mint)', color: 'var(--lp-primary)', padding: '0.35rem 0.85rem', borderRadius: 'var(--lp-radius-pill)', fontSize: '0.85rem', fontWeight: 700 }}>
              ✓ {t('landing.multilingual.langHinglish')}
            </span>
          </div>
        </div>
      </section>

      {/* ==============================================================================
         11. HOW IT WORKS (3 Steps)
         ============================================================================== */}
      <section className="landing-section landing-section-alt" id="how-it-works">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-tag">Simple Process</span>
            <h2 className="landing-section-title">
              {t('landing.howItWorks.title')}
            </h2>
            <p className="landing-section-subtitle">
              {t('landing.howItWorks.subtitle')}
            </p>
          </div>

          <div className="landing-steps-grid">
            <div className="landing-step-card">
              <div className="landing-step-number">1</div>
              <h3 className="landing-step-title">{t('landing.howItWorks.step1Title')}</h3>
              <p className="landing-step-desc">{t('landing.howItWorks.step1Desc')}</p>
            </div>
            <div className="landing-step-card">
              <div className="landing-step-number">2</div>
              <h3 className="landing-step-title">{t('landing.howItWorks.step2Title')}</h3>
              <p className="landing-step-desc">{t('landing.howItWorks.step2Desc')}</p>
            </div>
            <div className="landing-step-card">
              <div className="landing-step-number">3</div>
              <h3 className="landing-step-title">{t('landing.howItWorks.step3Title')}</h3>
              <p className="landing-step-desc">{t('landing.howItWorks.step3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================================
         12. WHY KISSANSAATHI (7 Honest Benefits)
         ============================================================================== */}
      <section className="landing-section" id="why-us">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-tag">Trust & Integrity</span>
            <h2 className="landing-section-title">
              {t('landing.whyUs.title')}
            </h2>
            <p className="landing-section-subtitle">
              {t('landing.whyUs.subtitle')}
            </p>
          </div>

          <div className="landing-why-grid">
            <div className="landing-why-item">
              <span className="landing-why-check">✓</span>
              <span className="landing-why-text">{t('landing.whyUs.p1')}</span>
            </div>
            <div className="landing-why-item">
              <span className="landing-why-check">✓</span>
              <span className="landing-why-text">{t('landing.whyUs.p2')}</span>
            </div>
            <div className="landing-why-item">
              <span className="landing-why-check">✓</span>
              <span className="landing-why-text">{t('landing.whyUs.p3')}</span>
            </div>
            <div className="landing-why-item">
              <span className="landing-why-check">✓</span>
              <span className="landing-why-text">{t('landing.whyUs.p4')}</span>
            </div>
            <div className="landing-why-item">
              <span className="landing-why-check">✓</span>
              <span className="landing-why-text">{t('landing.whyUs.p5')}</span>
            </div>
            <div className="landing-why-item">
              <span className="landing-why-check">✓</span>
              <span className="landing-why-text">{t('landing.whyUs.p6')}</span>
            </div>
            <div className="landing-why-item" style={{ gridColumn: '1 / -1' }}>
              <span className="landing-why-check">✓</span>
              <span className="landing-why-text">{t('landing.whyUs.p7')}</span>
            </div>
          </div>

          <div className="landing-why-disclaimer">
            {t('landing.whyUs.noFakeClaims')}
          </div>
        </div>
      </section>

      {/* ==============================================================================
         13. DATA TRANSPARENCY
         ============================================================================== */}
      <section className="landing-section" id="transparency" style={{ paddingTop: '1rem' }}>
        <div className="landing-container">
          <div className="landing-transparency-card">
            <span style={{ fontSize: '0.8rem', color: '#b7e4c7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Data Integrity
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0 0.85rem 0' }}>
              {t('landing.transparency.title')}
            </h2>
            <p style={{ color: '#d1fae5', fontSize: '1.05rem', margin: 0, maxWidth: '640px' }}>
              {t('landing.transparency.subtitle')}
            </p>

            <div className="transparency-grid">
              <div className="transparency-col">
                <h3 className="transparency-col-title">
                  <ShieldCheck size={20} />
                  <span>{t('landing.transparency.dataSourceTitle')}</span>
                </h3>
                <p className="transparency-col-text">
                  {t('landing.transparency.dataSourceDesc')}
                </p>
              </div>

              <div className="transparency-col">
                <h3 className="transparency-col-title">
                  <Sparkles size={20} />
                  <span>{t('landing.transparency.aiExplTitle')}</span>
                </h3>
                <p className="transparency-col-text">
                  {t('landing.transparency.aiExplDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================================
         14. FINAL CALL TO ACTION (CTA)
         ============================================================================== */}
      <section className="landing-final-cta" aria-labelledby="final-cta-heading">
        <div className="landing-container">
          <div className="landing-final-cta-inner">
            <h2 id="final-cta-heading" className="landing-final-cta-title">
              {t('landing.finalCta.title')}
            </h2>
            <p className="landing-final-cta-text">
              {t('landing.finalCta.text')}
            </p>

            <div className="landing-final-cta-buttons">
              {user ? (
                <Link to="/dashboard" className="btn-landing-primary">
                  <Layers size={18} />
                  <span>{t('landing.finalCta.dashboardBtn')}</span>
                </Link>
              ) : (
                <Link to="/login" className="btn-landing-primary">
                  <span>{t('landing.finalCta.primaryBtn')}</span>
                  <ArrowRight size={18} />
                </Link>
              )}
              <Link to={getAuthLink('/market')} className="btn-landing-secondary">
                <TrendingUp size={18} />
                <span>{t('landing.finalCta.secondaryBtn')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================================
         15. FOOTER
         ============================================================================== */}
      <footer className="landing-footer" role="contentinfo">
        <div className="landing-container">
          <div className="landing-footer-grid">
            {/* Col 1: Brand & Info */}
            <div>
              <div className="landing-footer-brand">
                <span>🌾</span>
                <span>Kissan Saathi</span>
              </div>
              <p className="landing-footer-tagline">
                {t('landing.footer.tagline')}
              </p>
            </div>

            {/* Col 2: Navigation Links */}
            <div>
              <div className="landing-footer-heading">{t('landing.footer.linksTitle')}</div>
              <ul className="landing-footer-links">
                <li><Link to={getAuthLink('/market')} className="landing-footer-link">{t('landing.footer.market')}</Link></li>
                <li><Link to={getAuthLink('/historical')} className="landing-footer-link">{t('landing.footer.historical')}</Link></li>
                <li><Link to={getAuthLink('/weather')} className="landing-footer-link">{t('landing.footer.weather')}</Link></li>
                <li><Link to={getAuthLink('/expenses')} className="landing-footer-link">{t('landing.footer.expenses')}</Link></li>
                <li><Link to={getAuthLink('/ai-assistant')} className="landing-footer-link">{t('landing.footer.assistant')}</Link></li>
              </ul>
            </div>

            {/* Col 3: Data Sources & Disclaimer */}
            <div>
              <div className="landing-footer-heading">{t('landing.footer.dataSourceTitle')}</div>
              <p style={{ fontSize: '0.85rem', color: '#d1d5db', lineHeight: 1.55, margin: '0 0 1rem 0' }}>
                {t('landing.footer.dataSourceText')}
              </p>
              <div className="landing-footer-heading" style={{ fontSize: '0.85rem' }}>
                {t('landing.footer.disclaimerTitle')}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
                {t('landing.footer.disclaimerText')}
              </p>
            </div>
          </div>

          <div className="landing-footer-bottom">
            <div>{t('landing.footer.copyright')}</div>
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <span style={{ cursor: 'pointer' }}>{t('landing.footer.privacy')}</span>
              <span>•</span>
              <span style={{ cursor: 'pointer' }}>{t('landing.footer.terms')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
