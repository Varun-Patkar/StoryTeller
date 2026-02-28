import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/services/appState.jsx';
import { getStoryById, getUserStories, getAvailableModels } from '@/services/mockApi';
import Button from '@/components/common/Button';
import Dropdown from '@/components/common/Dropdown';

/**
 * Dashboard: Story hub showing existing stories and create action.
 *
 * Layout:
 * - Right-side panel occupying 65vw
 * - Logo at top-left, Create New button at top-right
 * - 3-column story grid or mystical empty state
 *
 * @returns {JSX.Element} Dashboard UI
 */
export default function Dashboard() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resumeLoadingId, setResumeLoadingId] = useState('');
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    /**
     * Loads user stories from mock API and stores them in global state.
     *
     * @returns {Promise<void>} Resolves after stories are loaded
     */
    async function loadStories() {
      try {
        setLoading(true);
        setError('');
        const stories = await getUserStories();
        if (!isMounted) return;
        dispatch({ type: 'SET_USER_STORIES', payload: stories });
      } catch (loadError) {
        console.error('Story load failed:', loadError);
        if (!isMounted) return;
        setError('The archives are silent. Try summoning them again.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadStories();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    let isMounted = true;

    /**
     * Loads available AI models from mock API.
     *
     * @returns {Promise<void>} Resolves after models are loaded
     */
    async function loadModels() {
      try {
        setModelsLoading(true);
        const availableModels = await getAvailableModels();
        if (!isMounted) return;
        setModels(availableModels);
      } catch (modelError) {
        console.error('Model load failed:', modelError);
        // Fail silently - user can still use existing selected model
      } finally {
        if (isMounted) {
          setModelsLoading(false);
        }
      }
    }

    loadModels();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Formats timestamps for display in cards.
   *
   * @param {string} timestamp - ISO date string
   * @returns {string} Human-readable date string
   */
  function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString();
  }

  /**
   * Sends the user to story setup phase via /setup route.
   *
   * @returns {void}
   */
  const handleCreateNew = () => {
    if (state.isTransitioning) {
      return;
    }
    // Navigate to setup page with animation trigger
    dispatch({ type: 'TRANSITION_TO_SETUP' });
    navigate('/new');
  };

  /**
   * Handles AI model selection change.
   *
   * @param {string} modelId - Selected model ID
   * @returns {void}
   */
  const handleModelChange = (modelId) => {
    const selectedModel = models.find(m => m.id === modelId);
    if (selectedModel) {
      dispatch({
        type: 'MODEL_SELECTED',
        payload: { model: { ...selectedModel, ollamaTag: selectedModel.id } }
      });
    }
  };

  /**
   * Loads a story and navigates to the reading interface via /story/:slug route.
   *
   * @param {Object} story - Story object with id and slug
   * @returns {Promise<void>} Resolves after navigation
   */
  const handleResumeStory = async story => {
    if (state.isTransitioning || !story || ! story.id) {
      return;
    }

    try {
      setResumeLoadingId(story.id);
      setError('');
      
      // Load story to verify it exists and update state
      await getStoryById(story.id);
      dispatch({ type: 'RESUME_STORY', payload: { storyId: story.id } });
      dispatch({ type: 'TRANSITION_TO_PLAYING' });
      
      // Navigate to story page using slug
      navigate(`/story/${story.slug}`);
    } catch (resumeError) {
      console.error('Story resume failed:', resumeError);
      setError('The tale resists awakening. Try once more.');
    } finally {
      setResumeLoadingId('');
    }
  };

  const stories = state.userStories || [];

  // Prepare model options for dropdown
  const modelOptions = models.map(model => ({
    value: model.id,
    label: model.displayName
  }));

  return (
    <section className="absolute top-0 right-0 h-full w-[65vw] pointer-events-auto">
      <div className="h-full w-full bg-black/45 backdrop-blur-sm border-l border-blue-500/30 px-8 py-6 flex flex-col animate-[panelSlide_0.6s_ease-out]">
        <header className="flex items-center justify-between mb-8 animate-[fadeUp_0.5s_ease-out]">
          <div className="flex items-center">
            <img src="/logo.png" alt="StoryTeller logo" className="h-12 sm:h-30 w-auto" />
          </div>
          <Button onClick={handleCreateNew} disabled={state.isTransitioning}>
            Create New +
          </Button>
        </header>

        {loading && (
          <p className="text-gray-300">Summoning your chronicles...</p>
        )}

        {error && !loading && (
          <p className="text-red-400 mb-4">{error}</p>
        )}

        {!loading && stories.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-[fadeUp_0.6s_ease-out]">
            <h2 className="text-2xl text-gray-100 font-semibold mb-3">
              Wave your first story into existence
            </h2>
            <p className="text-blue-200 mb-6 max-w-md">
              The archives are empty. Begin a new tale and let the realm remember.
            </p>
            <Button onClick={handleCreateNew} disabled={state.isTransitioning}>
              Create New +
            </Button>
          </div>
        )}

        {!loading && stories.length > 0 && (
          <div className="flex-1 overflow-y-auto pr-2 animate-[fadeUp_0.6s_ease-out]">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {stories.map(story => (
                <div
                  key={story.id}
                  className="group rounded-2xl border border-blue-500/30 bg-black/30 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/40 animate-[fadeUp_0.6s_ease-out]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg text-gray-100 font-semibold">
                        {story.title}
                      </h3>
                      <p className="text-sm text-blue-200">{story.fandom}</p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-300 space-y-1">
                    <p>Last touched: {formatDate(story.lastModified)}</p>
                    <p>Word count: {story.wordCount}</p>
                  </div>

                  <Button
                    className="mt-5 w-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleResumeStory(story)}
                    disabled={state.isTransitioning || resumeLoadingId === story.id}
                  >
                    {resumeLoadingId === story.id ? 'Resuming...' : 'Resume'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Model Selector - Bottom Right */}
        {!modelsLoading && models.length > 0 && (
          <div className="absolute bottom-6 right-8 animate-[fadeUp_0.6s_ease-out]">
            <label className="block text-xs font-semibold text-blue-300 mb-2">
              AI Energy Source
            </label>
            <div className="w-48">
              <Dropdown
                options={modelOptions}
                value={state.selectedModel?.ollamaTag || state.selectedModel?.id || ''}
                onChange={handleModelChange}
                placeholder="Select model..."
                className="text-sm"
              />
            </div>
            {state.selectedModel && (
              <p className="text-xs text-blue-200 mt-1">
                {state.selectedModel.displayName || state.selectedModel.name}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
