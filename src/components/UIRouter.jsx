/**
 * UIRouter: URL-based routing with React Router
 * 
 * Routes to different UI screens based on URL path.
 * Each route has its own isolated UI component with protection.
 * StorySetup and StoryReader are lazy-loaded to reduce initial bundle size.
 * 
 * Route Flow:
 * 1. / → BootSequence + ModelSelector (both at root, phase-based)
 * 2. /dashboard → Dashboard (resume/create options)
 * 3. /new → StorySetup (form collection)
 * 4. /story/:slug → StoryReader (immersive reading interface)
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
import NotFound from '@/components/ui/NotFound';

// Lazy load heavy components to reduce initial bundle size
const StorySetup = lazy(() => import('@/components/ui/StorySetup'));
const StoryReader = lazy(() => import('@/components/ui/StoryReader'));

/**
 * RootRoute: Handles both boot sequence and model selection at root URL
 * Intelligently switches based on connection status and phase.
 * 
 * Smart behavior:
 * - If connection never checked: show BootSequence
 * - If connection online but no phase yet: show BootSequence
 * - If connection online and phase is SELECTING_SOURCE: show ModelSelector
 * - If redirected back due to no model, but connection is online: skip boot and show ModelSelector
 */
function RootRoute() {
  const { state } = useAppState();
  
  // If connection is ONLINE, skip boot sequence and show model selector
  // This handles the case where user was redirected back due to missing model
  if (state.connectionStatus === 'ONLINE') {
    if (state.isModelHydrated && state.selectedModel) {
      return <Navigate to="/dashboard" replace />;
    }
    return <ModelSelector />;
  }
  
  // Show boot sequence by default (checking connection or offline)
  return <BootSequence />;
}

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
  if (requires.includes('connectionOnline') && state.connectionStatus !== 'ONLINE') {
    return <Navigate to="/" replace />;
  }
  
  // Check model selection requirement
  if (requires.includes('modelSelected') && !state.selectedModel) {
    if (!state.isModelHydrated) {
      return null;
    }
    return <Navigate to="/" replace />;
  }
  
  // Check story existence requirement
  if (requires.includes('storyExists') && !state.currentStoryId) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // All prerequisites met, render component
  return <Component />;
}

/**
 * CatchAllRoute: Handles unknown routes intelligently
 * Shows 404 if user is authenticated, redirects to home if not
 */
function CatchAllRoute() {
  const { state } = useAppState();
  
  // If user has completed prerequisites, show 404
  // Otherwise redirect to home (they haven't started yet)
  const isAuthenticated = state.connectionStatus === 'ONLINE' && state.selectedModel;
  
  if (isAuthenticated) {
    return <NotFound />;
  }
  
  return <Navigate to="/" replace />;
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
          {/* Root: Boot sequence + Model selector (phase-based) */}
          <Route path="/" element={<RootRoute />} />
          
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
            path="/new" 
            element={
              <ProtectedRoute 
                component={StorySetup} 
                requires={['connectionOnline', 'modelSelected']} 
              />
            } 
          />
          
          {/* Story reader: Requires connection and model (story validated internally) */}
          <Route 
            path="/story/:slug" 
            element={
              <ProtectedRoute 
                component={StoryReader} 
                requires={['connectionOnline', 'modelSelected']} 
              />
            } 
          />
          
          {/* 404: Show NotFound for authenticated users, redirect others */}
          <Route path="*" element={<CatchAllRoute />} />
        </Routes>
      </Suspense>
    </div>
  );
}
