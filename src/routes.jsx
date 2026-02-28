import { lazy } from 'react';

/**
 * Routes configuration for StoryTeller
 * 
 * Defines all application routes with their components and metadata.
 * Routes are organized by phase and include protection requirements.
 * 
 * Route Structure:
 * - / : Boot sequence (CHECKING_ENGINE phase)
 * - /select-model : Model selection (SELECTING_SOURCE phase)
 * - /dashboard : Story dashboard (DASHBOARD phase)
 * - /setup : Story creation form (SETUP phase)
 * - /story/:slug : Story reading interface (PLAYING phase)
 * 
 * @module routes
 */

// Lazy load components for code splitting
const BootSequence = lazy(() => import('./components/ui/BootSequence'));
const ModelSelector = lazy(() => import('./components/ui/ModelSelector'));
const Dashboard = lazy(() => import('./components/ui/Dashboard'));
const StorySetup = lazy(() => import('./components/ui/StorySetup'));
const StoryReader = lazy(() => import('./components/ui/StoryReader'));

/**
 * Route configuration array
 * 
 * Each route object contains:
 * - path: URL pattern (using React Router syntax)
 * - component: Lazy-loaded component to render
 * - phase: Associated app phase (for state sync)
 * - protected: Whether route requires prerequisite checks
 * - requires: Array of prerequisite conditions
 */
export const routes = [
  {
    path: '/',
    component: BootSequence,
    phase: 'CHECKING_ENGINE',
    protected: false,
    requires: [],
  },
  {
    path: '/select-model',
    component: ModelSelector,
    phase: 'SELECTING_SOURCE',
    protected: true,
    requires: ['connectionOnline'], // Requires successful connection check
  },
  {
    path: '/dashboard',
    component: Dashboard,
    phase: 'DASHBOARD',
    protected: true,
    requires: ['connectionOnline', 'modelSelected'], // Requires connection + model
  },
  {
    path: '/setup',
    component: StorySetup,
    phase: 'SETUP',
    protected: true,
    requires: ['connectionOnline', 'modelSelected'], // Requires connection + model
  },
  {
    path: '/story/:slug',
    component: StoryReader,
    phase: 'PLAYING',
    protected: true,
    requires: ['connectionOnline', 'modelSelected', 'storyExists'], // Requires story to exist
  },
];

/**
 * Get route configuration by path pattern
 * 
 * @param {string} path - Path pattern to search for
 * @returns {Object|undefined} Route configuration or undefined if not found
 */
export function getRouteByPath(path) {
  return routes.find(route => route.path === path);
}

/**
 * Get route configuration by phase
 * 
 * @param {string} phase - App phase name
 * @returns {Object|undefined} Route configuration or undefined if not found
 */
export function getRouteByPhase(phase) {
  return routes.find(route => route.phase === phase);
}

/**
 * Check if a route requires protection
 * 
 * @param {string} path - Route path to check
 * @returns {boolean} True if route is protected
 */
export function isProtectedRoute(path) {
  const route = getRouteByPath(path);
  return route ? route.protected : false;
}
