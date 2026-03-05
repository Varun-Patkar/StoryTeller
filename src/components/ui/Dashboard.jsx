import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/services/appState.jsx';
import { getStoryById, getUserStories, getAvailableModels, updateStory, deleteStory } from '@/services/mockApi';
import { apiGet } from '@/services/apiClient';
import Button from '@/components/common/Button';
import Dropdown from '@/components/common/Dropdown';

/**
 * Dashboard: Story hub showing existing stories and create action.
 *
 * Layout:
 * - Right-side panel occupying 65vw
 * - Logo at top-left, Create New button at top-right
 * - Two tabs: "Your Stories" (authenticated only) and "Explore" (public stories)
 * - 3-column story grid or mystical empty state
 *
 * @returns {JSX.Element} Dashboard UI
 */
export default function Dashboard() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exploreLoading, setExploreLoading] = useState(true);
  const [error, setError] = useState('');
  const [resumeLoadingId, setResumeLoadingId] = useState('');
  const [updatingStoryId, setUpdatingStoryId] = useState('');
  const [deletingStoryId, setDeleteStoryId] = useState('');
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('yours');
  const [exploreStories, setExploreStories] = useState([]);

  useEffect(() => {
    let isMounted = true;

    /**
     * Loads public stories for the Explore tab.
     *
     * @returns {Promise<void>} Resolves after stories are loaded
     */
    async function loadExploreStories() {
      try {
        setExploreLoading(true);
        const response = await apiGet('/stories/explore');
        if (!isMounted) return;
        
        // Handle both array response and object with 'stories' key
        const stories = Array.isArray(response) ? response : (response.stories || []);
        setExploreStories(stories);
      } catch (error) {
        console.error('Failed to load explore stories:', error);
        // Fail silently - Explore tab just shows empty state
        if (isMounted) {
          setExploreStories([]);
        }
      } finally {
        if (isMounted) {
          setExploreLoading(false);
        }
      }
    }

    loadExploreStories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    /**
     * Loads user stories from API and stores them in global state.
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
      // Persist to localStorage for page reloads
      try {
        localStorage.setItem('selectedModel', JSON.stringify(selectedModel));
      } catch (storageError) {
        console.warn('Failed to persist selected model:', storageError);
      }

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
      
      // Navigate to story page using slug (fallback to id for legacy stories)
      navigate(`/story/${story.slug || story.id}`);
    } catch (resumeError) {
      console.error('Story resume failed:', resumeError);
      setError('The tale resists awakening. Try once more.');
    } finally {
      setResumeLoadingId('');
    }
  };

  const stories = state.userStories || [];
  const isAuthenticated = state.isUserHydrated && state.user !== null;

  // Prepare model options for dropdown
  const modelOptions = models.map(model => ({
    value: model.id,
    label: model.displayName
  }));

  /**
   * Redirects to GitHub OAuth login.
   * Generates state token and redirects to GitHub authorization.
   *
   * @returns {void}
   */
  const handleGithubSignIn = () => {
    try {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      if (!clientId) {
        console.error('VITE_GITHUB_CLIENT_ID not configured');
        setError('GitHub sign-in is not configured.');
        return;
      }

      // Generate CSRF state token (should ideally be generated server-side)
      const stateToken = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);
      
      // Store state in sessionStorage for verification (simplified - should use cookies)
      sessionStorage.setItem('github_oauth_state', stateToken);

      const baseUrl = window.location.origin;
      const redirectUri = `${baseUrl}/api/auth/callback`;
      const scope = 'user:email';
      
      const authUrl = new URL('https://github.com/login/oauth/authorize');
      authUrl.searchParams.append('client_id', clientId);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('state', stateToken);
      authUrl.searchParams.append('scope', scope);
      
      window.location.href = authUrl.toString();
    } catch (err) {
      console.error('GitHub sign-in error:', err);
      setError('Failed to initiate GitHub sign-in.');
    }
  };

  /**
   * Logs out the user by clearing session.
   *
   * @returns {void}
   */
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      dispatch({ type: 'USER_LOGOUT' });
      setActiveTab('explore');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  /**
   * Toggle story visibility between public and private.
   *
   * @param {Object} story - Story to update
   * @returns {Promise<void>}
   */
  const handleToggleVisibility = async (story) => {
    try {
      setUpdatingStoryId(story.id);
      const newVisibility = story.visibility === 'public' ? 'private' : 'public';
      await updateStory(story.id, { visibility: newVisibility });
      
      // Update local state
      dispatch({ 
        type: 'SET_USER_STORIES', 
        payload: state.userStories.map(s => 
          s.id === story.id ? { ...s, visibility: newVisibility } : s
        )
      });
    } catch (updateError) {
      console.error('Failed to update story visibility:', updateError);
      setError('Failed to update story visibility.');
    } finally {
      setUpdatingStoryId('');
    }
  };

  /**
   * Delete a story after confirmation.
   *
   * @param {Object} story - Story to delete
   * @returns {Promise<void>}
   */
  const handleDeleteStory = async (story) => {
    if (!window.confirm(`Are you sure you want to delete "${story.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      setDeleteStoryId(story.id);
      await deleteStory(story.id);
      
      // Update local state
      dispatch({ 
        type: 'SET_USER_STORIES', 
        payload: state.userStories.filter(s => s.id !== story.id)
      });
    } catch (deleteError) {
      console.error('Failed to delete story:', deleteError);
      setError('Failed to delete story.');
    } finally {
      setDeleteStoryId('');
    }
  };

  return (
    <section className="absolute top-0 right-0 h-full w-[65vw] pointer-events-auto">
      <div className="h-full w-full bg-black/45 backdrop-blur-sm border-l border-blue-500/30 px-8 py-6 flex flex-col animate-[panelSlide_0.6s_ease-out]">
        <header className="flex items-center justify-between mb-8 animate-[fadeUp_0.5s_ease-out]">
          <div className="flex items-center">
            <img src="/logo.png" alt="StoryTeller logo" className="h-12 sm:h-30 w-auto" />
          </div>
          <div className="flex items-center gap-4">
            {/* About link - accessible to all users */}
            <button
              onClick={() => {
                if (!state.isTransitioning) {
                  dispatch({ type: 'TRANSITION_TO_ABOUT' });
                  navigate('/about');
                }
              }}
              disabled={state.isTransitioning}
              className="px-4 py-2 text-blue-300 hover:text-blue-100 hover:bg-blue-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              About
            </button>
            {isAuthenticated && (
              <Button onClick={handleCreateNew} disabled={state.isTransitioning}>
                Create New +
              </Button>
            )}
            {isAuthenticated && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30">
                {state.user?.avatar_url && (
                  <img
                    src={state.user.avatar_url}
                    alt={state.user.username}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="text-sm text-blue-200">{state.user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-400 hover:text-gray-200 transition ml-2"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 animate-[fadeUp_0.5s_ease-out] border-b border-blue-500/30">
          <button
            onClick={() => {
              if (!isAuthenticated && activeTab !== 'yours') {
                setActiveTab('yours');
              } else if (isAuthenticated) {
                setActiveTab('yours');
              }
            }}
            className={`pb-2 px-4 font-semibold transition ${
              activeTab === 'yours'
                ? 'text-blue-300 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            } ${!isAuthenticated ? 'opacity-50' : ''}`}
            title={!isAuthenticated ? 'Sign in to view your stories' : ''}
          >
            📖 Your Stories
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`pb-2 px-4 font-semibold transition ${
              activeTab === 'explore'
                ? 'text-blue-300 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            🌍 Explore
          </button>
        </div>

        {/* Your Stories Tab */}
        {activeTab === 'yours' && (
          <>
            {!isAuthenticated && !state.isUserHydrated && (
              <p className="text-gray-300">Verifying your identity...</p>
            )}

            {!isAuthenticated && state.isUserHydrated && (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-[fadeUp_0.6s_ease-out]">
                <h2 className="text-2xl text-gray-100 font-semibold mb-3">
                  Claim your chronicles
                </h2>
                <p className="text-blue-200 mb-6 max-w-md">
                  Sign in with GitHub to view and create your own stories.
                </p>
                <Button onClick={handleGithubSignIn}>
                  Sign in with GitHub ✨
                </Button>
              </div>
            )}

            {isAuthenticated && (
              <>
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
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              story.visibility === 'public' 
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {story.visibility === 'public' ? '🌍 Public' : '🔒 Private'}
                            </span>
                          </div>

                          <div className="text-sm text-gray-300 space-y-1 mb-4">
                            <p>Last touched: {formatDate(story.lastModified)}</p>
                            <p>Word count: {story.wordCount}</p>
                          </div>

                          <div className="space-y-2">
                            <Button
                              className="w-full"
                              onClick={() => handleResumeStory(story)}
                              disabled={state.isTransitioning || resumeLoadingId === story.id}
                            >
                              {resumeLoadingId === story.id ? 'Resuming...' : 'Resume'}
                            </Button>

                            <button
                              onClick={() => handleToggleVisibility(story)}
                              disabled={updatingStoryId === story.id}
                              className="w-full px-3 py-2 text-sm rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 transition-colors disabled:opacity-50 border border-blue-500/30"
                            >
                              {updatingStoryId === story.id 
                                ? 'Updating...' 
                                : `Make ${story.visibility === 'public' ? 'Private' : 'Public'}`}
                            </button>

                            <button
                              onClick={() => handleDeleteStory(story)}
                              disabled={deletingStoryId === story.id}
                              className="w-full px-3 py-2 text-sm rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 transition-colors disabled:opacity-50 border border-red-500/30"
                            >
                              {deletingStoryId === story.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Explore Tab */}
        {activeTab === 'explore' && (
          <>
            {exploreLoading && (
              <p className="text-gray-300">Discovering shared tales...</p>
            )}

            {!exploreLoading && exploreStories.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-[fadeUp_0.6s_ease-out]">
                <h2 className="text-2xl text-gray-100 font-semibold mb-3">
                  No tales published yet
                </h2>
                <p className="text-blue-200 mb-6 max-w-md">
                  The public realm awaits its first story. Be the visionary.
                </p>
                <Button onClick={handleCreateNew} disabled={state.isTransitioning}>
                  Create New +
                </Button>
              </div>
            )}

            {!exploreLoading && exploreStories.length > 0 && (
              <div className="flex-1 overflow-y-auto pr-2 animate-[fadeUp_0.6s_ease-out]">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {exploreStories.map(story => {
                    const isOwnStory = isAuthenticated && state.user?.id === story.author_id;
                    return (
                      <div
                        key={story.id}
                        className="group rounded-2xl border border-amber-500/30 bg-black/30 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-900/40 animate-[fadeUp_0.6s_ease-out]"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg text-gray-100 font-semibold">
                              {story.title}
                            </h3>
                            <p className="text-sm text-amber-200">
                              By {story.author_name || story.author_id}
                              {story.author_avatar && (
                                <img
                                  src={story.author_avatar}
                                  alt={story.author_name}
                                  className="inline-block w-4 h-4 rounded-full ml-1"
                                />
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="text-sm text-gray-300 space-y-1">
                          <p>Published: {formatDate(story.created_at)}</p>
                          <p className="text-amber-300">
                            {isOwnStory ? '📖 Your story' : '🌍 Open for response'}
                          </p>
                        </div>

                        <Button
                          className="mt-5 w-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleResumeStory(story)}
                          disabled={state.isTransitioning || resumeLoadingId === story.id}
                        >
                          {resumeLoadingId === story.id 
                            ? 'Loading...' 
                            : isOwnStory 
                              ? 'Resume' 
                              : 'Fork & Respond'
                          }
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
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
