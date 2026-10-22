import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import { LogIn, UserPlus, KeyRound, AlertCircle, CheckCircle, ArrowLeft, X } from 'lucide-react';

export default function LoginPage() {
  const { user, signIn, signUp, resetPassword } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';

  const [mode, setMode] = useState(initialTab); // 'login' | 'signup' | 'forgot'
  const [showToast, setShowToast] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredLang, setPreferredLang] = useState(language || 'en');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate, redirectPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn({ email, password });
        navigate(redirectPath, { replace: true });
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          throw new Error(t('auth.nameRequired', 'Please enter your full name.'));
        }
        if (password.length < 6) {
          throw new Error(t('auth.passwordLength', 'Password must be at least 6 characters long.'));
        }
        const data = await signUp({
          email,
          password,
          fullName: fullName.trim(),
          phone: phone.trim() || null,
          preferredLanguage: preferredLang
        });

        if (data?.session) {
          navigate(redirectPath, { replace: true });
        } else {
          setSuccessMsg(t('auth.accountCreated', 'Account created successfully! You can now log in.'));
          setMode('login');
        }
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg(t('auth.resetSent', 'Password reset instructions have been sent to your email address.'));
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || t('auth.invalidCreds', 'Authentication failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2.5rem auto', padding: '0 1rem', position: 'relative' }}>
      {/* Floating Farmer Login Required Toast Notification */}
      {showToast && (
        <aside
          className="farmer-login-floating-toast"
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: 'calc(100% - 2rem)',
            maxWidth: '560px',
            backgroundColor: '#fffbeb',
            border: '1.5px solid #f59e0b',
            boxShadow: '0 10px 25px -5px rgba(180, 83, 9, 0.2), 0 8px 10px -6px rgba(180, 83, 9, 0.08)',
            borderRadius: 'var(--radius-md, 12px)',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            animation: 'slideDownToast 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              backgroundColor: '#fef3c7',
              color: '#d97706',
              borderRadius: '50%',
              padding: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <AlertCircle size={18} />
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#92400e', lineHeight: 1.4 }}>
              {t('auth.loginRequired', 'Farmer Login Required: Please sign in or create an account to access this feature.')}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            aria-label="Close notification"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#b45309',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px',
              flexShrink: 0
            }}
          >
            <X size={18} />
          </button>
        </aside>
      )}

      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary-deep)', fontSize: '0.86rem', fontWeight: 600, textDecoration: 'none' }}>
          <ArrowLeft size={16} /> {t('common.actions.back', 'Back to Home')}
        </Link>
      </div>

      <div className="card" style={{ padding: '2rem 1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        {/* In-Card Farmer Login Required Notification Banner */}
        <div
          className="farmer-login-card-banner"
          role="status"
          style={{
            backgroundColor: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderLeft: '4px solid #d97706',
            color: '#92400e',
            borderRadius: 'var(--radius-sm, 8px)',
            padding: '0.8rem 0.95rem',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            marginBottom: '1.5rem',
            lineHeight: 1.45,
            boxShadow: '0 1px 4px rgba(217, 119, 6, 0.06)'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.12rem', color: '#d97706' }} />
          <div>
            <span style={{ fontWeight: 700, color: '#78350f' }}>
              {t('auth.loginRequiredPrefix', 'Farmer Login Required: ')}
            </span>
            <span>
              {t('auth.loginRequiredDetail', 'Please sign in or create an account to access this feature.')}
            </span>
          </div>
        </div>

        {/* Brand Banner */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '2.4rem', marginBottom: '0.3rem' }}>🌾</div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>
            {mode === 'login' ? t('auth.title', 'Farmer Login') : mode === 'signup' ? t('auth.signupTab', 'Create Farmer Account') : t('auth.reset.title', 'Reset Password')}
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {mode === 'login' 
              ? t('auth.subtitle', 'Sign in to access your farm records and expenses') 
              : mode === 'signup' 
              ? t('auth.subtitle', 'Secure, private agricultural management for your fields') 
              : t('auth.reset.subtitle', 'Enter your email to receive recovery instructions')}
          </p>
        </div>

        {/* Tab Toggle for Login / Signup */}
        {mode !== 'forgot' && (
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-subtle)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem'
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: mode === 'login' ? '#ffffff' : 'transparent',
                color: mode === 'login' ? 'var(--primary-deep)' : 'var(--text-muted)',
                fontWeight: mode === 'login' ? 700 : 500,
                cursor: 'pointer',
                boxShadow: mode === 'login' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                fontSize: '0.88rem'
              }}
            >
              {t('auth.loginTab', 'Sign In')}
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: mode === 'signup' ? '#ffffff' : 'transparent',
                color: mode === 'signup' ? 'var(--primary-deep)' : 'var(--text-muted)',
                fontWeight: mode === 'signup' ? 700 : 500,
                cursor: 'pointer',
                boxShadow: mode === 'signup' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                fontSize: '0.88rem'
              }}
            >
              {t('auth.signupTab', 'Sign Up')}
            </button>
          </div>
        )}

        {/* Status Alerts */}
        {errorMsg && (
          <div style={{
            backgroundColor: '#fff5f5',
            border: '1px solid #ffc9c9',
            color: '#c92a2a',
            padding: '0.75rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div style={{
            backgroundColor: '#ebfbee',
            border: '1px solid #b2f2bb',
            color: '#2b8a3e',
            padding: '0.75rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <div>{successMsg}</div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Sign-up specific fields */}
          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="full-name">{t('auth.fullNameLabel', 'Full Name')} *</label>
                <input
                  id="full-name"
                  type="text"
                  className="form-input"
                  placeholder={t('auth.fullNamePlaceholder', 'e.g. Ramesh Kumar Patel')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone-num">{t('auth.phoneLabel', 'Mobile Number (Optional)')}</label>
                <input
                  id="phone-num"
                  type="tel"
                  className="form-input"
                  placeholder={t('auth.phonePlaceholder', 'e.g. 9876543210')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={15}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lang-pref">{t('auth.preferredLangLabel', 'Preferred Language')}</label>
                <select
                  id="lang-pref"
                  className="form-select"
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>
            </>
          )}

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">{t('auth.emailLabel', 'Email Address')} *</label>
            <input
              id="email-input"
              type="email"
              className="form-input"
              placeholder={t('auth.emailPlaceholder', 'farmer@example.com')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password (for login and signup) */}
          {mode !== 'forgot' && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" htmlFor="password-input" style={{ marginBottom: 0 }}>{t('auth.passwordLabel', 'Password')} *</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMsg(null); setSuccessMsg(null); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-deep)', fontSize: '0.78rem', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                  >
                    {t('auth.forgotPasswordPrompt', 'Forgot Password?')}
                  </button>
                )}
              </div>
              <input
                id="password-input"
                type="password"
                className="form-input"
                placeholder={t('auth.passwordPlaceholder', 'Minimum 6 characters')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              marginTop: '0.5rem'
            }}
          >
            {loading ? (
              <span>{t('auth.loggingIn', 'Please wait...')}</span>
            ) : mode === 'login' ? (
              <>
                <LogIn size={17} /> {t('auth.loginBtn', 'Log In')}
              </>
            ) : mode === 'signup' ? (
              <>
                <UserPlus size={17} /> {t('auth.signupBtn', 'Create Account')}
              </>
            ) : (
              <>
                <KeyRound size={17} /> {t('auth.forgotBtn', 'Send Reset Link')}
              </>
            )}
          </button>
        </form>

        {/* Back to Login option if in forgot mode */}
        {mode === 'forgot' && (
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary-deep)', fontSize: '0.84rem', cursor: 'pointer', fontWeight: 600 }}
            >
              {t('auth.backToLogin', '← Back to Sign In')}
            </button>
          </div>
        )}

        {/* Privacy Note */}
        <div style={{ marginTop: '1.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', textAlign: 'center', fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          🔒 {t('landing.transparency.subtitle', 'Your information is used to personalize your Kissan Saathi experience and manage your farm records. We never share your data.')}
        </div>
      </div>
    </div>
  );
}
