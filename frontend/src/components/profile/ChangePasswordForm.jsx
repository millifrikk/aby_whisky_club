import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import PasswordInput from '../security/PasswordInput';

const ChangePasswordForm = ({ onSuccess }) => {
  const { changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    requirements: {
      length: false,
      lowercase: false,
      uppercase: false,
      number: false,
      special: false
    }
  });

  const checkPasswordStrength = (password) => {
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^a-zA-Z0-9]/.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length;
    let feedback = '';

    switch (score) {
      case 0:
      case 1:
        feedback = 'Very weak';
        break;
      case 2:
        feedback = 'Weak';
        break;
      case 3:
        feedback = 'Fair';
        break;
      case 4:
        feedback = 'Good';
        break;
      case 5:
        feedback = 'Strong';
        break;
      default:
        feedback = 'Very weak';
    }

    setPasswordStrength({ score, feedback, requirements });
  };

  const handlePasswordChange = (value) => {
    setFormData(prev => ({ ...prev, new_password: value }));
    checkPasswordStrength(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.new_password !== formData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      await changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password
      });
      
      toast.success('Password changed successfully');
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error changing password:', error);
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      {/* Current Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.current ? 'text' : 'password'}
            value={formData.current_password}
            onChange={(e) => setFormData(prev => ({ ...prev, current_password: e.target.value }))}
            className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            required
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('current')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            {showPasswords.current ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          New Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.new ? 'text' : 'password'}
            value={formData.new_password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            required
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('new')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            {showPasswords.new ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        
        {/* Password Strength Indicator */}
        {formData.new_password && (
          <div className="mt-3">
            <div className="flex items-center">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    passwordStrength.score <= 2
                      ? 'bg-red-500'
                      : passwordStrength.score <= 3
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                />
              </div>
              <span className="ml-3 text-xs text-gray-600">
                {passwordStrength.feedback}
              </span>
            </div>
            
            {/* Password Requirements */}
            <div className="mt-2 grid grid-cols-1 gap-1">
              {Object.entries(passwordStrength.requirements).map(([key, met]) => {
                const labels = {
                  length: 'At least 8 characters',
                  lowercase: 'One lowercase letter',
                  uppercase: 'One uppercase letter',
                  number: 'One number',
                  special: 'One special character'
                };
                
                return (
                  <div key={key} className={`text-xs flex items-center ${met ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-1">{met ? '✓' : '○'}</span>
                    {labels[key]}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.confirm ? 'text' : 'password'}
            value={formData.confirm_password}
            onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
            className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            required
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('confirm')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        {formData.confirm_password && formData.new_password !== formData.confirm_password && (
          <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || formData.new_password !== formData.confirm_password || passwordStrength.score < 3}
          className="bg-amber-600 text-white py-2 px-6 rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;