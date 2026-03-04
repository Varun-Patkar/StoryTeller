import { useEffect } from 'react';

/**
 * StoryPassage: Display-only component for a single passage in the story
 * 
 * Renders one passage in the story as either:
 * - AI passage (even index): Ollama story response with drop-cap styling
 * - User passage (odd index): Player response with blue checkmark formatting
 * 
 * Responsibility: Render passages only. Response input form is in StoryReader at bottom.
 * 
 * @param {Object} props
 * @param {Object} props.passage - Passage object with text/content
 * @param {number} props.passageIndex - Index of passage in array (0-based)
 * @param {boolean} [props.isCurrent=false] - Whether this is the currently-streaming passage
 * @param {boolean} [props.isLoadingChoice=false] - Loading state showing dots animation
 * @returns {JSX.Element} Story passage display
 */
export default function StoryPassage({
  passage,
  passageIndex,
  isCurrent = false,
  isLoadingChoice = false,
}) {
  // Determine if this is a user response (odd index)
  const isUserResponse = passageIndex % 2 === 1;

  useEffect(() => {
    // On passage mount, scroll into view if current
    // (auto-scroll handled by StoryReader)
  }, []);

  return (
    <div 
      className={`
        mb-12 last:mb-0 transition-opacity duration-300
        ${isUserResponse 
          ? 'ml-8 pl-6 border-l-4 border-blue-500/50 bg-blue-950/30 py-4 rounded-r-lg opacity-90' 
          : 'opacity-100'
        }
        ${isCurrent && !isUserResponse ? 'opacity-100' : 'opacity-70'}
      `}
      id={`passage-${passageIndex}`}
    >
      {/* Passage text with user response formatting */}
      <div className={isUserResponse ? "text-blue-100" : "text-gray-300 leading-relaxed"}>
        {isUserResponse && (
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-white text-xs">✓</span>
            <p className="text-blue-400 font-semibold text-sm">You responded:</p>
          </div>
        )}
        {passage?.text?.split('\n\n').map((paragraph, index) => (
          <p
            key={index}
            className={`mb-6 last:mb-0 ${
              isUserResponse 
                ? 'text-base leading-7' 
                : 'text-lg leading-8'
            } ${isCurrent && index === 0 && !isUserResponse ? 'first-letter:text-5xl first-letter:font-bold first-letter:text-red-400 first-letter:mr-2 first-letter:float-left' : ''}`}
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* Loading state (between passage generation and next passage arrival) */}
      {isCurrent && isLoadingChoice && (
        <div className="mt-4 flex gap-2">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      )}
    </div>
  );
}
