import { useCallback, useEffect, useState } from 'react';
import { useAppState } from '@/services/appState.jsx';
import { checkOllamaConnection } from '@/services/mockApi';
import Button from '@/components/common/Button';

/**
 * BootSequence: Mystical connection check screen.
 *
 * Responsibilities:
 * - Starts backend connection check on mount
 * - Shows CHECKING / ONLINE / OFFLINE status messaging
 * - Provides retry path when offline
 * - Automatically transitions to SELECTING_SOURCE when online
 *
 * @returns {JSX.Element} Boot sequence overlay UI
 */
export default function BootSequence() {
  const { state, dispatch } = useAppState();
  const [isChecking, setIsChecking] = useState(false);

  /**
   * Executes one connection check cycle and updates global state.
   *
   * @returns {Promise<void>} Resolves when check completes
   */
  const runConnectionCheck = useCallback(async () => {
    setIsChecking(true);
    dispatch({ type: 'CONNECTION_CHECK_START' });

    try {
      const result = await checkOllamaConnection();
      if (result.status === 'online') {
        dispatch({
          type: 'CONNECTION_CHECK_SUCCESS',
          payload: { timestamp: result.timestamp },
        });
      } else {
        dispatch({
          type: 'CONNECTION_CHECK_FAILURE',
          payload: { message: result.message },
        });
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      dispatch({
        type: 'CONNECTION_CHECK_FAILURE',
        payload: {
          message: 'Ollama is not awakened yet. Call it forth to begin.',
        },
      });
    } finally {
      setIsChecking(false);
    }
  }, [dispatch]);

  useEffect(() => {
    runConnectionCheck();
  }, [runConnectionCheck]);

  useEffect(() => {
    if (
      state.phase === 'CHECKING_ENGINE' &&
      state.connectionStatus === 'ONLINE' &&
      !state.isTransitioning
    ) {
      dispatch({ type: 'TRANSITION_TO_SELECTING_SOURCE' });
    }
  }, [state.phase, state.connectionStatus, state.isTransitioning, dispatch]);

  /**
   * Triggers another connection attempt from OFFLINE state.
   *
   * @returns {void}
   */
  const handleRetry = () => {
    dispatch({ type: 'CONNECTION_RETRY' });
    runConnectionCheck();
  };

  const isOffline = state.connectionStatus === 'OFFLINE';

  return (
    <section className="w-full h-full flex items-center justify-center pointer-events-auto">
      <div className="w-full max-w-xl mx-auto px-6 py-8 text-center rounded-2xl bg-black/40 border border-blue-500/50 backdrop-blur-sm">
        <p className="text-3xl mb-5">✨</p>

        {!isOffline && (
          <>
            <h1 className="text-2xl md:text-3xl text-gray-100 font-semibold mb-3">
              Awakening the gateway...
            </h1>
            <p className="text-blue-200">
              The realm listens for the first pulse of your journey.
            </p>
          </>
        )}

        {state.connectionStatus === 'ONLINE' && (
          <p className="mt-4 text-red-300">The gateway awakens...</p>
        )}

        {isOffline && (
          <>
            <h1 className="text-2xl md:text-3xl text-red-200 font-semibold mb-3">
              The gateway sleeps...
            </h1>
            <p className="text-gray-200 mb-5">
              {state.error?.message ||
                'Ollama is not awakened yet. Call it forth to begin.'}
            </p>
            <Button
              variant="secondary"
              onClick={handleRetry}
              disabled={isChecking || state.isTransitioning}
            >
              {isChecking ? 'Rekindling...' : 'Retry Connection'}
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
