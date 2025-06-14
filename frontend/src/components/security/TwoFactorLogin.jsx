import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const TwoFactorLogin = ({ tempUserId, onSuccess, onBack }) => {
  const { t } = useTranslation();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tempUserId,
          token: token.replace(/\s/g, '') // Remove any spaces
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify 2FA code');
      }

      // Store the token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenChange = (e) => {
    const value = e.target.value;
    if (useBackupCode) {
      // Backup codes can contain letters and numbers
      setToken(value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8));
    } else {
      // Regular 2FA codes are 6 digits
      setToken(value.replace(/\D/g, '').slice(0, 6));
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t('security.2fa.login.title', 'Two-Factor Authentication')}
          </h2>
          <p className="text-gray-600">
            {useBackupCode 
              ? t('security.2fa.login.backupPrompt', 'Enter one of your backup codes')
              : t('security.2fa.login.prompt', 'Enter the verification code from your authenticator app')
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {useBackupCode 
                ? t('security.2fa.backupCode', 'Backup Code')
                : t('security.2fa.verificationCode', 'Verification Code')
              }
            </label>
            <input
              type="text"
              value={token}
              onChange={handleTokenChange}
              placeholder={useBackupCode ? 'abc12345' : '123456'}
              className="w-full p-3 border border-gray-300 rounded-md text-center text-lg tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={useBackupCode ? 8 : 6}
              required
              autoComplete="one-time-code"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token || (useBackupCode ? token.length < 8 : token.length !== 6)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? t('common.verifying', 'Verifying...') : t('security.2fa.verify', 'Verify')}
          </button>
        </form>

        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={() => setUseBackupCode(!useBackupCode)}
            className="w-full text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {useBackupCode 
              ? t('security.2fa.login.useAuthenticator', 'Use authenticator app instead')
              : t('security.2fa.login.useBackupCode', 'Use backup code instead')
            }
          </button>
          
          <button
            type="button"
            onClick={onBack}
            className="w-full text-sm text-gray-600 hover:text-gray-800 underline"
          >
            {t('auth.backToLogin', 'Back to login')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorLogin;