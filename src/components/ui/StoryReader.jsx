import { useState, useEffect, useRef } from 'react';
import { useAppState } from '@/services/appState.jsx';
import { getStoryById, getNextPassage } from '@/services/mockApi';
import StoryPassage from '@/components/ui/StoryPassage';

/**
 * StoryReader: Interactive story reading interface with passages and free-text responses
 * 
 * Displays story passages with streaming text and player responses.
 * Maintains scrollable history of previous passages and selections.
 * Fetches next passage when user submits response text.
 * 
 * Features:
 * - Passage history with streaming current passage
 * - Choice-driven narrative progression
 * - Auto-scroll to new passages
 * - Loading and error states
 * - Full-screen immersive layout
 * 
 * Layout:
 * - Full viewport coverage (100vw x 100vh)
 * - Scrollable passage container
 * - Dark gradient background
 * - Smooth animations
 * 
 * @returns {JSX.Element} StoryReader UI
 */
export default function StoryReader() {
  const { state } = useAppState();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoadingChoice, setIsLoadingChoice] = useState(false);
  const [retryResponse, setRetryResponse] = useState(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [canScroll, setCanScroll] = useState(false);
  
  const scrollContainerRef = useRef(null);
  const currentPassageRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    let isMounted = true;

    /**
     * Loads the current story from state.
     * For newly created stories, the story object should be in state.
     * For resumed stories, fetch from API using currentStoryId.
     * 
     * @returns {Promise<void>}
     */
    async function loadStory() {
      try {
        setLoading(true);
        setError(null);

        if (!state.currentStoryId) {
          throw new Error('No story ID found in state');
        }

        // Fetch story details
        const storyData = await getStoryById(state.currentStoryId);
        
        if (!isMounted) return;

        // Ensure story has passages array
        if (!storyData.passages || storyData.passages.length === 0) {
          throw new Error('Story has no passages');
        }

        setStory(storyData);
      } catch (err) {
        console.error('Failed to load story:', err);
        if (!isMounted) return;
        setError('The tale eludes our grasp. Return to the archives.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadStory();

    return () => {
      isMounted = false;
    };
  }, [state.currentStoryId]);

  /**
   * Auto-scroll to current passage when new passage is added
   */
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      return undefined;
    }

    /**
     * Tracks whether the reader is near the bottom of the passage list.
     * Used to decide whether to auto-scroll or show "go to latest" button.
     */
    const handleScroll = () => {
      const distanceFromBottom =
        scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
      setIsNearBottom(distanceFromBottom <= 160);
      setCanScroll(scrollContainer.scrollHeight > scrollContainer.clientHeight + 8);
    };

    handleScroll();
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!story || !scrollContainer) {
      return undefined;
    }

    setCanScroll(scrollContainer.scrollHeight > scrollContainer.clientHeight + 8);

    // Only auto-scroll if user is near bottom OR they just submitted a response
    if (!isNearBottom && !shouldAutoScrollRef.current) {
      return undefined;
    }

    const timer = setTimeout(() => {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth',
      });
      setIsNearBottom(true);
      shouldAutoScrollRef.current = false; // Reset after scrolling
    }, 120);

    return () => clearTimeout(timer);
  }, [story?.passages?.length]); // Only trigger when passages change, not when scroll position changes

  /**
   * Scrolls the reading container to the latest passage.
   */
  const handleScrollToLatest = () => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      return;
    }

    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior: 'smooth',
    });
  };

  /**
   * Handle response submission - fetch next passage and update story
   * 
   * @param {string} responseText - User free-text response
   */
  const handleResponseSubmit = async (responseText) => {
    if (!story || isLoadingChoice) return;

    const trimmedResponse = String(responseText || '').trim();
    if (!trimmedResponse) return;

    setIsLoadingChoice(true);
    setError(null);
    setRetryResponse({ responseText: trimmedResponse });
    shouldAutoScrollRef.current = true; // Always scroll to new passage after response

    try {
      // Get next passage from API
      const nextPassage = await getNextPassage(story.id, trimmedResponse);

      // Update story state
      setStory(prevStory => {
        const updatedPassages = [...prevStory.passages];
        const currentIndex = prevStory.currentPassageIndex || 0;
        
        // Mark selected choice in current passage
        updatedPassages[currentIndex] = {
          ...updatedPassages[currentIndex],
          selectedChoiceId: null,
          selectedResponseText: trimmedResponse,
          displayedAt: updatedPassages[currentIndex].displayedAt || new Date().toISOString(),
        };

        // Add new passage
        updatedPassages.push({
          ...nextPassage,
          displayedAt: new Date().toISOString(),
          selectedResponseText: nextPassage.selectedResponseText ?? null,
        });

        // Calculate total word count
        const totalWords = updatedPassages.reduce((sum, p) => {
          return sum + (p.text?.split(/\s+/).length || 0);
        }, 0);

        return {
          ...prevStory,
          passages: updatedPassages,
          currentPassageIndex: currentIndex + 1,
          lastModified: new Date().toISOString(),
          wordCount: totalWords,
        };
      });

      setRetryResponse(null);
    } catch (err) {
      console.error('Failed to get next passage:', err);
      setError(err.message || 'The threads of fate are tangled. Try again?');
    } finally {
      setIsLoadingChoice(false);
    }
  };

  /**
   * Retry failed response submission
   */
  const handleRetry = () => {
    if (retryResponse) {
      handleResponseSubmit(retryResponse.responseText);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-screen h-screen bg-gradient-to-b from-gray-900 via-blue-950 to-black flex items-center justify-center animate-[fadeIn_0.8s_ease-in]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-blue-200 text-lg">Unveiling your tale...</p>
        </div>
      </div>
    );
  }

  // Error state (initial load)
  if (error && !story) {
    return (
      <div className="w-screen h-screen bg-gradient-to-b from-gray-900 via-blue-950 to-black flex items-center justify-center animate-[fadeIn_0.8s_ease-in]">
        <div className="text-center max-w-md px-6">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <p className="text-blue-200">Close this window and try again.</p>
        </div>
      </div>
    );
  }

  const currentPassageIndex = story?.currentPassageIndex ?? 0;

  // Story display with passages
  return (
    <div 
      ref={scrollContainerRef}
      className="story-scrollbar w-screen h-screen bg-gradient-to-b from-gray-900 via-blue-950 to-black overflow-y-auto animate-[fadeIn_1.2s_ease-in]"
    >
      <div className="min-h-screen flex items-start justify-center px-6 py-12">
        <article className="w-[80vw] max-w-[80vw] mx-auto">
          
          {/* Story header */}
          <header className="mb-12 text-center animate-[fadeUp_1.4s_ease-out] sticky top-0 bg-gradient-to-b from-gray-900 via-blue-950/90 to-transparent py-6 z-10 backdrop-blur-sm">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-100 mb-3">
              {story.title}
            </h1>
            <p className="text-blue-300 text-lg">
              {story.fandom}
            </p>
            <div className="text-blue-200 text-sm mt-2 opacity-70">
              {story.wordCount} words
            </div>
          </header>

          {/* Passage history */}
          <div className="space-y-12 animate-[fadeUp_1.6s_ease-out]">
            {story.passages.map((passage, index) => (
              <div 
                key={passage.id}
                ref={index === currentPassageIndex ? currentPassageRef : null}
              >
                <StoryPassage
                  passage={passage}
                  isCurrent={index === currentPassageIndex}
                  onResponseSubmit={handleResponseSubmit}
                  isLoadingChoice={isLoadingChoice}
                  passageIndex={index}
                  disableStreaming={index === 0 && currentPassageIndex === 0}
                />
              </div>
            ))}
          </div>

          {/* Error message (during choice selection) */}
          {error && story && (
            <div className="mt-8 p-6 bg-red-900/30 border-l-4 border-red-500 rounded-r-lg animate-[fadeIn_0.4s_ease-in]">
              <p className="text-red-300 text-lg mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          )}

        </article>
      </div>

      {/* Go to latest passage button - Fixed positioning outside article */}
      {canScroll && !isNearBottom && (
        <div className="fixed bottom-8 right-8 z-50">
          <button
            type="button"
            onClick={handleScrollToLatest}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 shadow-2xl transition-all hover:scale-105 font-medium"
          >
            ↓ Latest Passage
          </button>
        </div>
      )}
    </div>
  );
}
