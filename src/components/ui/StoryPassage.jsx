import { useState, useEffect, useRef } from 'react';
import StreamingText from '@/components/common/StreamingText';

/**
 * StoryPassage: Displays a single passage with streaming text and response input
 * 
 * Renders one passage in the story, either as:
 * - Current passage: Streaming text with free-text response input
 * - Previous passage: Static text with selected response highlighted
 * 
 * Features:
 * - Conditional streaming (current passage only)
 * - Response input appears after streaming completes
 * - Selected response indicator for history
 * - Loading state while generating next passage
 * 
 * @param {Object} props
 * @param {Object} props.passage - Passage object with text and selectedResponseText
 * @param {boolean} [props.isCurrent=false] - Whether this is the active passage
 * @param {function} [props.onResponseSubmit] - Handler for response submission (current only)
 * @param {boolean} [props.isLoadingChoice=false] - Loading state after choice clicked
 * @param {string} [props.passageIndex] - Index for accessibility
 * @param {boolean} [props.disableStreaming=false] - Render current passage as static text
 * @returns {JSX.Element} Story passage display
 */
export default function StoryPassage({ 
  passage, 
  isCurrent = false,
  onResponseSubmit,
  isLoadingChoice = false,
  passageIndex = 0,
  disableStreaming = false,
}) {
  const [streamingComplete, setStreamingComplete] = useState(!isCurrent || disableStreaming);
  const [responseText, setResponseText] = useState('');
  const responseInputRef = useRef(null);

  useEffect(() => {
    // Reset streaming state when passage changes
    if (isCurrent && !disableStreaming) {
      setStreamingComplete(false);
      setResponseText('');
      return;
    }
    setStreamingComplete(true);
    setResponseText('');
  }, [passage.id, isCurrent, disableStreaming]);

  const handleStreamingComplete = () => {
    setStreamingComplete(true);
  };

  useEffect(() => {
    if (!isCurrent || !streamingComplete || isLoadingChoice) {
      return;
    }

    const timer = setTimeout(() => {
      responseInputRef.current?.focus();
    }, 80);

    return () => clearTimeout(timer);
  }, [isCurrent, streamingComplete, isLoadingChoice]);

  const handleSubmitResponse = () => {
    const trimmedResponse = responseText.trim();
    if (!trimmedResponse || !onResponseSubmit || isLoadingChoice) {
      return;
    }
    onResponseSubmit(trimmedResponse);
    setResponseText('');
  };

  const selectedResponseText = passage.selectedResponseText;

  return (
    <div 
      className={`
        mb-12 last:mb-0 
        ${isCurrent ? 'opacity-100' : 'opacity-70'}
        transition-opacity duration-300
      `}
      id={`passage-${passageIndex}`}
    >
      {/* Passage text */}
      {isCurrent && !disableStreaming ? (
        // Current passage: Streaming text
        <StreamingText 
          text={passage.text}
          speed={100}
          onComplete={handleStreamingComplete}
          isFirstPassage={isCurrent}
        />
      ) : (
        // Previous passage: Static text
        <div className="text-gray-300 leading-relaxed">
          {passage.text.split('\n\n').map((paragraph, index) => (
            <p 
              key={index}
              className={`mb-6 last:mb-0 text-lg leading-8 ${isCurrent && index === 0 ? 'first-letter:text-5xl first-letter:font-bold first-letter:text-red-400 first-letter:mr-2 first-letter:float-left' : ''}`}
            >
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {/* Response input section */}
      {isCurrent && streamingComplete && (
        <div className="mt-8">
          <p className="text-blue-300 text-sm mb-4 italic">
            What will you do next?
          </p>
          <div className="space-y-3">
            <textarea
              ref={responseInputRef}
              value={responseText}
              onChange={(event) => setResponseText(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                  event.preventDefault();
                  handleSubmitResponse();
                }
              }}
              disabled={isLoadingChoice}
              placeholder="Write your action or decision..."
              rows={3}
              className="w-full rounded-lg border border-blue-600/40 bg-blue-950/30 text-gray-100 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleSubmitResponse}
              disabled={isLoadingChoice || responseText.trim().length === 0}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-white font-semibold transition-all hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue Story
            </button>
            <p className="text-xs text-blue-300/80">
              Tip: Press Ctrl+Enter to submit quickly.
            </p>
          </div>
        </div>
      )}

      {/* Loading state (between choice selection and new passage) */}
      {isCurrent && isLoadingChoice && (
        <div className="mt-8 flex items-center justify-center">
          <div className="flex items-center gap-3 text-blue-300">
            <svg 
              className="animate-spin h-6 w-6" 
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
            <p className="text-lg">Weaving fate...</p>
          </div>
        </div>
      )}

      {/* Selected response indicator (previous passages only) */}
      {!isCurrent && selectedResponseText && (
        <div className="mt-6 flex items-center gap-3 p-4 bg-blue-900/30 border-l-4 border-blue-500 rounded-r-lg">
          <svg 
            className="h-6 w-6 text-blue-400 flex-shrink-0" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-blue-200 text-base">
            <span className="font-semibold">You responded:</span> {selectedResponseText}
          </p>
        </div>
      )}
    </div>
  );
}
