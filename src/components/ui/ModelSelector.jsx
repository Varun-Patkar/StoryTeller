import { useEffect, useState } from 'react';
import { useAppState } from '@/services/appState.jsx';
import { getAvailableModels } from '@/services/mockApi';

/**
 * ModelSelector: Lets users choose the Ollama model tag.
 *
 * Responsibilities:
 * - Fetch available models from mock API on mount
 * - Render large source buttons using exact model tags
 * - Dispatch selected model into global state
 * - Trigger transition to DASHBOARD on source button click
 *
 * @returns {JSX.Element} Model selector UI
 */
export default function ModelSelector() {
  const { state, dispatch } = useAppState();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    /**
     * Loads model options and handles local loading/error state.
     *
     * @returns {Promise<void>} Resolves when model list finishes loading
     */
    async function loadModels() {
      try {
        setLoading(true);
        setError('');
        const availableModels = await getAvailableModels();
        if (!isMounted) return;
        setModels(availableModels);
      } catch (loadError) {
        console.error('Model loading failed:', loadError);
        if (!isMounted) return;
        setError('The energy sources remain veiled. Try the ritual again.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadModels();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedModelId = state.selectedModel?.id || '';

  /**
   * Handles model pick, persists selection, and starts transition.
   *
   * @param {string} modelId - Selected model identifier
   * @returns {void}
   */
  const handleModelChange = modelId => {
    const model = models.find(item => item.id === modelId);
    if (!model || state.isTransitioning) {
      return;
    }

    dispatch({ type: 'MODEL_SELECTED', payload: { model } });
    dispatch({ type: 'TRANSITION_TO_DASHBOARD' });
  };

  return (
    <section className="w-full h-full flex items-center justify-center pointer-events-auto">
      {!state.isTransitioning && (
      <div className="w-full max-w-xl mx-auto px-6 py-8 rounded-2xl bg-black/40 border border-blue-500/50 backdrop-blur-sm">
        <h1 className="text-2xl md:text-3xl text-gray-100 font-semibold mb-2 text-center">
          Choose Your Ollama Model
        </h1>
        <p className="text-blue-200 text-center mb-6">
          Select an exact model tag to shape your legend.
        </p>

        {loading && (
          <p className="text-center text-gray-300">Gathering available sources...</p>
        )}

        {error && (
          <p className="text-center text-red-400">{error}</p>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {models.map(model => (
                <div
                  key={model.id}
                  className="w-full"
                >
                  <button
                    type="button"
                    className={`w-full min-h-[88px] rounded-xl border px-6 py-5 text-base md:text-lg font-semibold transition-all duration-200 ${selectedModelId === model.id ? 'border-red-400 text-red-200 bg-blue-900/40' : 'border-blue-400/50 text-blue-100 bg-black/20 hover:border-red-400 hover:text-red-200 hover:bg-blue-900/25'}`}
                    onClick={() => handleModelChange(model.id)}
                    disabled={state.isTransitioning}
                  >
                    {model.id}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}
    </section>
  );
}
