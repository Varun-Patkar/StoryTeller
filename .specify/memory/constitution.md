<!--
SYNC IMPACT REPORT
==================
Version: 0.0.0 → 1.0.0 (MINOR - Initial constitution establishment)
Ratification Date: 2026-02-28
Last Amended: 2026-02-28

Modified Principles: Initial creation of 6 core principles
- I. Extreme Modularity (NON-NEGOTIABLE)
- II. Comprehensive Documentation
- III. Markdown File Restrictions (NON-NEGOTIABLE)
- IV. Safe Dependency Management
- V. Explicit User Consent (NON-NEGOTIABLE)
- VI. UI/UX Excellence

Added Sections:
- Technology Stack & Constraints
- Performance Standards
- Development Workflow

Templates Requiring Updates:
✅ .specify/templates/plan-template.md - Constitution Check section compatible
✅ .specify/templates/spec-template.md - Requirements alignment verified
✅ .specify/templates/tasks-template.md - Task categorization compatible
✅ .specify/templates/commands/*.md - No agent-specific references found

Follow-up TODOs: None - all placeholders resolved
-->

# StoryTeller Constitution

## Core Principles

### I. Extreme Modularity (NON-NEGOTIABLE)

**Every file MUST contain 500 lines or fewer of meaningful code (excluding imports and standard boilerplate).**

- **3D Canvas Logic**: All Three.js scene setup, geometry, materials, lighting, and rendering logic MUST be isolated in dedicated files under `src/canvas/` or equivalent
- **UI Overlay Components**: React components for UI overlays (HUD, menus, controls) MUST be separated from 3D logic and placed in `src/components/ui/`
- **Animation Logic**: GSAP timelines, camera animations, and transition sequences MUST be extracted into `src/animations/` with descriptive filenames
- **Service/Utility Separation**: API calls, state management, and utility functions MUST reside in `src/services/` and `src/utils/` respectively
- **Single Responsibility**: Each file addresses ONE concern—if a component grows complex, extract sub-components or hooks immediately

**Rationale**: 3D web applications naturally accumulate complexity. Strict file size limits and separation of concerns ensure maintainability, enable parallel development, and make debugging tractable when dealing with rendering pipelines, animation sequences, and interactive UI layers.

### II. Comprehensive Documentation

**Every function, component, React hook, and complex animation block MUST have detailed inline comments.**

- **Functions**: Docstring or block comment explaining purpose, parameters, return values, and side effects
- **React Components**: JSDoc comment describing props, state, lifecycle behavior, and integration points
- **GSAP Animations**: Inline comments above each timeline or tween explaining the visual effect, duration rationale, and dependencies
- **Complex Logic**: If a block contains non-obvious calculations (e.g., quaternion math, raycasting, viewport transformations), add explanatory comments immediately above
- **ThreeJS Setup**: Document camera parameters, light configurations, post-processing passes, and why specific values were chosen

**Rationale**: 3D graphics and animation code is inherently abstract. Clear documentation enables team members (and future you) to understand spatial relationships, animation intent, and rendering optimizations without reverse-engineering shader code or transformation matrices.

### III. Markdown File Restrictions (NON-NEGOTIABLE)

**The project MUST contain EXACTLY two user-facing markdown files:**

- **README.md**: Human-facing project overview, setup instructions, feature highlights, deployment guide
- **AGENTS.md**: AI agent context file containing architecture overview, coding conventions, and agent-specific guidance

**All other documentation MUST exist as inline comments within source code or within the `.specify/` directory for specification artifacts.**

**Rationale**: Prevents documentation fragmentation and maintenance overhead. Inline documentation stays synchronized with code changes. Specification artifacts in `.specify/` follow a structured workflow and are not user-facing documentation.

### IV. Safe Dependency Management

**Dependency installation MUST follow terminal-based workflows; package.json MUST NOT be manually edited with hallucinated version numbers.**

- When adding a new npm package, provide the user with: `npm i <package-name>` (installs latest stable)
- When adding a dev dependency: `npm i -D <package-name>`
- When a specific version is required (rare), user MUST explicitly request it: `npm i <package-name>@<version>`
- AI agents MUST NOT invent or assume version numbers—always defer to npm registry
- Use `npm ls <package>` to verify installed versions before troubleshooting compatibility issues

**Rationale**: Prevents version conflicts, broken builds, and phantom dependency issues. The npm ecosystem evolves rapidly; letting the registry resolve versions ensures compatibility with the current Node.js environment and other installed packages.

### V. Explicit User Consent (NON-NEGOTIABLE)

**Before creating or replacing files exceeding 50 lines, AI agents MUST explain the intended changes and request explicit user approval.**

- **Explanation MUST include**: What will be created/modified, why it's necessary, which principles guide the structure, and estimated complexity
- **User MUST respond with**: Explicit go-ahead, modification request, or cancellation
- Incremental changes (e.g., adding a single component or function) MAY proceed without explicit prompt IF under the complexity threshold
- Refactoring existing large files MUST be explained BEFORE execution, highlighting what will be moved and why

**Rationale**: Prevents unintended code overwrites, ensures user understanding of structural changes, and maintains alignment with project goals. 3D applications involve interconnected rendering, animation, and UI state—unexpected changes can cascade into subtle breakages.

### VI. UI/UX Excellence

**The user experience MUST feel thematic, clean, and cinematic.**

- **Styling**: All UI overlays MUST use Tailwind CSS utility classes for consistency and rapid iteration
- **Design Language**: Establish a cohesive theme (colors, typography, spacing) documented in `src/styles/theme.js` or Tailwind config
- **Responsiveness**: UI layouts MUST adapt gracefully to viewport changes (mobile, tablet, desktop)
- **Accessibility**: Interactive elements MUST have proper focus states, ARIA labels where applicable, and keyboard navigation support
- **Performance**: UI renders MUST NOT block the 3D rendering loop—use React.memo, useMemo, and lazy loading where appropriate
- **Cinematics**: Camera transitions and scene changes SHOULD feel intentional—avoid jarring cuts; favor smooth GSAP easing

**Rationale**: 3D web applications compete with desktop and game experiences. A polished, accessible, and performant UI separates professional tools from technical demos. Tailwind ensures consistency without bloating stylesheets.

## Technology Stack & Constraints

**Mandatory Technologies:**

- **Frontend Framework**: React (with hooks) for UI components
- **3D Rendering**: Three.js for WebGL scene management
- **Animation Library**: GSAP (GreenSock Animation Platform) for camera, UI, and object animations
- **Styling**: Tailwind CSS for all UI overlay styling
- **Build Tool**: Vite or equivalent ES module bundler with fast HMR
- **Language**: JavaScript or TypeScript (prefer TypeScript for type safety in complex 3D transforms)

**Performance Constraints:**

- **Frame Rate**: Target 60 FPS on mid-tier hardware; 30 FPS minimum on low-end devices
- **Initial Load**: First Contentful Paint (FCP) under 2 seconds on 3G connection
- **Asset Optimization**: 3D models MUST be compressed (Draco or meshopt); textures MUST use appropriate formats (WebP, KTX2)
- **Code Splitting**: Use dynamic imports for heavy dependencies (e.g., post-processing shaders, physics engines)

**Prohibited Practices:**

- Inline styles in JSX (use Tailwind classes)
- Direct DOM manipulation from 3D rendering code (use React state/refs)
- Synchronous asset loading in render loop (preload assets, show loading states)
- Global CSS files (Tailwind + CSS modules for rare exceptions only)

## Performance Standards

**Rendering Performance:**

- **CPU Budget**: Main thread operations (animation ticks, raycasting) MUST complete within 16ms (60 FPS budget)
- **GPU Budget**: Draw calls per frame SHOULD NOT exceed 200; prefer instanced meshes and geometry merging
- **Memory**: Texture memory MUST stay below 512MB on mobile; dispose of unused geometries, materials, and textures promptly

**Asset Loading:**

- Implement progressive loading: low-poly models → high-poly models → textures
- Use loading screens or progress indicators during initial asset fetch
- Lazy load non-critical 3D elements (background scenery, optional effects)

**Monitoring:**

- Use `Stats.js` or browser DevTools Performance tab during development
- Log render times and memory usage in development builds
- Establish performance budgets in CI (e.g., bundle size limits, Lighthouse scores)

## Development Workflow

**Pre-Implementation:**

1. **User Request**: Clearly document what needs to be built in `.specify/specs/[feature]/spec.md`
2. **Constitution Check**: Verify new feature aligns with all 6 core principles before design phase
3. **Design Phase**: Create plan, research, data-model, and contracts in `.specify/specs/[feature]/` per plan-template.md

**Implementation:**

1. **File Organization**: Follow plan.md structure; create directories BEFORE writing code
2. **Incremental Commits**: Commit after each logical unit (e.g., "Add lighting setup for main scene")
3. **Inline Documentation**: Write docstrings and comments AS you write code, not after
4. **Modularity Enforcement**: If a file approaches 400 lines, refactor BEFORE adding more features

**Code Review Gates:**

- **Line Count**: No file exceeds 500 meaningful lines
- **Documentation**: Every exported function/component has inline documentation
- **Dependencies**: All package.json changes made via terminal commands (verify with git diff)
- **UI Consistency**: All new UI components use Tailwind and match design theme
- **Performance**: No new console errors; framerate remains above target on test devices

**Refactoring Protocol:**

- When refactoring existing code, explain changes to user BEFORE executing
- Break large refactors into small, testable increments
- Update inline documentation to reflect new structure
- Verify no orphaned imports or unused variables remain after changes

## Governance

**Constitution Authority:**

- This constitution supersedes all other coding practices, style guides, and ad-hoc decisions
- When conflicting guidance arises, principles in this constitution take precedence
- Exceptions MUST be justified in writing and approved by project owner

**Amendment Process:**

- Proposed amendments MUST include: rationale, affected principles, migration plan for existing code
- Version increments follow semantic versioning:
  - **MAJOR**: Backward-incompatible governance changes (e.g., removing a NON-NEGOTIABLE principle)
  - **MINOR**: New principle added or material expansion of existing principle
  - **PATCH**: Clarifications, wording improvements, typo fixes
- Amendments update the **Last Amended** date and increment **Version**

**Compliance:**

- All PRs and code reviews MUST verify adherence to these principles
- Complexity that violates principles MUST be justified in `specs/[feature]/plan.md` under "Complexity Tracking"
- Use `AGENTS.md` for runtime development guidance that complements this constitution

**Enforcement:**

- Automated checks (pre-commit hooks, CI linters) SHOULD enforce line count limits where feasible
- Manual review ensures documentation quality and user consent protocol adherence
- Performance budgets monitored via Lighthouse CI or equivalent

**Version**: 1.0.0 | **Ratified**: 2026-02-28 | **Last Amended**: 2026-02-28
