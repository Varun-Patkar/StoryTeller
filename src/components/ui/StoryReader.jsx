import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '@/services/appState.jsx';
import { getStoryBySlug, getNextPassage } from '@/services/mockApi';
import { useDocumentTitle } from '@/utils/seo';
import { isValidSlug } from '@/utils/slugify';
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
  const { state, dispatch } = useAppState();
  const { slug } = useParams();
  const navigate = useNavigate();
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

  // Update document title with story title
  useDocumentTitle({ storyTitle: story?.title });

  useEffect(() => {
    let isMounted = true;

    /**
     * Loads the current story using slug from URL params.
     * This enables direct URL access and bookmarking.
     * 
     * @returns {Promise<void>}
     */
    async function loadStory() {
      try {
        setLoading(true);
        setError(null);

        const normalizedSlug = String(slug || '').trim().toLowerCase();
        if (!normalizedSlug || !isValidSlug(normalizedSlug)) {
          navigate('/', { replace: true });
          return;
        }

        // Fetch story details using slug
        const storyData = await getStoryBySlug(normalizedSlug);
        
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
  }, [slug, navigate]);

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

  // Loading state: keep StoryReader invisible until content is ready
  if (loading) {
    return null;
  }

  // Error state (initial load)
  if (error && !story) {
    return (
      <div className="fixed inset-0 z-20 bg-gradient-to-b from-gray-900 via-blue-950 to-black flex items-center justify-center animate-[fadeIn_0.8s_ease-in]">
        <div className="text-center max-w-md px-6">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <p className="text-blue-200">Close this window and try again.</p>
        </div>
      </div>
    );
  }

  const currentPassageIndex = story?.currentPassageIndex ?? 0;

  /**
   * Navigate back to dashboard with reverse animation
   */
  const handleBackToDashboard = () => {
    dispatch({ type: 'TRANSITION_TO_DASHBOARD' });
    navigate('/dashboard');
  };

  // Story display with passages
  // Fade in only after animation completes
  const isAnimationComplete = !state.isTransitioning;
  return (
    <div 
      ref={scrollContainerRef}
      className={`story-scrollbar fixed inset-0 z-20 bg-gradient-to-b from-gray-900 via-blue-950 to-black overflow-y-auto transition-opacity duration-500 ${
        isAnimationComplete ? 'animate-[fadeIn_1.2s_ease-in]' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Back to Dashboard Button */}
      <button
        type="button"
        onClick={handleBackToDashboard}
        disabled={state.isTransitioning}
        className="fixed top-6 left-6 z-50 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
        title="Return to Dashboard"
      >
        ← Dashboard
      </button>

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
      {canScroll && !isNearBottom && isAnimationComplete && (
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
