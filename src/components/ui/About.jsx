import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/services/appState.jsx';
import Button from '@/components/common/Button';

/**
 * About: Information page explaining StoryTeller and its developer.
 *
 * Layout:
 * - Right-side panel occupying 50vw (matches StorySetup)
 * - Logo at top with back button
 * - Website description
 * - Developer information with GitHub profile link
 * - Accessible to all users (no connection/model required)
 * - Uses ABOUT pseudo-phase for consistent surface-level Earth animation
 *
 * Animation:
 * - DASHBOARD → ABOUT: Triggers earthToSurface (same as SETUP)
 * - ABOUT → DASHBOARD: Triggers surfaceToEarth (zoom back out)
 *
 * @returns {JSX.Element} About page UI
 */
export default function About() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();

  /**
   * Handles back button click to return to previous location.
   * Triggers reverse animation when going back to Dashboard.
   *
   * @returns {void}
   */
  const handleBack = () => {
    if (state.isTransitioning) {
      return;
    }
    
    // For authenticated users with connection, go back to dashboard with animation
    if (state.selectedModel && state.connectionStatus === 'ONLINE') {
      dispatch({ type: 'TRANSITION_TO_DASHBOARD' });
      navigate('/dashboard');
    } else {
      // For users without model/connection, go back to root
      // Transition back to appropriate early phase
      if (state.connectionStatus === 'ONLINE') {
        dispatch({ type: 'TRANSITION_TO_SELECTING_SOURCE' });
      } else {
        dispatch({ type: 'TRANSITION_TO_CHECKING_ENGINE' });
      }
      navigate('/');
    }
  };

  return (
    <section className="absolute top-0 right-0 h-full w-[50vw] pointer-events-auto">
      <div className="story-scrollbar h-full w-full bg-black/45 backdrop-blur-sm border-l border-blue-500/30 px-8 py-6 flex flex-col animate-[panelSlide_0.6s_ease-out] overflow-y-auto">
        
        {/* Header with back button and logo */}
        <header className="relative flex items-center justify-between mb-8 mt-3 animate-[fadeUp_0.5s_ease-out]">
          {/* Back button */}
          <button
            onClick={handleBack}
            disabled={state.isTransitioning}
            className="flex items-center gap-2 px-4 py-2 rounded text-blue-300 hover:text-blue-100 hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Back"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
                clipRule="evenodd" 
              />
            </svg>
            Back
          </button>

          {/* Logo centered */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <img src="/logo.png" alt="StoryTeller logo" className="h-12 sm:h-30 w-auto" />
          </div>

          {/* Spacer for layout balance */}
          <div className="w-20"></div>
        </header>

        {/* Page title */}
        <div className="mb-8 animate-[fadeUp_0.6s_ease-out]">
          <h1 className="text-3xl text-gray-100 font-bold mb-2">
            About StoryTeller
          </h1>
          <p className="text-blue-200">
            Where imagination meets AI-powered storytelling
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-8 animate-[fadeUp_0.7s_ease-out]">
          
          {/* What is StoryTeller section */}
          <div className="space-y-4">
            <h2 className="text-xl text-gray-100 font-semibold border-b border-blue-500/30 pb-2">
              ✨ What is StoryTeller?
            </h2>
            <div className="text-gray-300 space-y-3 leading-relaxed">
              <p>
                StoryTeller is a cinematic 3D web application that brings interactive fiction
                to life. Choose your favorite anime universe, define your protagonist, and
                embark on an AI-powered text adventure where your choices shape the narrative.
              </p>
              <p>
                Powered by <strong className="text-blue-300">Ollama</strong> running locally
                on your machine, StoryTeller generates unique, immersive story passages in
                real-time. Every decision creates a branching path through your personalized
                adventure.
              </p>
              <p>
                The experience combines a stunning 3D Earth canvas with intuitive storytelling
                interfaces, creating a mystical journey from the cosmos to your very own tale.
              </p>
            </div>
          </div>

          {/* Key Features section */}
          <div className="space-y-4">
            <h2 className="text-xl text-gray-100 font-semibold border-b border-blue-500/30 pb-2">
              🎯 Key Features
            </h2>
            <ul className="text-gray-300 space-y-2 pl-5">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">▸</span>
                <span><strong className="text-gray-200">AI-Powered Storytelling:</strong> Real-time narrative generation using local LLM models</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">▸</span>
                <span><strong className="text-gray-200">Cinematic 3D Experience:</strong> Beautiful Earth animations and space-to-surface transitions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">▸</span>
                <span><strong className="text-gray-200">Popular Fandoms:</strong> Set your stories in Naruto, One Piece, Attack on Titan, Douluo Dalu, and more</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">▸</span>
                <span><strong className="text-gray-200">Choice-Driven Narrative:</strong> Shape your adventure through meaningful decisions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">▸</span>
                <span><strong className="text-gray-200">Story Management:</strong> Save, resume, and share your adventures</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">▸</span>
                <span><strong className="text-gray-200">Privacy First:</strong> All AI generation happens locally—your stories stay on your device</span>
              </li>
            </ul>
          </div>

          {/* Technology Stack section */}
          <div className="space-y-4">
            <h2 className="text-xl text-gray-100 font-semibold border-b border-blue-500/30 pb-2">
              🛠️ Technology Stack
            </h2>
            <div className="text-gray-300 space-y-2">
              <p>
                <strong className="text-gray-200">Frontend:</strong> React + Three.js + Vite + Tailwind CSS
              </p>
              <p>
                <strong className="text-gray-200">Backend:</strong> Vercel Serverless Functions + MongoDB
              </p>
              <p>
                <strong className="text-gray-200">AI Engine:</strong> Ollama (local LLM runtime)
              </p>
              <p>
                <strong className="text-gray-200">Authentication:</strong> GitHub OAuth
              </p>
            </div>
          </div>

          {/* Developer section */}
          <div className="space-y-4">
            <h2 className="text-xl text-gray-100 font-semibold border-b border-blue-500/30 pb-2">
              👨‍💻 Meet the Developer
            </h2>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-4">
                <img 
                  src="https://varunpatkar.vercel.app/profilephoto.jpg" 
                  alt="Varun Patkar"
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-400/50"
                />
                <div>
                  <h3 className="text-xl text-gray-100 font-semibold">Varun Patkar</h3>
                  <p className="text-gray-400 text-sm">Full-Stack Developer & AI Enthusiast</p>
                </div>
              </div>
              
              <p className="text-gray-300 leading-relaxed">
                Passionate about combining immersive 3D experiences with AI to create
                unique interactive storytelling platforms. StoryTeller was born from a love
                of anime, literature, and cutting-edge technology.
              </p>

              {/* Social Links */}
              <div className="pt-2 space-y-4">
                {/* Portfolio Website - Featured button */}
                <a
                  href="https://varunpatkar.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                >
                  <svg 
                    className="w-5 h-5 group-hover:rotate-12 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span>Visit Portfolio Website</span>
                  <svg 
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>

                {/* Social media grid */}
                <div className="grid grid-cols-3 gap-3">
                  {/* GitHub */}
                  <a
                    href="https://github.com/Varun-Patkar/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center justify-center gap-2 px-4 py-4 bg-gray-800/80 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    <svg 
                      className="w-7 h-7 text-gray-300 group-hover:text-white transition-colors" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">GitHub</span>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href="https://www.linkedin.com/in/varun-patkar/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center justify-center gap-2 px-4 py-4 bg-blue-700/80 hover:bg-blue-600 border border-blue-600 hover:border-blue-500 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    <svg 
                      className="w-7 h-7 text-blue-200 group-hover:text-white transition-colors" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span className="text-sm font-medium text-blue-100 group-hover:text-white transition-colors">LinkedIn</span>
                  </a>

                  {/* Twitter/X */}
                  <a
                    href="https://x.com/Varun_Patkar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center justify-center gap-2 px-4 py-4 bg-gray-900/80 hover:bg-black border border-gray-700 hover:border-gray-600 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    <svg 
                      className="w-7 h-7 text-gray-300 group-hover:text-white transition-colors" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">X/Twitter</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Getting Started section */}
          <div className="space-y-4 pb-8">
            <h2 className="text-xl text-gray-100 font-semibold border-b border-blue-500/30 pb-2">
              🚀 Getting Started
            </h2>
            <div className="text-gray-300 space-y-3">
              <p>
                To begin your journey:
              </p>
              <ol className="list-decimal pl-6 space-y-3">
                <li>Install <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline font-semibold">Ollama</a> on your machine</li>
                <li>Download an AI model (e.g., <code className="text-blue-300 bg-black/40 px-2 py-1 rounded font-mono text-sm">ollama pull llama3.1:8b</code>)</li>
                <li>Start Ollama and configure dev tunnels if needed (<a href="/" className="text-blue-400 hover:text-blue-300 underline">go to /</a> for setup instructions)</li>
                <li>Select your energy source (AI model) from the dropdown</li>
                <li>Sign in with GitHub to save and share your stories</li>
                <li>Create your first adventure and let your imagination soar!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
