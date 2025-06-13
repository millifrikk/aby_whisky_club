import React from 'react';
import { useComparison } from '../../contexts/ComparisonContext';
import { useAuth } from '../../contexts/AuthContext';

const ComparisonButton = ({ 
  whisky, 
  size = 'md', 
  variant = 'button', // 'button', 'icon', 'checkbox'
  className = '',
  showText = true 
}) => {
  const { isAuthenticated } = useAuth();
  const { 
    isEnabled, 
    isInComparison, 
    toggleComparison,
    selectionCount,
    maxSelectionReached
  } = useComparison();

  if (!isEnabled || !isAuthenticated) {
    return null;
  }

  const inComparison = isInComparison(whisky.id);
  const canAdd = !maxSelectionReached || inComparison;

  const handleToggleComparison = () => {
    if (canAdd || inComparison) {
      toggleComparison(whisky);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (variant === 'checkbox') {
    return (
      <label 
        className={`inline-flex items-center cursor-pointer ${className}`}
        title={
          inComparison 
            ? 'Remove from comparison' 
            : !canAdd 
              ? 'Maximum 10 whiskies can be compared'
              : 'Add to comparison'
        }
      >
        <input
          type="checkbox"
          checked={inComparison}
          onChange={handleToggleComparison}
          disabled={!canAdd && !inComparison}
          className="sr-only"
        />
        <div className={`
          relative inline-flex items-center justify-center rounded border-2
          ${inComparison 
            ? 'bg-blue-600 border-blue-600 text-white' 
            : 'bg-white border-gray-300 hover:border-blue-400'
          }
          ${!canAdd && !inComparison ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          transition-colors duration-200
          ${sizeClasses[size]}
        `}>
          {inComparison && (
            <svg
              className={iconSizeClasses[size]}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        {showText && (
          <span className="ml-2 text-sm text-gray-700">
            {inComparison ? 'Selected' : 'Compare'}
          </span>
        )}
      </label>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggleComparison}
        disabled={!canAdd && !inComparison}
        className={`
          inline-flex items-center justify-center rounded-md
          ${inComparison 
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
          ${!canAdd && !inComparison ? 'opacity-50 cursor-not-allowed' : ''}
          transition-colors duration-200
          ${sizeClasses[size]}
          ${className}
        `}
        title={
          inComparison 
            ? 'Remove from comparison' 
            : !canAdd 
              ? 'Maximum 10 whiskies can be compared'
              : 'Add to comparison'
        }
      >
        <svg
          className={iconSizeClasses[size]}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        {showText && (
          <span className="ml-1">
            {inComparison ? 'Remove' : 'Compare'}
          </span>
        )}
      </button>
    );
  }

  // Default button variant
  return (
    <button
      onClick={handleToggleComparison}
      disabled={!canAdd && !inComparison}
      className={`
        inline-flex items-center justify-center rounded-md font-medium
        ${inComparison 
          ? 'bg-blue-600 text-white hover:bg-blue-700' 
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }
        ${!canAdd && !inComparison ? 'opacity-50 cursor-not-allowed' : ''}
        transition-colors duration-200
        ${sizeClasses[size]}
        ${className}
      `}
      title={
        !canAdd && !inComparison 
          ? 'Maximum 10 whiskies can be compared' 
          : undefined
      }
    >
      <svg
        className={`mr-2 ${iconSizeClasses[size]}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      {inComparison ? 'Remove from Comparison' : 'Add to Comparison'}
    </button>
  );
};

export default ComparisonButton;