/**
 * UIRouter: Phase-based conditional rendering
 * 
 * Routes to different UI screens based on current app phase.
 * Each phase has its own isolated UI component.
 * StorySetup and StoryReader are lazy-loaded to reduce initial bundle size.
 * 
 * Phase Flow:
 * 1. CHECKING_ENGINE → BootSequence (connection check)
 * 2. SELECTING_SOURCE → ModelSelector (AI model selection)
 * 3. DASHBOARD → Dashboard (resume/create options)
 * 4. SETUP → StorySetup (form collection)
 * 5. PLAYING → StoryReader (immersive reading interface)
 */

import { lazy, Suspense } from 'react';
import { useAppState } from '@/services/appState.jsx';
import BootSequence from '@/components/ui/BootSequence';
import ModelSelector from '@/components/ui/ModelSelector';
import Dashboard from '@/components/ui/Dashboard';

// Lazy load heavy components to reduce initial bundle size
const StorySetup = lazy(() => import('@/components/ui/StorySetup'));
const StoryReader = lazy(() => import('@/components/ui/StoryReader'));

/**
 * UIRouter: Main routing component
 * Conditionally renders UI based on phase
 */
export default function UIRouter() {
  const { state } = useAppState();
  const { phase } = state;

  return (
    <div className="w-full h-full relative">
      {/* Phase-specific UI content */}
      <div className="w-full h-full">
        {/* Phase 1: Connection Check */}
        {phase === 'CHECKING_ENGINE' && !state.isTransitioning && <BootSequence />}

        {/* Phase 2: Model Selection */}
        {phase === 'SELECTING_SOURCE' && !state.isTransitioning && <ModelSelector />}

        {/* Phase 3: Story Dashboard */}
        {phase === 'DASHBOARD' && !state.isTransitioning && <Dashboard />}

        {/* Phase 4: Story Setup */}
        {phase === 'SETUP' && !state.isTransitioning && (
          <Suspense fallback={null}>
            <StorySetup />
          </Suspense>
        )}

        {/* Phase 5: Story Reading */}
        {phase === 'PLAYING' && !state.isTransitioning && (
          <Suspense fallback={null}>
            <StoryReader />
          </Suspense>
        )}

        {/* Fallback: Unknown phase */}
        {!['CHECKING_ENGINE', 'SELECTING_SOURCE', 'DASHBOARD', 'SETUP', 'PLAYING'].includes(
          phase
        ) && (
          <div className="flex items-center justify-center w-full h-full">
            <p className="text-red-500">Unknown phase: {phase}</p>
          </div>
        )}
      </div>

    </div>
  );
}
