import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import PasswordInput from './PasswordInput';

const TwoFactorSetup = ({ user, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState('password'); // password, setup, verify, complete
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/two-factor/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initiate 2FA setup');
      }

      setSetupData(data);
      setStep('setup');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/two-factor/verify-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ token: verificationCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify 2FA setup');
      }

      setBackupCodes(data.backupCodes);
      setStep('complete');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {t('security.2fa.setup.title', 'Set Up Two-Factor Authentication')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <p className="text-gray-600">
              {t('security.2fa.setup.passwordPrompt', 'Please enter your current password to set up two-factor authentication.')}
            </p>
            
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.currentPassword', 'Current Password')}
              required
              showStrength={false}
            />

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? t('common.loading', 'Loading...') : t('common.continue', 'Continue')}
            </button>
          </form>
        )}

        {step === 'setup' && setupData && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                {t('security.2fa.setup.scanQR', 'Scan this QR code with your authenticator app:')}
              </p>
              
              <div className="bg-white p-4 rounded-lg border inline-block">
                <QRCodeSVG 
                  value={setupData.qrCodeUrl} 
                  size={200}
                  level="M"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600 mb-2">
                {t('security.2fa.setup.manualEntry', 'Or enter this code manually:')}
              </p>
              <code className="text-xs bg-white p-2 rounded border block text-center break-all">
                {setupData.secret}
              </code>
            </div>

            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('security.2fa.verificationCode', 'Verification Code')}
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full p-2 border border-gray-300 rounded-md text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('security.2fa.setup.enterCode', 'Enter the 6-digit code from your authenticator app')}
                </p>
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? t('common.verifying', 'Verifying...') : t('security.2fa.verify', 'Verify & Enable 2FA')}
              </button>
            </form>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4">
            <div className="text-center text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-semibold">
                {t('security.2fa.setup.success', '2FA Successfully Enabled!')}
              </h3>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">
                {t('security.2fa.backupCodes.title', 'Backup Codes')}
              </h4>
              <p className="text-sm text-yellow-700 mb-3">
                {t('security.2fa.backupCodes.description', 'Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.')}
              </p>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                {backupCodes.map((code, index) => (
                  <code key={index} className="bg-white p-2 rounded text-center text-sm border">
                    {code}
                  </code>
                ))}
              </div>
              
              <button
                onClick={() => {
                  const text = backupCodes.join('\n');
                  navigator.clipboard.writeText(text);
                }}
                className="text-sm text-yellow-700 underline hover:text-yellow-800"
              >
                {t('security.2fa.backupCodes.copy', 'Copy to clipboard')}
              </button>
            </div>

            <button
              onClick={handleComplete}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              {t('common.done', 'Done')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSetup;