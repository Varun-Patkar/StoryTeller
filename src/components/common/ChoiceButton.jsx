import { useState } from 'react';

/**
 * ChoiceButton: Interactive story choice with mystical styling
 * 
 * Displays a player decision option with hover effects,
 * disabled states, and fade-in animation. Designed to appear
 * after StreamingText completes.
 * 
 * Features:
 * - Mystical blue/red theme styling
 * - Hover scale and shadow effects
 * - Loading state (when selected)
 * - Disabled state (during processing)
 * - Fade-in animation on mount
 * 
 * @param {Object} props
 * @param {Object} props.choice - Choice object with id and text
 * @param {function} props.onClick - Handler when choice is clicked
 * @param {boolean} [props.disabled=false] - Disable interaction
 * @param {boolean} [props.isLoading=false] - Show loading state
 * @param {number} [props.delay=0] - Animation delay in ms (for staggered appearance)
 * @returns {JSX.Element} Choice button
 */
export default function ChoiceButton({ 
  choice, 
  onClick, 
  disabled = false,
  isLoading = false,
  delay = 0
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!disabled && !isLoading) {
      onClick(choice.id);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyPress}
      disabled={disabled || isLoading}
      className={`
        group relative w-full
        px-6 py-4
        bg-gradient-to-r from-blue-600 to-blue-700
        hover:from-blue-700 hover:to-blue-800
        text-white text-left font-medium
        rounded-lg
        border-2 border-blue-500
        shadow-lg
        transform transition-all duration-200
        ${isHovered && !disabled && !isLoading ? 'scale-105 shadow-2xl' : 'scale-100'}
        ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        animate-[fadeIn_0.4s_ease-in]
      `}
      style={{
        animationDelay: `${delay}ms`
      }}
      aria-label={`Choose: ${choice.text}`}
    >
      {/* Hover glow effect */}
      {isHovered && !disabled && !isLoading && (
        <div className="absolute inset-0 bg-blue-400 opacity-20 rounded-lg blur-sm"></div>
      )}

      {/* Choice text */}
      <span className="relative z-10 flex items-center justify-between">
        <span className="flex-1">{choice.text}</span>
        
        {/* Loading spinner */}
        {isLoading && (
          <svg 
            className="animate-spin h-5 w-5 text-white ml-3" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        
        {/* Arrow indicator on hover */}
        {!isLoading && (
          <svg 
            className={`
              h-5 w-5 ml-3 transition-transform duration-200
              ${isHovered ? 'translate-x-1' : 'translate-x-0'}
            `}
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 7l5 5m0 0l-5 5m5-5H6" 
            />
          </svg>
        )}
      </span>

      {/* Bottom border accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600 opacity-70 rounded-b-lg"></div>
    </button>
  );
}
