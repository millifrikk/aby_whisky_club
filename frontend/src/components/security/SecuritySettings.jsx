import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TwoFactorSetup from './TwoFactorSetup';

const SecuritySettings = ({ user, onUserUpdate }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sitewideEnabled, setSitewideEnabled] = useState(false);

  useEffect(() => {
    checkTwoFactorStatus();
  }, [user]);

  const checkTwoFactorStatus = async () => {
    try {
      const response = await fetch('/api/two-factor/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTwoFactorEnabled(data.enabled);
        setSitewideEnabled(data.sitewideEnabled);
      }
    } catch (err) {
      console.error('Failed to check 2FA status:', err);
    }
  };

  const handleDisable2FA = async () => {
    const password = prompt(t('security.2fa.disablePrompt', 'Enter your password to disable 2FA:'));
    if (!password) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/two-factor/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to disable 2FA');
      }

      setTwoFactorEnabled(false);
      setSuccess(t('security.2fa.disabled', '2FA has been disabled successfully'));
      onUserUpdate && onUserUpdate({ ...user, two_factor_enabled: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    const password = prompt(t('security.2fa.regeneratePrompt', 'Enter your password to regenerate backup codes:'));
    if (!password) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/two-factor/regenerate-backup-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to regenerate backup codes');
      }

      // Show backup codes in a modal or alert
      const codesText = data.backupCodes.join('\n');
      alert(`${t('security.2fa.newBackupCodes', 'New backup codes:')} \n\n${codesText}\n\n${t('security.2fa.saveBackupCodes', 'Please save these codes in a safe place.')}`);
      
      setSuccess(t('security.2fa.backupCodesRegenerated', 'Backup codes have been regenerated'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('security.title', 'Security Settings')}
        </h3>

        {!sitewideEnabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-yellow-800 font-medium">
                  {t('security.2fa.sitewideDisabled.title', '2FA Not Available')}
                </h4>
                <p className="text-yellow-700 text-sm mt-1">
                  {t('security.2fa.sitewideDisabled.description', 'Two-factor authentication is currently disabled site-wide. Contact an administrator to enable this feature.')}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                {t('security.2fa.title', 'Two-Factor Authentication')}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {twoFactorEnabled 
                  ? t('security.2fa.enabled', 'Your account is protected with 2FA')
                  : t('security.2fa.disabled', 'Add an extra layer of security to your account')
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {twoFactorEnabled ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {t('security.enabled', 'Enabled')}
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {t('security.disabled', 'Disabled')}
                </span>
              )}
            </div>
          </div>

          {sitewideEnabled && (
            <div className="flex flex-wrap gap-2">
              {!twoFactorEnabled ? (
                <button
                  onClick={() => setShowTwoFactorSetup(true)}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {t('security.2fa.enable', 'Enable 2FA')}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleDisable2FA}
                    disabled={loading}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
                  >
                    {loading ? t('common.loading', 'Loading...') : t('security.2fa.disable', 'Disable 2FA')}
                  </button>
                  <button
                    onClick={handleRegenerateBackupCodes}
                    disabled={loading}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 text-sm"
                  >
                    {loading ? t('common.loading', 'Loading...') : t('security.2fa.regenerateBackupCodes', 'Regenerate Backup Codes')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <span className="text-red-700 text-sm">{error}</span>
                <button 
                  onClick={clearMessages}
                  className="ml-2 text-red-600 hover:text-red-800 text-sm underline"
                >
                  {t('common.dismiss', 'Dismiss')}
                </button>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <span className="text-green-700 text-sm">{success}</span>
                <button 
                  onClick={clearMessages}
                  className="ml-2 text-green-600 hover:text-green-800 text-sm underline"
                >
                  {t('common.dismiss', 'Dismiss')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2FA Setup Modal */}
      {showTwoFactorSetup && (
        <TwoFactorSetup
          user={user}
          onClose={() => setShowTwoFactorSetup(false)}
          onSuccess={() => {
            setTwoFactorEnabled(true);
            setSuccess(t('security.2fa.setupSuccess', '2FA has been enabled successfully'));
            onUserUpdate && onUserUpdate({ ...user, two_factor_enabled: true });
          }}
        />
      )}
    </div>
  );
};

export default SecuritySettings;