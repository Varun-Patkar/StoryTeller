# StoryTeller

**AI-Powered Interactive Story Creation with Cinematic 3D Transitions**

StoryTeller is a fullstack web application that combines AI-driven narrative generation with immersive 3D visualizations, MongoDB persistence, and optional GitHub authentication.

🚀 **Live Demo**: [https://story-teller-chi.vercel.app/](https://story-teller-chi.vercel.app/)

---

## Screenshots

<div align="center">

### 🌐 Connection Setup
<img src="images/NotConnected.png" alt="Dev Tunnel Configuration Screen" width="700"/>
<p><i>Configure Ollama connection with dev tunnels, hosted VMs, or localhost</i></p>

### 🎯 Model Selection
<img src="images/ChooseModel.png" alt="AI Model Selection Screen" width="700"/>
<p><i>Choose your AI model from installed Ollama models</i></p>

### 📖 Dashboard - Guest View
<img src="images/NotSignedIn.png" alt="Dashboard without authentication" width="700"/>
<p><i>Explore public stories without signing in</i></p>

### 🔐 Dashboard - Signed In
<img src="images/SignedIn.png" alt="Dashboard with authentication" width="700"/>
<p><i>Access your personal stories and explore public content</i></p>

### ✍️ Story Creation
<img src="images/Createnew.png" alt="Story Setup Form" width="700"/>
<p><i>Create new stories with character, premise, goals, and fandom selection</i></p>

### 📚 Story Reading
<img src="images/Story.png" alt="Interactive Story Reader" width="700"/>
<p><i>Immersive reading interface with AI-generated narrative and choices</i></p>

### ℹ️ About Page
<img src="images/About.png" alt="About StoryTeller" width="700"/>
<p><i>Learn about the project, technology stack, and developer</i></p>

</div>

---

## Features

### 🎬 Cinematic Experience
- **3D Earth Visualization**: Deep space camera animations using Three.js
- **Smooth Transitions**: GSAP-powered camera movements between app phases
- **Mystical Interface**: Purple/blue color scheme with elegant typography
- **Responsive Design**: Works on desktop and tablet

### 🤖 AI Integration (BYOE - Bring Your Own Engine)
- **Direct Ollama Connection**: React frontend connects directly to Ollama API
- **Flexible Connectivity**:
  - Default: `http://localhost:11434` for local development
  - Custom URLs: Support for devtunnels, hosted VMs, or any Ollama-compatible API
  - CORS Guidance: Automatic detection with fix commands displayed
- **Model Selection**: Choose any installed Ollama model
- **Model Persistence**: Selected model stored in localStorage
- **Streaming Generation**: Real-time AI text generation with streaming UI
- **Fandom Support**: Create stories in various universes (Douluo Dalu, Naruto, One Piece, etc.)
- **Context-Aware**: AI uses fandom tone definitions for consistent narrative voice

### 📚 Story Management
- **Story Dashboard**:
  - **Explore Tab**: Browse all public stories (no login required)
  - **Your Stories Tab**: View your personal stories (requires GitHub login)
- **Story Creation**:
  - Book Name and title customization
  - Visibility controls (Public/Private)
  - Character, premise, and goals input
  - Fandom selection with tone guidance
  - AI-generated prologue with streaming text
- **Story Forking**: Respond to public stories to create your own fork
- **Reading Interface**: Full-screen immersive reading with interactive choices
- **Smart Slugs**: URL-friendly story slugs for sharing (e.g., `/story/douluo-dalu-awakening`)

### 🔐 Authentication (Optional)
- **GitHub OAuth**: Sign in with GitHub to access personal features
- **Session Management**: Secure JWT-based sessions with HTTP-only cookies
- **Guest Mode**: Explore public stories without signing in
- **Privacy Controls**: Create private stories visible only to you

### ⚡ Performance
- **Lazy Loading**: Code-splitting for optimal bundle size
- **Error Boundaries**: Graceful error handling
- **WebGL Fallback**: Continues working even without WebGL support

---

## Tech Stack

### Frontend
- **React 18+**: Modern component-based UI with hooks
- **Vite**: Lightning-fast build tool and dev server
- **Three.js**: WebGL 3D graphics engine
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Helper components for Three.js
- **GSAP**: Professional-grade animation library
- **Tailwind CSS**: Utility-first styling
- **React Router**: Client-side routing with shareable URLs

### Backend
- **Express.js**: Single serverless function on Vercel
- **MongoDB Atlas**: Document database for users and stories
- **GitHub OAuth**: Optional user authentication
- **JWT**: Session token management

### AI/LLM
- **Ollama**: Direct API connection from frontend (BYOE)
- **Flexible Hosting**: localhost, devtunnels, hosted VMs, or Ollama-compatible APIs
- **Streaming**: Real-time text generation with SSE

---

## Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **Ollama** installed and running (for AI features)
  - Download from [ollama.ai](https://ollama.ai)
  - Pull a model: `ollama pull llama3.1:8b`
- **MongoDB** (for backend persistence)
  - Local MongoDB, or
  - MongoDB Atlas (free tier available)
- **GitHub OAuth App** (optional, for authentication)
  - Create at: https://github.com/settings/developers
  - Set callback URL: `http://localhost:5173/auth/callback`

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

3. **Configure environment variables**
   
   Create `.env` in the project root:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/storyteller
   # Or use MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/storyteller
   
   GITHUB_CLIENT_ID=your_github_oauth_client_id
   GITHUB_CLIENT_SECRET=your_github_oauth_secret
   JWT_SECRET=your_random_secret_key_here
   BASE_URL=http://localhost:5173
   ```

4. **Start Ollama with CORS enabled**
   
   PowerShell:
   ```powershell
   $env:OLLAMA_ORIGINS="http://localhost:5173"; ollama serve
   ```
   
   Unix/Mac:
   ```bash
   OLLAMA_ORIGINS="http://localhost:5173" ollama serve
   ```

5. **Start development servers**
   
   Frontend:
   ```bash
   npm run dev
   ```
   Backend:
   ```bash
   npm run dev:api
   ```

6. **Open in browser**
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
├── api/                    # Vercel serverless Python functions
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

No environment variables required for the frontend MVP. Backend secrets (MongoDB URI, OAuth client/secret) MUST live in backend environment variables only.

Future integration with real backend may use:
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

## API Architecture

### Ollama API (Direct Frontend Connection)

The frontend connects directly to Ollama using `src/services/ollamaClient.js`:

- `checkOllamaConnection()`: Ping Ollama server and detect CORS issues
- `getAvailableModels()`: Fetch installed models from `/api/tags`
- `generatePrologue()`: Stream story prologue from `/api/generate`
- `generatePassage()`: Stream story continuation with choices

**Custom URL Configuration**:
- Configure via UI after boot sequence
- Supports devtunnels, hosted VMs, or any Ollama-compatible API
- URL persisted in localStorage

### Backend API (Express.js)

The backend at `/api/server.js` provides:

**Authentication**:
- GitHub OAuth flow
- Session management with JWT cookies
- User profile retrieval

**Story Persistence**:
- Create/update/delete stories
- Fetch user stories and public stories
- Story forking for collaborative narratives
- Slug-based story lookup

See `specs/001-fullstack-integration/contracts/` for detailed API contracts.

---

## Browser Support

- **Modern browsers**: Chrome, Firefox, Safari, Edge
- **WebGL**: Required for 3D visualization (fallback provided)
- **Responsive**: Works on desktop and tablet (mobile optimization pending)

---

## Known Limitations

### Current Scope
- **BYOE Required**: Users must provide their own Ollama instance
- **Fandom Definitions**: Predefined list (extensible via `.toon` files)
- **Single Passage View**: Full passage history viewing not yet implemented

### Performance
- **3D Model**: ~5.5MB GLB file
- **Initial Bundle**: ~200KB gzipped JS

---

## Future Enhancements

- **Multi-Model Support**: OpenAI, Anthropic, other providers
- **Story History View**: Browse all passages in a story
- **Export**: PDF/EPUB generation
- **Mobile PWA**: Native app experience
- **Custom Fandoms**: User-created `.toon` files
- **Character Art**: AI-generated character portraits
- **Collaborative Editing**: Real-time co-authoring
- **Story Analytics**: Word count, reading time, popularity metrics

---

## Troubleshooting

### Canvas not rendering
- Check browser WebGL support: Visit `https://get.webgl.org/`
- Verify Earth GLB model is in `public/earth-like/source/`

### Ollama connection fails
- **Check Ollama is running**: `ollama list` in terminal
- **Enable CORS**: Run Ollama with `OLLAMA_ORIGINS` env var (see Installation)
- **Custom URL**: Use OllamaUrlConfig to set devtunnel or VM URL
- **Network**: Ensure firewall allows port 11434

### "Origin not allowed" error
- Restart Ollama with CORS origins configured
- Check that the origin matches your browser URL exactly

### Stories not saving
- Check MongoDB connection in backend logs
- Verify `MONGODB_URI` environment variable is set

### GitHub login fails
- Verify GitHub OAuth app callback URL matches deployment URL
- Check `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set

### Slow performance
- Clear browser cache
- Reduce animation quality in dev tools
- Check GPU acceleration enabled

### Build errors
- Delete `node_modules/` and reinstall: `npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

---

## Contributing

StoryTeller is now released and open for contributions! 🎉

We welcome contributions of all kinds:
- 🐛 Bug fixes and issue reports
- ✨ New features and enhancements
- 📚 Documentation improvements
- 🎨 UI/UX enhancements
- 🌍 New fandom definitions (`.toon` files)
- 🧪 Tests and quality improvements

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the code style guidelines
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please ensure your code:
- Follows the modular file structure (max 500 lines per file)
- Includes JSDoc comments for all functions/components
- Uses Tailwind CSS only (no inline styles or CSS files)
- Maintains the mystical theme and user experience

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Credits

- **3D Earth Model**: Custom GLB model
- **Fonts**: Inter, Segoe UI, Roboto
- **Icons**: Heroicons (SVG)
- **AI Engine**: [Ollama](https://ollama.ai)
- **Deployment**: [Vercel](https://vercel.com)

---

## Contact

### 👨‍💻 Developer: Varun Patkar

Full-Stack Developer & AI Enthusiast passionate about combining immersive 3D experiences with AI to create unique interactive storytelling platforms.

**Connect with me:**

- 🌐 **Portfolio**: [varunpatkar.vercel.app](https://varunpatkar.vercel.app/)
- 💼 **LinkedIn**: [linkedin.com/in/varun-patkar](https://www.linkedin.com/in/varun-patkar/)
- 🐙 **GitHub**: [github.com/Varun-Patkar](https://github.com/Varun-Patkar/)
- 🐦 **X/Twitter**: [@Varun_Patkar](https://x.com/Varun_Patkar)

Feel free to reach out for questions, suggestions, or collaboration opportunities!

---

**Built with** ❤️ **using React, Three.js, and GSAP**
