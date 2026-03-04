import { useCallback, useEffect, useState } from 'react';
import { useAppState } from '@/services/appState.jsx';
import { checkOllamaConnection } from '@/services/mockApi';
import Button from '@/components/common/Button';

/**
 * BootSequence: Mystical connection check screen.
 *
 * Responsibilities:
 * - Starts backend connection check on mount
 * - Shows CHECKING / ONLINE / OFFLINE / CORS_ERROR status messaging
 * - Provides retry path when offline or CORS blocked
 * - Shows CORS remediation instructions when needed
 * - Automatically transitions to SELECTING_SOURCE when online
 *
 * @returns {JSX.Element} Boot sequence overlay UI
 */
export default function BootSequence() {
  const { state, dispatch } = useAppState();
  const [isChecking, setIsChecking] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedShell, setSelectedShell] = useState('powershell');

  /**
   * Executes one connection check cycle and updates global state.
   *
   * Detects three states:
   * - "online": Ollama running and accessible ✓
   * - "offline": Ollama not responding (not running, wrong port, etc)
   * - "cors_error": Ollama running but CORS policy blocks access
   *
   * @returns {Promise<void>} Resolves when check completes
   */
  const runConnectionCheck = useCallback(async () => {
    setIsChecking(true);
    dispatch({ type: 'CONNECTION_CHECK_START' });

    try {
      const result = await checkOllamaConnection();
      
      if (result.status === 'online') {
        // Success: Ollama is running and accessible
        dispatch({
          type: 'CONNECTION_CHECK_SUCCESS',
          payload: { timestamp: result.timestamp },
        });
      } else if (result.status === 'cors_error') {
        // CORS Error: Ollama running but browser blocked (need OLLAMA_ORIGINS)
        dispatch({
          type: 'CONNECTION_CHECK_CORS_ERROR',
          payload: {
            message: 'Browser blocked access to Ollama. See instructions below.',
            corsFix: generateCorsFix(),
          },
        });
      } else {
        // Offline: Ollama not responding
        dispatch({
          type: 'CONNECTION_CHECK_FAILURE',
          payload: { message: result.message || result.error },
        });
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      dispatch({
        type: 'CONNECTION_CHECK_FAILURE',
        payload: {
          message: 'Connection check error: ' + error.message,
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
      // Transition to model selection phase (stays at same URL)
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

  /**
   * Generate the correct Ollama startup command based on shell type.
   * 
   * @param {string} shell - 'powershell', 'bash', or 'cmd'
   * @returns {string} The command to run in the terminal
   */
  const getOllamaCommand = (shell) => {
    const origins = 'http://localhost:5173;http://localhost:3000';
    switch (shell) {
      case 'powershell':
        return `$env:OLLAMA_ORIGINS="${origins}"; ollama serve`;
      case 'bash':
        return `OLLAMA_ORIGINS="${origins}" ollama serve`;
      case 'cmd':
        return `set OLLAMA_ORIGINS=${origins} && ollama serve`;
      default:
        return `OLLAMA_ORIGINS="${origins}" ollama serve`;
    }
  };

  /**
   * Copy command to clipboard for easy pasting
   */
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Command copied to clipboard! Paste it in your terminal.');
  };

  const isFailed = state.connectionStatus === 'OFFLINE' || 
                    state.connectionStatus === 'CORS_ERROR';

  return (
    <section className="w-full h-full flex items-center justify-center pointer-events-auto overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto px-6 py-8 rounded-2xl bg-black/40 border border-blue-500/50 backdrop-blur-sm my-8">
        
        {/* CHECKING STATE */}
        {state.connectionStatus === 'CHECKING' && (
          <div className="text-center">
            <p className="text-4xl mb-5 animate-pulse">✨</p>
            <h1 className="text-2xl md:text-3xl text-gray-100 font-semibold mb-3">
              Awakening the gateway...
            </h1>
            <p className="text-blue-200 mb-6">
              The realm listens for the first pulse of your journey.
            </p>
            <div className="inline-block">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Checking connection to http://localhost:11434...
            </p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {state.connectionStatus === 'ONLINE' && (
          <div className="text-center">
            <p className="text-4xl mb-4">🌟</p>
            <h1 className="text-2xl md:text-3xl text-green-200 font-semibold mb-3">
              The gateway awakens...
            </h1>
            <p className="text-green-300 mb-2">Connection established!</p>
            <p className="text-xs text-gray-400">Preparing your journey...</p>
          </div>
        )}

        {/* OFFLINE STATE - CLEAR STEP-BY-STEP INSTRUCTIONS */}
        {state.connectionStatus === 'OFFLINE' && (
          <div className="text-center">
            <p className="text-4xl mb-4">💤</p>
            <h1 className="text-2xl md:text-3xl text-red-200 font-semibold mb-6">
              The gateway sleeps...
            </h1>
            
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-5 mb-6 text-left">
              <div className="mb-4">
                <p className="text-red-200 font-semibold mb-3">
                  ⚠️ Ollama is not running
                </p>
                <p className="text-red-100 text-sm leading-relaxed mb-4">
                  Ollama must be started on your local machine for StoryTeller to work.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-amber-200 text-sm font-semibold mb-2">
                    📥 Step 1: Download & Install Ollama (if needed)
                  </p>
                  <p className="text-gray-300 text-xs mb-2">
                    If you haven't installed Ollama yet:
                  </p>
                  <p className="text-blue-300 text-xs font-mono bg-black/40 p-2 rounded break-all">
                    Visit: https://ollama.ai
                  </p>
                </div>

                <div>
                  <p className="text-amber-200 text-sm font-semibold mb-2">
                    🖥️ Step 2: Open a New Terminal
                  </p>
                  <p className="text-gray-300 text-xs mb-2">
                    Open a terminal where you can keep Ollama running continuously (PowerShell, Terminal, or Command Prompt).
                  </p>
                </div>

                <div>
                  <p className="text-amber-200 text-sm font-semibold mb-2">
                    ▶️ Step 3: Start Ollama with CORS Support
                  </p>
                  <p className="text-gray-300 text-xs mb-3">
                    Select your shell/terminal type:
                  </p>
                  <div className="flex gap-2 mb-3">
                    {[
                      { id: 'powershell', label: '⚙️ PowerShell 7' },
                      { id: 'bash', label: '🐧 Bash (Linux/Mac)' },
                      { id: 'cmd', label: '🟦 CMD (Windows Legacy)' }
                    ].map(shell => (
                      <button
                        key={shell.id}
                        onClick={() => setSelectedShell(shell.id)}
                        className={`text-xs px-3 py-1 rounded transition ${
                          selectedShell === shell.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {shell.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-gray-300 text-xs mb-2">
                    Copy and paste this command, then press Enter:
                  </p>
                  <div className="bg-black/60 p-3 rounded border border-amber-600/30 flex items-center justify-between gap-2">
                    <code className="text-amber-200 text-xs font-mono flex-1 break-all">
                      {getOllamaCommand(selectedShell)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(getOllamaCommand(selectedShell))}
                      className="text-blue-300 hover:text-blue-100 text-xs whitespace-nowrap ml-2 px-2 py-1 bg-blue-900/30 rounded hover:bg-blue-900/50 transition"
                    >
                      📋 Copy
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    ⏳ Wait for "Listening on" messages to appear (5-10 seconds)
                  </p>
                </div>

                <div>
                  <p className="text-amber-200 text-sm font-semibold mb-2">
                    ✅ Step 4: Come Back & Retry
                  </p>
                  <p className="text-gray-300 text-xs">
                    Return to this page and click the "Retry Connection" button below.
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={handleRetry}
              disabled={isChecking || state.isTransitioning}
            >
              {isChecking ? 'Checking...' : 'Retry Connection'}
            </Button>

            <div className="mt-6 text-left">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-gray-400 hover:text-gray-200 underline"
              >
                {showAdvanced ? '▼' : '▶'} 🆘 Troubleshooting
              </button>
              {showAdvanced && (
                <div className="mt-3 p-4 bg-black/30 rounded text-xs text-gray-300 space-y-3 border border-gray-600/20">
                  <div>
                    <p className="font-semibold text-amber-200 mb-1">❌ Still stuck?</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      <li>Make sure Ollama fully started (wait 5-10 seconds after running command)</li>
                      <li>Check terminal for errors like "permission denied" or "port already in use"</li>
                      <li>Make sure the terminal where you ran the command is still open and running</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-200 mb-1">🔍 Verify Ollama is running:</p>
                    <p className="text-gray-400">Visit http://localhost:11434/api/tags in your browser</p>
                    <p className="text-gray-400">You should see JSON with model information, not an error</p>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-200 mb-1">🚫 Port 11434 blocked?</p>
                    <p className="text-gray-400">Check your firewall. Port 11434 needs to be open locally.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-200 mb-1">🎯 Different Ollama location?</p>
                    <p className="text-gray-400">Edit VITE_OLLAMA_BASE_URL in your .env file</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CORS ERROR STATE - CLEAR STEPS WITH COPY */}
        {state.connectionStatus === 'CORS_ERROR' && (
          <div className="text-center">
            <p className="text-4xl mb-4">🔒</p>
            <h1 className="text-2xl md:text-3xl text-orange-200 font-semibold mb-6">
              Access denied by browser security...
            </h1>
            
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-5 mb-6 text-left">
              <div className="mb-4">
                <p className="text-orange-200 font-semibold mb-2">
                  🔐 CORS Policy Blocked
                </p>
                <p className="text-orange-100 text-sm leading-relaxed">
                  Good news! Ollama is running. The browser just won't allow access due to security policy.
                  The fix is simple: restart Ollama with the correct configuration.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-amber-200 text-sm font-semibold mb-2">
                    ⏹️ Step 1: Stop Ollama
                  </p>
                  <p className="text-gray-300 text-xs mb-2">
                    Find the terminal where Ollama is running and press:
                  </p>
                  <p className="text-gray-200 text-xs font-mono bg-black/40 px-3 py-2 rounded inline-block">
                    Ctrl + C
                  </p>
                </div>

                <div>
                  <p className="text-amber-200 text-sm font-semibold mb-2">
                    ▶️ Step 2: Copy & Run This Command
                  </p>
                  <p className="text-gray-300 text-xs mb-3">
                    Select your shell/terminal type:
                  </p>
                  <div className="flex gap-2 mb-3">
                    {[
                      { id: 'powershell', label: '⚙️ PowerShell 7' },
                      { id: 'bash', label: '🐧 Bash (Linux/Mac)' },
                      { id: 'cmd', label: '🟦 CMD (Windows Legacy)' }
                    ].map(shell => (
                      <button
                        key={shell.id}
                        onClick={() => setSelectedShell(shell.id)}
                        className={`text-xs px-3 py-1 rounded transition ${
                          selectedShell === shell.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {shell.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-gray-300 text-xs mb-2">
                    In that same terminal, paste and run this exact command:
                  </p>
                  <div className="bg-black/60 p-3 rounded border border-amber-600/30 flex items-center justify-between gap-2">
                    <code className="text-amber-200 text-xs font-mono flex-1 break-all">
                      {getOllamaCommand(selectedShell)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(getOllamaCommand(selectedShell))}
                      className="text-blue-300 hover:text-blue-100 text-xs whitespace-nowrap ml-2 px-2 py-1 bg-blue-900/30 rounded hover:bg-blue-900/50 transition"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-amber-200 text-sm font-semibold mb-2">
                    ⏳ Step 3: Wait for Ollama to Start
                  </p>
                  <p className="text-gray-300 text-xs">
                    You should see "Listening on" messages in the terminal. This takes 2-3 seconds.
                  </p>
                </div>

                <div>
                  <p className="text-amber-200 text-sm font-semibold mb-2">
                    ✅ Step 4: Click Retry
                  </p>
                  <p className="text-gray-300 text-xs">
                    Return to this page and click the button below.
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={handleRetry}
              disabled={isChecking || state.isTransitioning}
            >
              {isChecking ? 'Checking...' : 'Retry After Restarting Ollama'}
            </Button>

            <div className="mt-6 text-left">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-gray-400 hover:text-gray-200 underline"
              >
                {showAdvanced ? '▼' : '▶'} 📚 What does "OLLAMA_ORIGINS" mean?
              </button>
              {showAdvanced && (
                <div className="mt-3 p-4 bg-black/30 rounded text-xs text-gray-300 space-y-3 border border-gray-600/20">
                  <p>
                    <strong className="text-amber-200">CORS</strong> = Cross-Origin Resource Sharing
                  </p>
                  <p>
                    It's a browser security feature that prevents websites from accessing your local services without permission.
                  </p>
                  <p>
                    The <code className="bg-black/50 px-1 rounded">OLLAMA_ORIGINS</code> environment variable tells Ollama 
                    which websites are allowed to access it.
                  </p>
                  <p>
                    We're setting it to:
                    <br/>
                    <code className="bg-black/50 px-1 rounded text-amber-200">http://localhost:5173</code> = Your dev browser (Vite)
                    <br/>
                    <code className="bg-black/50 px-1 rounded text-amber-200">http://localhost:3000</code> = Production server (vercel dev)
                  </p>
                  <p>
                    Without this, Ollama refuses browser requests <strong>(for your security)</strong>.
                  </p>
                  <p className="text-amber-200 font-semibold">
                    💡 This is normal and expected!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Generate CORS remediation instructions based on current app origin.
 * Extracts the browser's current origin and provides exact commands.
 *
 * @returns {string} Shell command to start Ollama with correct CORS origins
 */
function generateCorsFix() {
  const currentOrigin = window.location.origin; // e.g., "http://localhost:5173" or "http://localhost:3000"
  
  // In production, Vite is typically at localhost:5173
  // In production deployment, it will be the actual domain
  // Also support localhost:3000 for vercel dev
  const origins = [
    currentOrigin,
    'http://localhost:5173',  // Vite default dev port
    'http://localhost:3000',  // Production/vercel dev server
  ];
  
  // Remove duplicates and filter empty
  const uniqueOrigins = [...new Set(origins)].filter(Boolean);
  
  return `# Restart Ollama with CORS enabled:
${uniqueOrigins.map(o => `OLLAMA_ORIGINS="${o}" ollama serve`).join('\n')}
# or all at once:
OLLAMA_ORIGINS="${uniqueOrigins.join(';')}" ollama serve`;
}
