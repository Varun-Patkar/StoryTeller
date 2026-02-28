# Contract: URL Routing & Navigation

**Phase 1 Output** | **Created**: 2026-02-28  
**Purpose**: Define URL structure, routing configuration, and navigation patterns for Story Teller

**Implementation Note**: This document was created during planning phase. The actual implementation simplified the URL structure: Boot sequence and model selection both use `/` (phase-based rendering), and story setup uses `/new` instead of `/setup`. The core routing tables have been updated to reflect this, but some code examples may reference the original design. See [actual implementation](../../../src/routes.jsx) for authoritative source.

---

## Overview

StoryTeller uses URL-based routing to provide standard web navigation behaviors: bookmarking, sharing, browser history, and direct access to specific stories. This contract defines the route structure, slug generation rules, and how the routing system integrates with the existing phase state machine.

---

## Route Structure

### Application Routes

| Route | Phase | Component | Description | Prerequisites |
|-------|-------|-----------|-------------|---------------|
| `/` | CHECKING_ENGINE / SELECTING_SOURCE | BootSequence / ModelSelector | Boot sequence + model selection (phase-based rendering) | None |
| `/dashboard` | DASHBOARD | Dashboard | Story hub (resume/create) | Connection online, model selected |
| `/new` | SETUP | StorySetup | Story creation form | Connection online, model selected |
| `/story/:slug` | PLAYING | StoryReader | Interactive reading interface | Connection online, model selected |
| `*` | - | NotFound (or redirect) | 404 error page for authenticated users | - |

**Note**: `/` handles both boot and model selection at the same URL. Component rendering switches based on phase state.

### Route Parameters

- **`:slug`**: URL-friendly story identifier (e.g., `douluo-dalu-soul-forge`)
  - Lowercase letters, numbers, hyphens only
  - Max 60 characters
  - Must match an existing story's slug field

---

## Slug Generation

### Algorithm

```javascript
/**
 * Converts a story title into a URL-friendly slug
 * 
 * Rules:
 * - Lowercase all characters
 * - Replace spaces with hyphens
 * - Remove all special characters (keep only a-z, 0-9, -)
 * - Remove consecutive hyphens (e.g., -- becomes -)
 * - Trim hyphens from start/end
 * - Truncate to 60 characters max
 * - Ensure uniqueness by appending -2, -3, etc. if collision
 * 
 * @param {string} title - Story title
 * @param {string[]} existingSlugs - Array of already-used slugs
 * @returns {string} URL-safe slug
 */
export function generateSlug(title, existingSlugs = []) {
  // Basic transformation
  let slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')          // Spaces to hyphens
    .replace(/-+/g, '-')           // Consecutive hyphens to single
    .replace(/^-|-$/g, '');        // Trim hyphens from edges
  
  // Truncate to 60 chars
  slug = slug.substring(0, 60).replace(/-$/, ''); // Remove trailing hyphen after truncate
  
  // Handle collisions
  let finalSlug = slug;
  let counter = 2;
  while (existingSlugs.includes(finalSlug)) {
    const suffix = `-${counter}`;
    const maxLength = 60 - suffix.length;
    finalSlug = slug.substring(0, maxLength) + suffix;
    counter++;
  }
  
  return finalSlug;
}
```

### Example Transformations

| Title | Slug |
|-------|------|
| "Douluo Dalu - The Soul Forge" | `douluo-dalu-soul-forge` |
| "My Epic Adventure!" | `my-epic-adventure` |
| "A Story with Lots of Special Characters @#$" | `a-story-with-lots-of-special-characters` |
| "Very Long Title That Exceeds Sixty Characters And Needs Truncation" | `very-long-title-that-exceeds-sixty-characters-and-need` |
| "Duplicate Title" (1st) | `duplicate-title` |
| "Duplicate Title" (2nd) | `duplicate-title-2` |
| "Duplicate Title" (3rd) | `duplicate-title-3` |

---

## Route Guards & Prerequisites

### Protected Routes

Routes that require certain conditions to be met before access:

```javascript
const routeGuards = {
  '/dashboard': {
    check: () => connectionStatus === 'ONLINE' && selectedModel !== null,
    redirect: '/',
    message: 'Connection and model selection required'
  },
  '/new': {
    check: () => connectionStatus === 'ONLINE' && selectedModel !== null,
    redirect: '/',
    message: 'Connection and model selection required'
  },
  '/story/:slug': {
    check: () => connectionStatus === 'ONLINE' && selectedModel !== null,
    redirect: '/',
    message: 'Connection and model selection required. Story existence validated internally.'
  }
};
```

**Note**: Story existence for `/story/:slug` is validated internally by `StoryReader` component, not by route protection. This allows the component to show appropriate error messages.

### ProtectedRoute Component

```jsx
/**
 * ProtectedRoute: Wraps routes that require prerequisites
 * 
 * Checks prerequisites before rendering child component.
 * Redirects to specified route if prerequisites not met.
 * Shows loading state during async checks.
 */
function ProtectedRoute({ 
  children, 
  requiresModel = false,
  requiresConnection = false,
  checkStoryExists = false,
  redirectTo = '/'
}) {
  const { state } = useAppState();
  const { slug } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check connection
    if (requiresConnection && state.connectionStatus !== 'ONLINE') {
      navigate(redirectTo);
      return;
    }
    
    // Check model selection
    if (requiresModel && !state.selectedModel) {
      navigate(redirectTo);
      return;
    }
    
    // Check story exists
    if (checkStoryExists && slug) {
      getStoryBySlug(slug).catch(() => {
        navigate('/dashboard');
      });
    }
  }, [state, slug]);
  
  return children;
}
```

---

## Navigation Patterns

### Programmatic Navigation

```javascript
import { useNavigate } from 'react-router-dom';

// In component
const navigate = useNavigate();

// Navigate to route
navigate('/dashboard');

// Navigate to story by slug
navigate(`/story/${story.slug}`);

// Navigate back
navigate(-1);

// Navigate forward
navigate(1);

// Replace current route (no history entry)
navigate('/dashboard', { replace: true });
```

### Navigation with Animation Integration

Phase transitions should trigger animations BEFORE route changes:

```javascript
async function handleCreateNew() {
  // 1. Start animation
  setIsTransitioning(true);
  await playAnimation(earthToSurface);
  
  // 2. After animation completes, navigate
  navigate('/setup');
  setIsTransitioning(false);
}

async function handleStorySubmit(storyData) {
  // 1. Create story
  const story = await createStory(storyData);
  
  // 2. Start animation
  setIsTransitioning(true);
  await playAnimation(surfaceToStory);
  
  // 3. Navigate to new story
  navigate(`/story/${story.slug}`);
  setIsTransitioning(false);
}
```

### Browser Back Button Handling

```javascript
/**
 * Listen to browser navigation events and trigger animations
 */
function useRouteTransitions() {
  const location = useLocation();
  const [previousRoute, setPreviousRoute] = useState('/');
  
  useEffect(() => {
    // Detect back/forward navigation
    const isBackNavigation = detectBackNavigation(location, previousRoute);
    
    if (isBackNavigation) {
      // Trigger reverse animation
      playReverseAnimation();
    }
    
    setPreviousRoute(location.pathname);
  }, [location]);
}

function detectBackNavigation(currentLocation, previousPath) {
  const routeOrder = ['/', '/dashboard', '/new', '/story/:slug'];
  const currentIndex = routeOrder.findIndex(r => matchRoute(currentLocation.pathname, r));
  const previousIndex = routeOrder.findIndex(r => matchRoute(previousPath, r));
  
  return currentIndex < previousIndex; // Moving backwards in flow
}
```

---

## State Machine + URL Sync

### Dual State Management

The app maintains TWO sources of truth:
1. **URL (React Router)**: Canonical source for current location
2. **Phase State (Context)**: Application logic and prerequisites

These must stay in sync:

```javascript
/**
 * Sync URL changes to phase state
 */
function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const location = useLocation();
  
  useEffect(() => {
    // URL changed → update phase state
    const phase = routeToPhase(location.pathname);
    if (phase !== state.phase) {
      dispatch({ type: 'SYNC_PHASE_TO_URL', payload: { phase } });
    }
  }, [location]);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

function routeToPhase(pathname) {
  const routes = {
    '/': 'CHECKING_ENGINE', // Also handles SELECTING_SOURCE at same URL
    '/dashboard': 'DASHBOARD',
    '/new': 'SETUP',
  };
  
  if (pathname.startsWith('/story/')) {
    return 'PLAYING';
  }
  
  return routes[pathname] || 'CHECKING_ENGINE';
}
```

---

## Direct URL Access

### Cold Start Behavior

When user types URL directly or refreshes page:

1. **Root `/`**: Always accessible, starts boot sequence
2. **`/model-select`**: Redirect to `/` if connection not checked
3. **`/dashboard`**: 
   - Check if model selected in localStorage/session
   - If yes: Load dashboard
   - If no: Redirect to `/` to go through flow
4. **`/setup`**: Same as dashboard (requires model)
5. **`/story/:slug`**:
   - Fetch story by slug
   - If exists: Load directly
   - If not: Redirect to `/dashboard` with error toast
   - Prerequisites (model selection) bypassed for direct story access

### Session Persistence

To support direct URL access, persist key state in localStorage:

```javascript
// On model selection
localStorage.setItem('selectedModel', JSON.stringify(model));

// On page load
const savedModel = localStorage.getItem('selectedModel');
if (savedModel && location.pathname !== '/') {
  // Allow direct access to protected routes
  dispatch({ type: 'RESTORE_MODEL', payload: JSON.parse(savedModel) });
}
```

---

## Route Configuration

### React Router Setup

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <AppStateProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<BootSequence />} />
          
          {/* Protected routes */}
          <Route 
            path="/model-select" 
            element={
              <ProtectedRoute requiresConnection>
                <ModelSelector />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requiresModel>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/setup" 
            element={
              <ProtectedRoute requiresModel>
                <StorySetup />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/story/:slug" 
            element={
              <ProtectedRoute checkStoryExists>
                <StoryReader />
              </ProtectedRoute>
            } 
          />
          
          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppStateProvider>
    </BrowserRouter>
  );
}
```

---

## URL Query Parameters (Future)

Reserved for future features:

- `/story/:slug?passage=5` - Deep link to specific passage
- `/dashboard?sort=recent` - Sort stories
- `/setup?template=quick` - Pre-fill form templates
- `/story/:slug?share=true` - Share mode with limited controls

---

## SEO & Meta Tags

### Dynamic Document Title

```javascript
function useDocumentTitle() {
  const location = useLocation();
  const { state } = useAppState();
  
  useEffect(() => {
    const titles = {
      '/': 'StoryTeller - AI-Powered Interactive Stories',
      '/model-select': 'Select AI Model - StoryTeller',
      '/dashboard': 'Your Stories - StoryTeller',
      '/setup': 'Create New Story - StoryTeller',
    };
    
    if (location.pathname.startsWith('/story/') && state.currentStory) {
      document.title = `${state.currentStory.title} - StoryTeller`;
    } else {
      document.title = titles[location.pathname] || 'StoryTeller';
    }
  }, [location, state]);
}
```

### Meta Tags for Story Sharing

```jsx
<Helmet>
  <title>{story.title} - StoryTeller</title>
  <meta name="description" content={story.setup.premise.substring(0, 160)} />
  <meta property="og:title" content={story.title} />
  <meta property="og:description" content={story.setup.premise} />
  <meta property="og:url" content={`https://storyteller.app/story/${story.slug}`} />
</Helmet>
```

---

## Error Handling

### 404 Not Found

```jsx
function NotFound() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => navigate('/dashboard'), 3000);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-blue-950 to-black">
      <div className="text-center max-w-md px-6">
        <h1 className="text-4xl font-bold text-red-400 mb-4">
          Lost in the Void
        </h1>
        <p className="text-blue-200 mb-8">
          This tale has been scattered to the winds. Returning you to the archives...
        </p>
        <Button onClick={() => navigate('/dashboard')}>
          Return to Stories
        </Button>
      </div>
    </div>
  );
}
```

### Invalid Story Slug

```javascript
function StoryReader() {
  const { slug } = useParams();
  const [story, setStory] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    getStoryBySlug(slug)
      .then(setStory)
      .catch(() => {
        setNotFound(true);
        setTimeout(() => navigate('/dashboard'), 3000);
      });
  }, [slug]);
  
  if (notFound) {
    return <StoryNotFound storySlug={slug} />;
  }
  
  // ... render story
}
```

---

## Testing Scenarios

### URL Navigation Tests

1. **Happy path**: Navigate / → /model-select → /dashboard → /setup → /story/:slug
2. **Direct access**: Type `/dashboard` in URL bar, verify redirect or load
3. **Browser back**: Click back button from /setup, verify reverse animation to /dashboard
4. **Browser forward**: Click forward after back, verify animation
5. **Refresh page**: On `/story/:slug`, refresh, verify story reloads
6. **Invalid slug**: Navigate to `/story/fake-slug-123`, verify 404 and redirect
7. **Copy URL**: Copy `/story/:slug` URL, paste in new tab, verify story loads
8. **Bookmark**: Bookmark /dashboard, close browser, reopen bookmark

### Slug Generation Tests

1. **Basic**: "My Story" → `my-story`
2. **Special chars**: "Story #1!" → `story-1`
3. **Spaces**: "Multiple   Spaces" → `multiple-spaces`
4. **Long title**: 80 char title → 60 char slug
5. **Collision**: Two "Same Title" → `same-title`, `same-title-2`
6. **Emoji**: "Story 🎮" → `story` (remove emoji)
7. **Hyphenated**: "Pre-existing-hyphens" → `pre-existing-hyphens`

---

## Future Enhancements

- **Nested routes**: `/story/:slug/edit`, `/story/:slug/share`
- **Query params**: Passage deep links, search filters
- **Hash fragments**: Scroll to specific passage via `#passage-5`
- **Route transitions**: Custom animations per route change
- **Breadcrumbs**: Show navigation path in UI
- **Route analytics**: Track which routes are most visited

---

**Next**: Implement React Router and migrate state machine to URL-based navigation
