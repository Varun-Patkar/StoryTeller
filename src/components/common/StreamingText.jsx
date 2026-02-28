import { useState, useEffect, useRef } from 'react';

/**
 * StreamingText: Displays text with typewriter/streaming animation
 * 
 * Animates text word-by-word at configurable speed to create
 * a dynamic reading experience.
 * 
 * Features:
 * - Word-by-word streaming animation
 * - Configurable speed (50-150ms per word)
 * - Smooth paragraph/sentence pauses
 * - Cleanup on unmount
 * 
 * @param {Object} props
 * @param {string} props.text - Full text to stream (can include \n\n for paragraphs)
 * @param {number} [props.speed=100] - Milliseconds per word (50-150ms range)
 * @param {function} [props.onComplete] - Callback when streaming finishes
 * @param {boolean} [props.autoStart=true] - Start streaming automatically
 * @param {boolean} [props.isFirstPassage=false] - Whether this is the first passage (for first-letter styling)
 * @returns {JSX.Element} Streaming text display
 */
export default function StreamingText({ 
  text, 
  speed = 100,
  onComplete,
  autoStart = true,
  isFirstPassage = false
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);
  const currentIndexRef = useRef(0);
  const wordsRef = useRef([]);

  useEffect(() => {
    // Split text into words, preserving paragraph breaks
    const processedText = text.replace(/\n\n/g, ' ¶¶ '); // Use ¶ as paragraph marker
    wordsRef.current = processedText.split(/\s+/).filter(Boolean);
    currentIndexRef.current = 0;
    setDisplayedText('');
    setIsComplete(false);

    if (autoStart) {
      startStreaming();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, speed, autoStart]);

  /**
   * Starts the streaming animation
   * Uses setInterval to add words at specified speed
   */
  const startStreaming = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (currentIndexRef.current >= wordsRef.current.length) {
        completeStreaming();
        return;
      }

      const word = wordsRef.current[currentIndexRef.current];
      
      // Handle paragraph breaks
      if (word === '¶¶') {
        setDisplayedText(prev => prev + '\n\n');
      } else {
        setDisplayedText(prev => {
          const needsSpace = prev.length > 0 && !prev.endsWith('\n');
          return prev + (needsSpace ? ' ' : '') + word;
        });
      }

      currentIndexRef.current++;
    }, speed);
  };

  /**
   * Completes streaming animation and triggers callback
   */
  const completeStreaming = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsComplete(true);
    
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="select-none">
      <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
        {displayedText.split('\n\n').map((paragraph, index) => (
          <p 
            key={index}
            className={`mb-6 last:mb-0 text-lg leading-8 ${isFirstPassage && index === 0 ? 'first-letter:text-5xl first-letter:font-bold first-letter:text-red-400 first-letter:mr-2 first-letter:float-left' : ''}`}
          >
            {paragraph}
          </p>
        ))}
        
        {/* Blinking cursor while streaming */}
        {!isComplete && (
          <span className="inline-block w-2 h-5 bg-blue-400 animate-pulse ml-1"></span>
        )}
      </div>
    </div>
  );
}
