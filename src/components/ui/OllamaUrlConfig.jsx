/**
 * OllamaUrlConfig: Configure dev tunnel URL for accessing Ollama from deployed app
 *
 * When StoryTeller is deployed to Vercel, it can't access localhost:11434.
 * This component guides users to:
 * 1. Set up a dev tunnel (VS Code or PowerShell)
 * 2. Run Ollama with CORS enabled through the tunnel
 * 3. Enter the tunnel URL for future API calls
 *
 * @returns {JSX.Element} Dev tunnel configuration UI
 */
import { useState } from 'react';
import { useAppState } from '@/services/appState.jsx';
import Button from '@/components/common/Button';

export default function OllamaUrlConfig() {
  const { state, dispatch } = useAppState();
  const [devTunnelUrl, setDevTunnelUrl] = useState(
    () => localStorage.getItem('devTunnelUrl') || ''
  );
  const [showInstructions, setShowInstructions] = useState(true);
  const [error, setError] = useState('');

  /**
   * Validate and save the dev tunnel URL
   */
  const handleSaveUrl = () => {
    const trimmed = devTunnelUrl.trim();
    
    if (!trimmed) {
      setError('Please enter a dev tunnel URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(trimmed);
      localStorage.setItem('devTunnelUrl', trimmed);
      setError('');
      dispatch({ type: 'OLLAMA_URL_CONFIGURED', payload: { devTunnelUrl: trimmed } });
      // Transition to model selection
      dispatch({ type: 'TRANSITION_COMPLETE', payload: { targetPhase: 'SELECTING_SOURCE' } });
    } catch {
      setError('Invalid URL. Must be a valid HTTP(S) address like https://xyz-123.devtunnels.ms');
    }
  };

  /**
   * Skip using tunnel and continue with localhost
   */
  const handleSkip = () => {
    localStorage.removeItem('devTunnelUrl');
    dispatch({ type: 'OLLAMA_URL_CONFIGURED', payload: { devTunnelUrl: '' } });
    // Transition to model selection
    dispatch({ type: 'TRANSITION_COMPLETE', payload: { targetPhase: 'SELECTING_SOURCE' } });
  };

  return (
    <section className="w-full h-full flex items-center justify-center pointer-events-auto overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto px-6 py-8 rounded-2xl bg-black/40 border border-purple-500/50 backdrop-blur-sm my-8">
        
        <div className="text-center mb-8">
          <p className="text-4xl mb-3">🌐</p>
          <h1 className="text-2xl md:text-3xl text-purple-200 font-semibold mb-2">
            Configure Ollama Access
          </h1>
          <p className="text-purple-300 text-sm">
            {state.isDeployed 
              ? 'Your app is deployed. Set up a tunnel to access Ollama from the internet.'
              : 'Optional: Use a dev tunnel to access Ollama remotely.'}
          </p>
        </div>

        {/* INSTRUCTIONS */}
        {showInstructions && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-5 mb-6 text-left max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-purple-200 font-semibold">📖 Setup Instructions</h2>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-xs text-purple-400 hover:text-purple-200 underline"
              >
                Hide
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-300">
              
              <div>
                <p className="text-amber-200 font-semibold mb-2">Step 1: Start Ollama with CORS enabled</p>
                <p className="text-gray-400 mb-2">
                  Open a terminal and run one of these commands:
                </p>
                <div className="space-y-2">
                  <div className="bg-black/50 p-2 rounded font-mono text-xs break-all">
                    <span className="text-gray-500"># PowerShell:</span>
                    <br />
                    <span className="text-blue-300">
                      $env:OLLAMA_ORIGINS="http://localhost:5173;https://*"; ollama serve
                    </span>
                  </div>
                  <div className="bg-black/50 p-2 rounded font-mono text-xs break-all">
                    <span className="text-gray-500"># Bash:</span>
                    <br />
                    <span className="text-blue-300">
                      OLLAMA_ORIGINS="http://localhost:5173;https://*" ollama serve
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-amber-200 font-semibold mb-2">Step 2: Create a dev tunnel</p>
                <p className="text-gray-400 mb-2">
                  Choose one option:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
                  <li>
                    <span className="text-purple-300">VS Code Dev Tunnels:</span> Open Command Palette (Ctrl+Shift+P), search "dev tunnel", click "Create Tunnel"
                  </li>
                  <li>
                    <span className="text-purple-300">PowerShell Port Forwarding:</span> Run <code className="bg-black/30 px-1 rounded">devtunnel host -p 11434</code>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-amber-200 font-semibold mb-2">Step 3: Get your tunnel URL</p>
                <p className="text-gray-400">
                  The tunnel will show a public URL like <code className="text-blue-300 bg-black/30 px-1 rounded">https://abc-123.devtunnels.ms</code>.
                  Copy it and paste below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* URL INPUT */}
        <div className="mb-6">
          <label className="block text-purple-200 font-semibold mb-2 text-sm">
            Dev Tunnel URL (Optional)
          </label>
          <input
            type="text"
            value={devTunnelUrl}
            onChange={(e) => {
              setDevTunnelUrl(e.target.value);
              setError('');
            }}
            placeholder="https://your-tunnel.devtunnels.ms"
            className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-400 text-sm"
          />
          {error && (
            <p className="text-red-400 text-xs mt-2">❌ {error}</p>
          )}
          <p className="text-gray-400 text-xs mt-2">
            If you don't enter a URL, Ollama requests will use <code className="bg-black/30 px-1 rounded">http://localhost:11434</code> (local development only)
          </p>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={handleSaveUrl}
            variant="primary"
            className="px-6"
          >
            ✓ Save & Continue
          </Button>
          <Button
            onClick={handleSkip}
            variant="secondary"
            className="px-6"
          >
            Skip for Now
          </Button>
        </div>

        {/* STORED URL INFO */}
        {localStorage.getItem('devTunnelUrl') && (
          <div className="mt-6 p-3 bg-green-900/20 border border-green-500/30 rounded text-sm text-green-300">
            ✓ Tunnel URL is set. You can update it here anytime if it changes.
          </div>
        )}
      </div>
    </section>
  );
}
