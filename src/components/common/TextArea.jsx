import { useState } from 'react';
import { getCharacterCount } from '@/utils/validation';

/**
 * TextArea: Reusable text area component with character counter
 * 
 * Props:
 * @param {string} value - Text value
 * @param {function} onChange - Change handler
 * @param {string} placeholder - Placeholder text
 * @param {number} maxLength - Maximum characters allowed
 * @param {string} label - Label for field
 * @param {string} className - Additional Tailwind classes
 */
export default function TextArea({
  value = '',
  onChange,
  placeholder = '',
  maxLength = 500,
  label = '',
  className = '',
  ...props
}) {
  const { current, max, remaining, percentage } = getCharacterCount(value, maxLength);

  // Keep counter green unless the limit is exceeded
  const getProgressColor = () => {
    if (current > max) return 'text-red-400';
    return 'text-green-400';
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-gray-100 mb-2">{label}</label>}

      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`
          w-full px-4 py-2 rounded
          bg-gray-800 text-gray-100
          border-2 border-blue-700
          hover:border-blue-400
          focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50
          resize-none
          transition-colors duration-200
          placeholder-gray-500
          ${className}
        `}
        rows="4"
        {...props}
      />

      {/* Character counter with dynamic color */}
      <div className={`text-sm mt-2 ${getProgressColor()}`}>
        {current} / {max} characters ({remaining} remaining)
      </div>
    </div>
  );
}
