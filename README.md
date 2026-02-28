# StoryTeller

**AI-Powered Interactive Story Creation with Cinematic 3D Transitions**

StoryTeller is a web application that combines AI-driven narrative generation with immersive 3D visualizations, creating a unique storytelling experience.

---

## Features

### 🎬 Cinematic Experience
- **3D Earth Visualization**: Deep space camera animations using Three.js
- **Smooth Transitions**: GSAP-powered camera movements between app phases
- **Mystical Interface**: Blue/red color scheme with elegant typography

### 🤖 AI Integration
- **Ollama Model Selection**: Choose from available AI models (llama3:8b, mistral:7b)
- **Model Persistence**: Selected model is stored in localStorage and validated on startup
- **Story Generation**: AI-powered prologue creation based on your character, premise, and goals
- **Multiple Fandoms**: Create stories in various universes (Douluo Dalu, Naruto, One Piece, etc.)

### 📚 Story Management
- **Dashboard**: View and resume existing stories
- **Story Setup**: Intuitive form with validation and character counters
- **Reading Interface**: Full-screen immersive reading experience

### ⚡ Performance
- **Lazy Loading**: Code-splitting for optimal bundle size
- **Error Boundaries**: Graceful error handling
- **WebGL Fallback**: Continues working even without WebGL support

---

## Tech Stack

- **React 18+**: Modern component-based UI
- **Vite**: Lightning-fast build tool and dev server
- **Three.js**: WebGL 3D graphics
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Helper components for Three.js
- **GSAP**: Professional-grade animations
- **Tailwind CSS**: Utility-first styling

---

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Ollama installed and running locally (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd StoryTeller
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Building for Production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
StoryTeller/
├── public/
│   ├── earth-like/         # 3D Earth model (GLB)
│   └── logo.png            # App logo
├── src/
│   ├── animations/         # GSAP camera transitions
│   │   ├── spaceToEarth.js
│   │   ├── earthToSurface.js
│   │   ├── surfaceToEarth.js
│   │   ├── surfaceToStory.js
│   │   └── storyToEarth.js # Reverse animation from story
│   ├── canvas/             # Three.js scene components
│   │   ├── CanvasScene.jsx
│   │   ├── Scene.jsx
│   │   ├── EarthModel.jsx
│   │   └── Background.jsx
│   ├── components/
│   │   ├── common/         # Reusable components
│   │   │   ├── Button.jsx
│   │   │   ├── Dropdown.jsx
│   │   │   ├── TextArea.jsx
│   │   │   ├── StreamingText.jsx
│   │   │   └── ChoiceButton.jsx
│   │   ├── ui/             # Phase-specific screens
│   │   │   ├── BootSequence.jsx
│   │   │   ├── ModelSelector.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── StorySetup.jsx
│   │   │   ├── StoryReader.jsx
│   │   │   ├── StoryPassage.jsx
│   │   │   └── NotFound.jsx
│   │   ├── UIRouter.jsx    # React Router configuration
│   │   └── ErrorBoundary.jsx
│   ├── services/
│   │   ├── appState.jsx    # Global state management
│   │   ├── mockApi.js      # API functions (mocked)
│   │   ├── usePhaseTransition.js
│   │   └── useRouteSync.js # URL/state synchronization
│   ├── utils/
│   │   ├── validation.js   # Form validation
│   │   ├── animations.js   # Animation helpers
│   │   └── slugify.js      # URL slug generation
│   ├── styles/
│   │   └── index.css       # Global styles
│   ├── routes.jsx          # Route definitions
│   ├── App.jsx             # Root component
│   └── main.jsx            # Entry point
├── specs/                  # Specification documents
└── AGENTS.md              # AI agent context
```

---

## Application Flow

### Phase System

The app operates through 5 distinct phases:

1. **CHECKING_ENGINE**: Connection check with Ollama service
2. **SELECTING_SOURCE**: AI model selection
3. **DASHBOARD**: Story hub (view/resume/create)
4. **SETUP**: Story creation form
5. **PLAYING**: Full-screen story reading

Each phase transition triggers a cinematic 3D camera animation.

### State Management

Global state managed via React Context + useReducer:
- Phase transitions
- Model selection
- Story data
- User stories
- Error handling

### URL Routing

The app uses React Router for URL-based navigation, enabling bookmarking and sharing:

#### Routes

- **`/`** - Boot sequence and model selection
  - Checks Ollama connection
  - Shows model selector after successful connection
  - Redirects to `/dashboard` if a saved model is already hydrated
  
- **`/dashboard`** - Story management hub
  - View all existing stories
  - Resume reading or create new story
  - Requires: Connection online, model selected
  
- **`/new`** - Story creation form
  - Character, premise, and goals input
  - Form validation with mystical error messages
  - Requires: Connection online, model selected
  
- **`/story/:slug`** - Immersive reading interface
  - Story-specific URL (e.g., `/story/mystical-encounters`)
  - Interactive reading with streaming text and choices
  - Shareable and bookmarkable
  - Malformed slugs redirect to `/`
  - Requires: Connection online, model selected
  
- **`*`** - 404 Not Found
  - Mystical "Tale Lost to the Void" message
  - Shown for invalid routes (authenticated users only)
  - Unauthenticated users redirected to `/`

#### Story Slugs

Stories are identified by URL-safe slugs generated from titles:
- Lowercase, hyphenated (e.g., "Douluo Dalu" → `douluo-dalu-the-soul-forge`)
- Special characters removed
- Truncated to 60 characters
- Collision handling with numeric suffixes (e.g., `-2`, `-3`)
- Invalid slugs redirect to `/` (then to `/dashboard` if a saved model exists)

#### Navigation Features

- **Browser History**: Back/forward buttons trigger animations
- **Direct URL Access**: Paste any story URL to jump directly to it
- **Bookmarks**: Save and return to specific stories
- **Deep Linking**: Share `/story/:slug` URLs with others

#### Animation Transitions

URL changes trigger cinematic camera animations:
- Model selector → Dashboard: Space zoom to Earth orbit
- Dashboard → Story setup: Zoom to planet surface
- Story setup → Reading: Final zoom with Earth fade
- Backward navigation: Appropriate reverse animations

---

## Configuration

### Tailwind Theme

Custom colors defined in `tailwind.config.js`:
- **crimsonFlame** (#DC2626): Red accent
- **cosmicBlue** (#2563EB): Primary blue
- **starSilver** (#E2E8F0): Text color

### Environment Variables

No environment variables required for MVP. Future integration with real backend will use:
- `VITE_API_URL`: Backend API endpoint

---

## Development Guidelines

### Code Style

- **Modular**: Files under 500 lines
- **Documented**: JSDoc comments on all functions
- **Validated**: Mystical error messages for users
- **Styled**: Tailwind CSS only (no inline styles)

### Component Structure

```jsx
/**
 * ComponentName: Brief description
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
export default function ComponentName({ prop1, prop2 }) {
  // 1. Hooks
  const [state, setState] = useState();
  
  // 2. Event handlers
  const handleEvent = () => {};
  
  // 3. Render
  return <div>...</div>;
}
```

---

## Mock API

Current implementation uses mocked backend responses:

- `checkOllamaConnection()`: Simulates connection check (80% success rate)
- `getAvailableModels()`: Returns hardcoded model list
- `getUserStories()`: Returns sample story data with slugs
- `createStory(setup)`: Generates mock prologue with unique slug
- `getStoryById(id)`: Returns story details by ID
- `getStoryBySlug(slug)`: Returns story details by URL slug
- `getNextPassage(storyId, choiceId)`: Generates next story passage with choices

All API calls include realistic delays (800-1500ms).

---

## Browser Support

- **Modern browsers**: Chrome, Firefox, Safari, Edge
- **WebGL**: Required for 3D visualization (fallback provided)
- **Responsive**: Works on desktop and tablet (mobile optimization pending)

---

## Known Limitations

### MVP Scope
- **No real AI**: Backend integration pending (uses lorem ipsum)
- **No persistence**: Stories not saved between browser sessions
- **Limited fandoms**: Predefined list, cannot add custom fandoms

### Performance
- **3D model**: ~5MB GLB file (consider optimization)
- **Initial bundle**: ~200KB gzipped

---

## Future Enhancements

- Real Ollama/OpenAI backend integration
- Story persistence (localStorage or database)
- Choice-based narrative progression
- Multiple story passages
- Export stories to PDF/EPUB
- Mobile-responsive layout
- Additional fandom options
- Character artwork generation

---

## Troubleshooting

### Canvas not rendering
- Check browser WebGL support: Visit `https://get.webgl.org/`
- Verify Earth GLB model is in `public/earth-like/source/`

### Ollama connection fails
- Ensure Ollama is running locally
- Default endpoint: `http://localhost:11434`

### Slow performance
- Clear browser cache
- Reduce animation quality in dev tools
- Check GPU acceleration enabled

### Build errors
- Delete `node_modules/` and reinstall: `npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

---

## Contributing

This is an MVP project. Contributions welcome after initial release.

---

## License

[Specify license here]

---

## Credits

- **3D Earth Model**: [Specify source/license]
- **Fonts**: Inter, Segoe UI, Roboto
- **Icons**: Heroicons (SVG)

---

## Contact

[Specify contact information]

---

**Built with** ❤️ **using React, Three.js, and GSAP**
