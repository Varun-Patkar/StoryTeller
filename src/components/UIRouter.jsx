/**
 * UIRouter: URL-based routing with React Router
 * 
 * Routes to different UI screens based on URL path.
 * Each route has its own isolated UI component with protection.
 * StorySetup and StoryReader are lazy-loaded to reduce initial bundle size.
 * 
 * Route Flow:
 * 1. / → BootSequence (connection check)
 * 2. /select-model → ModelSelector (AI model selection)
 * 3. /dashboard → Dashboard (resume/create options)
 * 4. /setup → StorySetup (form collection)
 * 5. /story/:slug → StoryReader (immersive reading interface)
 * 
 * Protection:
 * - Routes check prerequisites before rendering
 * - Invalid access redirects to appropriate starting point
 * - State machine stays in sync with URL changes
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppState } from '@/services/appState.jsx';
import BootSequence from '@/components/ui/BootSequence';
import ModelSelector from '@/components/ui/ModelSelector';
import Dashboard from '@/components/ui/Dashboard';

// Lazy load heavy components to reduce initial bundle size
const StorySetup = lazy(() => import('@/components/ui/StorySetup'));
const StoryReader = lazy(() => import('@/components/ui/StoryReader'));

/**
 * ProtectedRoute: Wrapper for routes requiring prerequisites
 * 
 * Checks if user has completed required steps before rendering component.
 * Redirects to appropriate starting point if prerequisites not met.
 * 
 * @param {Object} props
 * @param {React.Component} props.component - Component to render if authorized
 * @param {Array<string>} props.requires - Array of prerequisite checks
 * @returns {JSX.Element} Protected component or redirect
 */
function ProtectedRoute({ component: Component, requires = [] }) {
  const { state } = useAppState();
  
  // Check connection requirement
  if (requires.includes('connectionOnline') && state.connectionStatus !== 'online') {
    return <Navigate to="/" replace />;
  }
  
  // Check model selection requirement
  if (requires.includes('modelSelected') && !state.selectedModel) {
    return <Navigate to="/select-model" replace />;
  }
  
  // Check story existence requirement
  if (requires.includes('storyExists') && !state.currentStoryId) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // All prerequisites met, render component
  return <Component />;
}

/**
 * UIRouter: Main routing component
 * Uses React Router for URL-based navigation
 */
export default function UIRouter() {
  return (
    <div className="w-full h-full relative">
      {/* Define all application routes */}
      <Suspense fallback={null}>
        <Routes>
          {/* Root: Boot sequence */}
          <Route path="/" element={<BootSequence />} />
          
          {/* Model selection: Requires successful connection */}
          <Route 
            path="/select-model" 
            element={
              <ProtectedRoute 
                component={ModelSelector} 
                requires={['connectionOnline']} 
              />
            } 
          />
          
          {/* Dashboard: Requires connection and model */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute 
                component={Dashboard} 
                requires={['connectionOnline', 'modelSelected']} 
              />
            } 
          />
          
          {/* Story setup: Requires connection and model */}
          <Route 
            path="/setup" 
            element={
              <ProtectedRoute 
                component={StorySetup} 
                requires={['connectionOnline', 'modelSelected']} 
              />
            } 
          />
          
          {/* Story reader: Requires everything */}
          <Route 
            path="/story/:slug" 
            element={
              <ProtectedRoute 
                component={StoryReader} 
                requires={['connectionOnline', 'modelSelected', 'storyExists']} 
              />
            } 
          />
          
          {/* 404: Redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
