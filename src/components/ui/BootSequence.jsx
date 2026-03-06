import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [tunnelHelpTab, setTunnelHelpTab] = useState('vscode');
  const [devTunnelUrl, setDevTunnelUrl] = useState(
    () => localStorage.getItem('devTunnelUrl') || ''
  );
  const [tunnelUrlError, setTunnelUrlError] = useState('');

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
      // Connection successful - move to model selection
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
   * Save dev tunnel URL and retry connection
   */
  const handleSaveTunnelAndRetry = () => {
    const trimmed = devTunnelUrl.trim();
    
    if (!trimmed) {
      setTunnelUrlError('Please enter a dev tunnel URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(trimmed);
      localStorage.setItem('devTunnelUrl', trimmed);
      dispatch({ type: 'OLLAMA_URL_CONFIGURED', payload: { devTunnelUrl: trimmed } });
      setTunnelUrlError('');
      // Retry connection with new URL
      dispatch({ type: 'CONNECTION_RETRY' });
      runConnectionCheck();
    } catch {
      setTunnelUrlError('Invalid URL. Must be https://your-tunnel.devtunnels.ms');
    }
  };

  /**
   * Generate the correct Ollama startup command based on shell type.
   * Uses the current browser location origin for CORS configuration.
   * 
   * @param {string} shell - 'powershell', 'bash', or 'cmd'
   * @returns {string} The command to run in the terminal
   */
  const getOllamaCommand = (shell) => {
    // Always use the current app root origin (no path segments like /dashboard).
    const origin = window.location.origin.replace(/\/+$/, '');
    
    switch (shell) {
      case 'powershell':
        return `$env:OLLAMA_ORIGINS="${origin}";ollama serve`;
      case 'bash':
        return `OLLAMA_ORIGINS="${origin}" ollama serve`;
      case 'cmd':
        return `set OLLAMA_ORIGINS=${origin} && ollama serve`;
      default:
        return `OLLAMA_ORIGINS="${origin}" ollama serve`;
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

        {/* OFFLINE STATE - DEV TUNNEL URL EDITOR */}
        {state.connectionStatus === 'OFFLINE' && (
          <div className="text-center">
            <p className="text-4xl mb-4">🔌</p>
            <h1 className="text-2xl md:text-3xl text-red-200 font-semibold mb-3">
              Dev tunnel not configured
            </h1>
            <p className="text-red-300 text-sm mb-6">
              StoryTeller requires access to your local Ollama instance via a dev tunnel.
              <br/><span className="text-xs text-gray-300 mt-2 block">This is a BYOM (Bring Your Own Model) application. Enter your dev tunnel URL to access your Ollama.</span>
            </p>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-5 mb-6 text-left">
              <label className="block text-red-200 font-semibold mb-3 text-sm">
                🌐 Update Dev Tunnel URL
              </label>
              <input
                type="text"
                value={devTunnelUrl}
                onChange={(e) => {
                  setDevTunnelUrl(e.target.value);
                  setTunnelUrlError('');
                }}
                placeholder="https://your-tunnel.devtunnels.ms"
                className="w-full px-3 py-2 bg-black/50 border border-red-500/40 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:border-red-400 text-sm mb-2"
              />
              {tunnelUrlError && (
                <p className="text-red-400 text-xs mb-2">❌ {tunnelUrlError}</p>
              )}
            </div>

            <div className="flex gap-3 justify-center mb-4">
              <Button
                variant="primary"
                onClick={handleSaveTunnelAndRetry}
                disabled={isChecking || state.isTransitioning}
              >
                {isChecking ? 'Checking...' : '✓ Update & Retry'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleRetry}
                disabled={isChecking || state.isTransitioning}
              >
                Retry with current URL
              </Button>
            </div>

            <div className="text-left">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-gray-400 hover:text-gray-200 underline"
              >
                {showAdvanced ? '▼' : '▶'} 🔗 Full Setup Guide: Start Ollama & Set Up Tunnel
              </button>
              {showAdvanced && (
                <div className="mt-3 p-4 bg-black/30 rounded text-xs text-gray-300 space-y-4 border border-gray-600/20">
                  {/* Step 1: Install & Start Ollama */}
                  <div>
                    <h3 className="text-amber-200 font-semibold mb-2 text-sm">Step 1: Install & Start Ollama</h3>
                    <p className="mb-2">If you don't have Ollama, <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">download and install it</a>.</p>
                    <p className="mb-2">Start Ollama with CORS enabled so StoryTeller can connect. Choose your shell:</p>
                    <div className="flex gap-2 mb-2">
                      {[
                        { id: 'powershell', label: '⚙️ PowerShell 7' },
                        { id: 'bash', label: '🐧 Bash (Linux/Mac)' },
                        { id: 'cmd', label: '🟦 CMD (Windows Legacy)' }
                      ].map(shell => (
                        <button
                          key={shell.id}
                          onClick={() => setSelectedShell(shell.id)}
                          className={`text-xs px-3 py-1 rounded transition ${selectedShell === shell.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {shell.label}
                        </button>
                      ))}
                    </div>
                    <div className="bg-black/60 p-2 rounded border border-amber-600/30 flex items-center justify-between gap-2">
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

                  {/* Step 2: Dev Tunnel */}
                  <div className="border-t border-gray-600/50 pt-4">
                    <h3 className="text-amber-200 font-semibold mb-2 text-sm">Step 2: Start a Dev Tunnel</h3>
                    <p className="mb-3">Expose your local Ollama securely. Choose your method:</p>
                    
                    <div className="flex gap-2 mb-3 border-b border-gray-600/50 pb-3">
                      <button 
                        onClick={() => setTunnelHelpTab('vscode')} 
                        className={`text-xs px-3 py-1.5 rounded transition ${tunnelHelpTab === 'vscode' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                      >
                        💻 VS Code (Recommended)
                      </button>
                      <button 
                        onClick={() => setTunnelHelpTab('powershell')} 
                        className={`text-xs px-3 py-1.5 rounded transition ${tunnelHelpTab === 'powershell' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                      >
                        ⚙️ PowerShell CLI
                      </button>
                    </div>

                    {tunnelHelpTab === 'vscode' && (
                      <ol className="space-y-2 list-decimal list-inside pl-1 text-gray-300">
                        <li>Open your VS Code editor.</li>
                        <li>Open the Bottom Panel (<kbd className="bg-gray-800 border border-gray-600 px-1 rounded text-[10px]">Ctrl</kbd> + <kbd className="bg-gray-800 border border-gray-600 px-1 rounded text-[10px]">J</kbd>) and click the <strong>Ports</strong> tab (next to Terminal).</li>
                        <li>Click <strong>Forward a Port</strong> and enter <code className="text-amber-200 font-mono bg-black/40 px-1 rounded">11434</code>.</li>
                        <li>Right-click the newly forwarded port, select <strong>Port Visibility</strong>, and change it to <strong>Public</strong>.</li>
                        <li>Copy the Forwarded Address (looks like <code className="font-mono text-[10px] text-gray-400">https://...devtunnels.ms</code>) and paste it in the box above.</li>
                      </ol>
                    )}

                    {tunnelHelpTab === 'powershell' && (
                      <ol className="space-y-2 list-decimal list-inside pl-1 text-gray-300">
                        <li>Install the devtunnel CLI if you haven't (search for "microsoft dev tunnels").</li>
                        <li>Open PowerShell and run this command:</li>
                        <div className="ml-4 my-2 bg-black/60 p-2 rounded border border-amber-600/30 font-mono text-amber-200 text-xs break-all w-fit">
                          devtunnel host -p 11434
                        </div>
                        <li>Wait for it to say "Ready to accept connections".</li>
                        <li>Copy the Hosting URL and paste it in the box above.</li>
                      </ol>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ABOUT LINK */}
            <div className="mt-6 text-center">
              <Link 
                to="/about" 
                className="text-sm text-purple-400 hover:text-purple-200 underline transition-colors"
              >
                Learn more about StoryTeller
              </Link>
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
                    Paste and run this exact command in your local terminal:
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
                  <p className="text-gray-400 text-xs italic mt-2">This command uses the current app URL root automatically (for example, https://story-teller-chi.vercel.app/).</p>
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
                {showAdvanced ? '▼' : '▶'} � Local development: Run Ollama without tunnel
              </button>
              {showAdvanced && (
                <div className="mt-3 p-4 bg-black/30 rounded text-xs text-gray-300 space-y-3 border border-gray-600/20">
                  <p className="text-amber-200 font-semibold mb-2">For local testing only (not for deployed app):</p>
                  <p className="text-gray-300 text-xs mb-2">
                    If running StoryTeller on localhost:5173, start Ollama directly with CORS:
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
                        className={`text-xs px-3 py-1 rounded transition ${selectedShell === shell.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {shell.label}
                      </button>
                    ))}
                  </div>
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
                  <p className="text-gray-400 text-xs italic mt-2">This command uses your current app URL root automatically.</p>
                </div>
              )}
            </div>

            {/* ABOUT LINK */}
            <div className="mt-6 text-center">
              <Link 
                to="/about" 
                className="text-sm text-purple-400 hover:text-purple-200 underline transition-colors"
              >
                Learn more about StoryTeller
              </Link>
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
