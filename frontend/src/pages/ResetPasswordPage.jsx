import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import { KeyRound, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg(t('auth.reset.lengthError', 'Password must be at least 6 characters long.'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t('auth.reset.mismatchError', 'Passwords do not match. Please verify.'));
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, 2500);
    } catch (err) {
      setErrorMsg(err.message || t('auth.reset.updateFailed', 'Failed to update password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2rem 1.75rem', textAlign: 'center' }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: 'rgba(43, 138, 62, 0.1)',
          color: 'var(--primary-deep)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <KeyRound size={26} />
        </div>

        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>
          {t('auth.reset.title', 'Set New Password')}
        </h1>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '0.35rem', marginBottom: '1.5rem' }}>
          {t('auth.reset.subtitle', 'Choose a secure new password for your Kissan Saathi farmer account.')}
        </p>

        {errorMsg && (
          <div style={{
            backgroundColor: '#fff5f5',
            border: '1px solid #ffc9c9',
            color: '#c92a2a',
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            marginBottom: '1.25rem',
            textAlign: 'left'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div>{errorMsg}</div>
          </div>
        )}

        {success ? (
          <div style={{
            backgroundColor: '#ebfbee',
            border: '1px solid #b2f2bb',
            color: '#2b8a3e',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle size={24} />
            <div>{t('auth.reset.successMsg', 'Password updated successfully!')}</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('common.status.loading', 'Redirecting to your profile...')}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-password">{t('auth.reset.newPassword', 'New Password')} *</label>
              <input
                id="new-password"
                type="password"
                className="form-input"
                placeholder={t('auth.reset.newPasswordPlaceholder', 'Minimum 6 characters')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">{t('auth.reset.confirmNewPassword', 'Confirm New Password')} *</label>
              <input
                id="confirm-password"
                type="password"
                className="form-input"
                placeholder={t('auth.reset.confirmNewPasswordPlaceholder', 'Re-enter password')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

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
                marginTop: '0.5rem'
              }}
            >
              {loading ? t('auth.reset.updating', 'Updating...') : t('auth.reset.updateBtn', 'Save New Password')}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          <Link to="/login" style={{ color: 'var(--primary-deep)', fontSize: '0.84rem', fontWeight: 600, textDecoration: 'none' }}>
            {t('auth.backToLogin', '← Back to Login')}
          </Link>
        </div>
      </div>
    </div>
  );
}

